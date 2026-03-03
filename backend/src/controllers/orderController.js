const supabase = require('../config/supabaseClient');
const { getIO } = require('../config/socket');
const { updateOrderStatusSchema } = require('../utils/validation');

// Utility function to get VAT rate from system settings
const getVATRate = async () => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'vat_rate')
      .single();

    if (error || !data) {
      console.warn('⚠️ Could not fetch VAT rate from system_settings, using default 8%');
      return 8;
    }
    return parseFloat(data.value);
  } catch (err) {
    console.error('Error fetching VAT rate:', err);
    return 8; // Default fallback
  }
};

// Helper: Verify QR Token
const verifyQRTokenInDatabase = async (tableId, token) => {
  if (!tableId || !token) return { success: false, message: 'Missing table ID or QR token' };

  const { data: tableData, error: tableError } = await supabase
    .from('tables')
    .select('qr_code_token, table_number')
    .eq('id', tableId)
    .single();

  if (tableError || !tableData) return { success: false, message: 'Table not found' };

  if (tableData.qr_code_token !== token) {
    return {
      success: false,
      message: 'customer.qr.invalid_desc',
      params: { tableNumber: tableData.table_number }
    };
  }

  return { success: true };
};

// GET /api/waiter/orders
exports.getOrders = async (req, res) => {
  try {
    const status = req.query.status;
    const search = req.query.search;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('orders')
      .select(`
                *,
                payment_status,
                table:tables(id, table_number),
                customer:users(id, full_name, phone),
                items:order_items(
                    id, 
                    quantity, 
                    unit_price, 
                    total_price, 
                    notes, 
                    status,
                    menu_item:menu_items(id, name, image_url),
                    order_item_modifiers(id, modifier_name)
                )
            `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (req.query.is_served) {
      query = query.eq('is_served', req.query.is_served === 'true');
    }

    // Handle search - Supabase doesn't support OR filters on joined tables
    // So we need to fetch and filter in JavaScript
    let data, count;

    if (search) {
      // Fetch all orders with status filter (without pagination first)
      const { data: allOrders, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      console.log(`🔍 Searching for: "${search}" in ${allOrders.length} orders`);

      // Filter in JavaScript by order ID, table number, or customer name
      const searchLower = search.toLowerCase().trim();

      // Extract table number from search query if it contains "bàn" or "table"
      // e.g., "bàn 1" -> "1", "bàn T01" -> "T01"
      let tableSearchTerm = searchLower;
      if (searchLower.includes('bàn')) {
        tableSearchTerm = searchLower.replace(/bàn\s*/gi, '').trim();
      } else if (searchLower.includes('table')) {
        tableSearchTerm = searchLower.replace(/table\s*/gi, '').trim();
      }

      const filteredOrders = allOrders.filter(order => {
        // Search in order ID (partial match)
        if (order.id && order.id.toLowerCase().includes(searchLower)) return true;

        // Search in table number (exact or partial match)
        if (order.tables && order.tables.table_number) {
          const tableNum = order.tables.table_number.toString().toLowerCase();
          // Try both original search and extracted table term
          if (tableNum.includes(searchLower) || tableNum.includes(tableSearchTerm)) {
            return true;
          }
        }

        // Search in customer name (partial match)
        if (order.users && order.users.full_name &&
          order.users.full_name.toLowerCase().includes(searchLower)) return true;

        return false;
      });

      console.log(`✅ Found ${filteredOrders.length} matching orders`);

      // Apply pagination manually
      count = filteredOrders.length;
      data = filteredOrders.slice(offset, offset + limit);
    } else {
      // No search - use normal pagination
      query = query.range(offset, offset + limit - 1);
      const result = await query;

      if (result.error) throw result.error;

      data = result.data;
      count = result.count;
    }



    res.status(200).json({
      success: true,
      data: data,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error("Get Orders Error:", err);
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách đơn hàng', error: err.message });
  }
};

// PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 1. Validation (Strict Input)
    const { error: validationError } = updateOrderStatusSchema.validate({ status });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError.details[0].message });
    }

    // 2. Manual Logic (No RPC/DB Transaction due to constraints)

    // A. Get current order to check transitions and table_id
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('status, table_id')
      .eq('id', id)
      .single();

    if (fetchError || !currentOrder) {
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    }

    // B. Update Order Status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select('*, table:tables(table_number)') // Lấy thêm số bàn để hiển thị log
      .single();

    if (updateError) throw updateError;

    if (status === 'processing') {
      // 1. Chuyển tất cả món 'pending' sang 'preparing'
      await supabase
        .from('order_items')
        .update({ status: 'preparing' })
        .eq('order_id', id)
        .eq('status', 'pending');

      // 2. BẮN SOCKET CHO BẾP
      const io = getIO();
      console.log(`📢 Emit new_order to Kitchen for Order #${id}`);

      io.to('kitchen').emit('new_order', {
        message: 'Có món mới được duyệt',
        order_id: id,
        table_number: updatedOrder.table?.table_number
      });
    }

    // C. Refund voucher if order is cancelled
    if (status === 'cancelled' && updatedOrder.coupon_code) {
      // Get coupon info
      const { data: coupon } = await supabase
        .from('coupons')
        .select('id, used_count')
        .eq('code', updatedOrder.coupon_code)
        .single();

      if (coupon) {
        // Decrement used_count
        await supabase
          .from('coupons')
          .update({ used_count: Math.max(0, coupon.used_count - 1) })
          .eq('id', coupon.id);

        // Delete coupon_usage record if customer exists
        if (updatedOrder.customer_id) {
          await supabase
            .from('coupon_usage')
            .delete()
            .eq('coupon_id', coupon.id)
            .eq('order_id', id);
        }

        console.log(`✅ Refunded voucher ${updatedOrder.coupon_code} for cancelled order #${id}`);
      }
    }

    // D. Automate Table Status (Best effort)
    if (updatedOrder.table_id) {
      let newTableStatus = null;

      // Pending -> Processing => Occupied
      if (status === 'processing' && currentOrder.status === 'pending') {
        newTableStatus = 'occupied';
      }
      // Any -> Completed or Cancelled => Available
      else if (status === 'completed' || status === 'cancelled') {
        newTableStatus = 'available';
      }

      if (newTableStatus && updatedOrder.table_id) {
        await supabase
          .from('tables')
          .update({ status: newTableStatus })
          .eq('id', updatedOrder.table_id);

        const io = getIO();
        io.to('waiter').emit('table_status_update', {
          table_id: updatedOrder.table_id,
          status: newTableStatus
        });
      }
    }

    // 3. Socket Emit (Real-time updates)
    const io = getIO();

    // Notify Waiter Dashboard
    io.to('waiter').emit('order_status_updated', {
      order_id: id,
      status: status,
      updated_at: new Date()
    });

    // Notify specific Table (Customer view)
    if (updatedOrder.table_id) {
      io.to(`table_${updatedOrder.table_id}`).emit('order_status_update', {
        status: status,
        order_id: id
      });
    }


    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: updatedOrder
    });

  } catch (err) {
    console.error("Update Order Status Error:", err);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái', error: err.message });
  }
};

// PUT /api/orders/:id/served
exports.updateOrderServedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_served } = req.body;

    // Validation
    if (typeof is_served !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Trạng thái served phải là boolean' });
    }

    // --- 🟢 FIX: Check if all items are ready ---
    if (is_served) {
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('status')
        .eq('order_id', id);

      if (itemsError) throw itemsError;

      const allReady = orderItems.every(item => item.status === 'ready' || item.status === 'served');
      if (!allReady) {
        return res.status(400).json({ success: false, message: 'Tất cả món ăn phải ở trạng thái Ready mới được phục vụ.' });
      }
    }
    // -------------------------------------------

    // Update Served Status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ is_served, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // --- 🟢 FIX: Update all order_items to served if is_served is true ---
    if (is_served) {
      await supabase
        .from('order_items')
        .update({ status: 'served' })
        .eq('order_id', id)
        .in('status', ['pending', 'preparing', 'ready']); // Chỉ cập nhật các món chưa served/rejected
    }
    // --------------------------------------------------------------------

    // Socket Emit (Real-time updates)
    const io = getIO();
    io.to('waiter').emit('order_served_update', {
      order_id: id,
      is_served: is_served
    });

    // Notify table
    if (updatedOrder.table_id) {
      io.to(`table_${updatedOrder.table_id}`).emit('order_served_update', {
        order_id: id,
        is_served: is_served
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái phục vụ thành công',
      data: updatedOrder
    });

  } catch (err) {
    console.error("Update Order Served Status Error:", err);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái phục vụ', error: err.message });
  }
};

exports.createOrder = async (req, res) => {
  const { table_id, items, customer_id, notes, coupon_code, qr_token } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
  }

  try {
    // --- CHECK QR TOKEN VALIDITY ---
    const qrVerify = await verifyQRTokenInDatabase(table_id, qr_token);
    if (!qrVerify.success) {
      return res.status(401).json({ success: false, message: qrVerify.message });
    }

    // --- CHECK IF TABLE HAS ACTIVE ORDER ---
    // --- CHECK IF TABLE HAS ACTIVE ORDER ---
    const { data: existingOrders, error: orderCheckError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('table_id', table_id)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (orderCheckError) throw orderCheckError;

    // If there's an active order, add items to it instead of creating new order
    if (existingOrders && existingOrders.length > 0) {
      const existingOrderId = existingOrders[0].id;
      // Use addItemsToOrder logic (will implement below)
      return await addItemsToExistingOrder(req, res, existingOrderId, items);
    }

    // No active order, proceed with creating new order
    const { data: tableData, error: tableError } = await supabase
      .from('tables')
      .select('status, table_number')
      .eq('id', table_id)
      .single();

    if (tableError) throw tableError;

    // 1. Lấy giá từ DB (Logic cũ - Giữ nguyên)


    const menuItemIds = items.map(item => item.menu_item_id);
    const { data: dbMenuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, price, name, is_available')
      .in('id', menuItemIds);

    if (menuError) throw menuError;

    // Validation: Check món hết hàng
    const unavailableItems = dbMenuItems.filter(item => !item.is_available);
    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Món "${unavailableItems[0].name}" hiện không có sẵn`
      });
    }

    const menuMap = new Map(dbMenuItems.map(i => [i.id, i]));

    // 2. Tính tiền với thuế VAT
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const dbItem = menuMap.get(item.menu_item_id);
      if (!dbItem) {
        return res.status(400).json({ success: false, message: `Món ăn ID ${item.menu_item_id} không tồn tại` });
      }

      let itemUnitPrice = parseFloat(dbItem.price);
      let modifiersTotal = 0;
      let selectedModsInfo = [];

      // Fetch modifiers info if present
      if (item.modifiers && item.modifiers.length > 0) {
        const { data: modsData, error: modsError } = await supabase
          .from('modifiers')
          .select('*')
          .in('id', item.modifiers);

        if (modsError) throw modsError;

        selectedModsInfo = modsData || [];
        modifiersTotal = selectedModsInfo.reduce((sum, m) => sum + parseFloat(m.price_modifier || 0), 0);
      }

      const itemTotalPrice = (itemUnitPrice + modifiersTotal) * item.quantity;
      subtotal += itemTotalPrice;

      orderItemsData.push({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: itemUnitPrice,
        total_price: itemTotalPrice,
        notes: item.notes,
        selected_modifiers: selectedModsInfo // Keep for step 4
      });
    }

    // Calculate tax
    const vatRate = await getVATRate();
    const taxAmount = subtotal * (vatRate / 100);
    let totalBeforeDiscount = subtotal + taxAmount;

    // 2.5. Validate and apply voucher if provided using couponService
    let discountAmount = 0;
    let validatedCouponCode = null;
    let couponId = null;

    if (coupon_code) {
      const couponService = require('../services/couponService');

      // Use centralized validation service (checks target_type, limit_per_user, etc.)
      const validationResult = await couponService.verifyCouponCondition(
        coupon_code,
        subtotal,
        customer_id
      );

      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          message: validationResult.message
        });
      }

      // Extract validated data
      discountAmount = validationResult.discountAmount;
      validatedCouponCode = coupon_code;
      couponId = validationResult.coupon.id;

      // Increment global usage count
      await supabase
        .from('coupons')
        .update({ used_count: validationResult.coupon.used_count + 1 })
        .eq('id', couponId);
    }

    const totalAmount = totalBeforeDiscount - discountAmount;

    // 3. Insert Order với thuế và voucher
    const { data: newOrder, error: orderInsertError } = await supabase
      .from('orders')
      .insert([{
        table_id,
        customer_id: customer_id || null,
        status: 'pending',
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        coupon_code: validatedCouponCode,
        total_amount: totalAmount,
        payment_method: 'pay_later',
      }])
      .select()
      .single();

    if (orderInsertError) throw orderInsertError;

    // 4. Insert Items (Logic cũ - Giữ nguyên)
    for (const itemData of orderItemsData) {
      const { data: newOrderItem, error: itemInsertError } = await supabase
        .from('order_items')
        .insert([{
          order_id: newOrder.id,
          menu_item_id: itemData.menu_item_id,
          quantity: itemData.quantity,
          unit_price: itemData.unit_price,
          total_price: itemData.total_price,
          notes: itemData.notes,
          status: 'pending' // Mặc định là pending, Bếp chưa thấy
        }])
        .select()
        .single();

      if (itemInsertError) throw itemInsertError;

      // 4.1. Insert Modifiers for this item
      if (itemData.selected_modifiers && itemData.selected_modifiers.length > 0) {
        const modsToInsert = itemData.selected_modifiers.map(m => ({
          order_item_id: newOrderItem.id,
          modifier_id: m.id,
          modifier_name: m.name,
          price_modifier: m.price_modifier
        }));

        const { error: modInsertError } = await supabase
          .from('order_item_modifiers')
          .insert(modsToInsert);

        if (modInsertError) throw modInsertError;
      }
    }

    // 4.5. Record coupon usage for per-user limit tracking
    if (couponId && customer_id) {
      await supabase
        .from('coupon_usage')
        .insert([{
          coupon_id: couponId,
          user_id: customer_id,
          order_id: newOrder.id
        }]);
    }

    // --- 🟢 FIX 2: CẬP NHẬT TRẠNG THÁI BÀN ---
    // Chuyển bàn sang 'occupied' ngay lập tức (Chỉ chạy nếu có table_id hợp lệ)
    if (table_id) {
      await supabase
        .from('tables')
        .update({ status: 'occupied' })
        .eq('id', table_id);
    }
    // -----------------------------------------

    // 5. Bắn Socket
    const io = getIO();

    // --- 🟢 FIX 3: CHỈ BẮN CHO WAITER (BỎ KITCHEN) ---
    // Bếp không cần biết lúc này. Chỉ Waiter cần biết để duyệt.
    io.to('waiter').emit('new_order', {
      order_id: newOrder.id,
      table_id: table_id,
      items: orderItemsData,
      created_at: newOrder.created_at,
      message: `Bàn ${tableData.table_number} vừa đặt món mới`
    });

    if (table_id) {
      io.to('waiter').emit('table_status_update', {
        table_id: table_id,
        status: 'occupied'
      });
    }

    // Báo cho Khách hàng (để chuyển trang Tracking)
    io.to(`table_${table_id}`).emit('order_status_update', {
      status: 'pending',
      order_id: newOrder.id
    });

    res.status(201).json({
      success: true,
      message: 'Đặt món thành công',
      order_id: newOrder.id,
      total_amount: totalAmount
    });

  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ success: false, message: 'Lỗi xử lý đơn hàng', error: err.message });
  }
};

// Get order details by ID
exports.getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch order with nested data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        payment_status,
        table:tables(id, table_number, capacity),
        items:order_items(
          id,
          quantity,
          unit_price,
          total_price,
          notes,
          status,
          menu_item:menu_items(id, name, image_url),
          order_item_modifiers(id, modifier_name)
        )
      `)
      .eq('id', id)
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng'
        });
      }
      throw orderError;
    }

    res.status(200).json({
      success: true,
      data: order
    });

  } catch (err) {
    console.error("Get Order Error:", err);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin đơn hàng',
      error: err.message
    });
  }
};

// Helper function to add items to existing order
const addItemsToExistingOrder = async (req, res, orderId, items) => {
  try {
    // 0. Verify QR Token if provided (required for customer-facing flow)
    const { qr_token } = req.body;
    // We only enforce this if it's NOT a waiter request (waiter doesn't need QR)
    // Simple check: Waiters usually have a token in header, but here we can check if qr_token is sent
    // Actually, for consistency, if qr_token is sent, we verify it.
    if (qr_token) {
      const { data: orderData } = await supabase.from('orders').select('table_id').eq('id', orderId).single();
      if (orderData) {
        const qrVerify = await verifyQRTokenInDatabase(orderData.table_id, qr_token);
        if (!qrVerify.success) {
          return res.status(401).json({ success: false, message: qrVerify.message });
        }
      }
    }

    // 1. Get menu items and modifiers pricing


    const menuItemIds = items.map(item => item.menu_item_id);
    const { data: dbMenuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, price, name, is_available')
      .in('id', menuItemIds);

    if (menuError) throw menuError;

    const unavailableItems = dbMenuItems.filter(item => !item.is_available);
    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Món "${unavailableItems[0].name}" hiện không có sẵn`
      });
    }

    const menuMap = new Map(dbMenuItems.map(i => [i.id, i]));

    // 2. Calculate prices and prepare items
    let additionalSubtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const dbItem = menuMap.get(item.menu_item_id);
      if (!dbItem) {
        return res.status(400).json({ success: false, message: `Món ăn ID ${item.menu_item_id} không tồn tại` });
      }

      let itemUnitPrice = parseFloat(dbItem.price);
      let modifiersTotal = 0;
      let selectedModsInfo = [];

      // Fetch modifiers info if present
      if (item.modifiers && item.modifiers.length > 0) {
        const { data: modsData, error: modsError } = await supabase
          .from('modifiers')
          .select('*')
          .in('id', item.modifiers);

        if (modsError) throw modsError;

        selectedModsInfo = modsData || [];
        modifiersTotal = selectedModsInfo.reduce((sum, m) => sum + parseFloat(m.price_modifier || 0), 0);
      }

      const itemTotalPrice = (itemUnitPrice + modifiersTotal) * item.quantity;
      additionalSubtotal += itemTotalPrice;

      orderItemsData.push({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: itemUnitPrice,
        total_price: itemTotalPrice,
        notes: item.notes,
        selected_modifiers: selectedModsInfo
      });
    }

    // 3. Insert new items
    for (const itemData of orderItemsData) {
      const { data: newOrderItem, error: itemInsertError } = await supabase
        .from('order_items')
        .insert([{
          order_id: orderId,
          menu_item_id: itemData.menu_item_id,
          quantity: itemData.quantity,
          unit_price: itemData.unit_price,
          total_price: itemData.total_price,
          notes: itemData.notes,
          status: 'pending'
        }])
        .select()
        .single();

      if (itemInsertError) throw itemInsertError;

      // 3.1. Insert Modifiers for this item
      if (itemData.selected_modifiers && itemData.selected_modifiers.length > 0) {
        const modsToInsert = itemData.selected_modifiers.map(m => ({
          order_item_id: newOrderItem.id,
          modifier_id: m.id,
          modifier_name: m.name,
          price_modifier: m.price_modifier
        }));

        const { error: modInsertError } = await supabase
          .from('order_item_modifiers')
          .insert(modsToInsert);

        if (modInsertError) throw modInsertError;
      }
    }

    // 4. Update order total amount with tax recalculation and voucher preservation
    const { data: currentOrder, error: fetchOrderError } = await supabase
      .from('orders')
      .select('subtotal, tax_amount, total_amount, table_id, coupon_code, discount_amount')
      .eq('id', orderId)
      .single();

    if (fetchOrderError) throw fetchOrderError;

    const newSubtotal = parseFloat(currentOrder.subtotal || currentOrder.total_amount) + additionalSubtotal;
    const vatRate = await getVATRate();
    const newTaxAmount = newSubtotal * (vatRate / 100);

    // Recalculate discount if voucher exists
    let newDiscountAmount = 0;
    if (currentOrder.coupon_code) {
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', currentOrder.coupon_code)
        .single();

      if (!couponError && coupon) {
        // Recalculate discount based on new subtotal
        if (coupon.discount_type === 'fixed') {
          newDiscountAmount = parseFloat(coupon.discount_value);
        } else {
          newDiscountAmount = (newSubtotal * parseFloat(coupon.discount_value)) / 100;
          if (coupon.max_discount_value && newDiscountAmount > parseFloat(coupon.max_discount_value)) {
            newDiscountAmount = parseFloat(coupon.max_discount_value);
          }
        }
      }
    }

    const newTotalAmount = newSubtotal + newTaxAmount - newDiscountAmount;

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        subtotal: newSubtotal,
        tax_amount: newTaxAmount,
        discount_amount: newDiscountAmount,
        total_amount: newTotalAmount,
        updated_at: new Date()
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // 5. Emit socket event to waiter (use 'new_order' event so waiter sees it)
    const io = getIO();
    const { data: tableInfo } = await supabase
      .from('tables')
      .select('table_number')
      .eq('id', currentOrder.table_id)
      .single();

    io.to('waiter').emit('new_order', {
      order_id: orderId,
      table_id: currentOrder.table_id,
      table_number: tableInfo?.table_number,
      items: orderItemsData,
      message: `Bàn ${tableInfo?.table_number || currentOrder.table_id} vừa gọi thêm ${orderItemsData.length} món`,
      is_additional: true // Flag to indicate this is adding to existing order
    });

    // Notify kitchen if order is already processing
    if (currentOrder.status === 'processing') {
      console.log(`📢 Emit new_order to Kitchen for addition to Order #${orderId}`);
      io.to('kitchen').emit('new_order', {
        message: `Bàn ${tableInfo?.table_number || currentOrder.table_id} gọi thêm món`,
        order_id: orderId,
        table_number: tableInfo?.table_number
      });
    }

    if (currentOrder.table_id) {
      io.to(`table_${currentOrder.table_id}`).emit('order_items_added', {
        order_id: orderId,
        items_added: orderItemsData.length
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đã thêm món vào đơn hàng hiện tại',
      order_id: orderId,
      items_added: orderItemsData.length,
      additional_subtotal: additionalSubtotal,
      new_subtotal: newSubtotal,
      new_tax: newTaxAmount,
      new_discount: newDiscountAmount,
      new_total: newTotalAmount
    });

  } catch (err) {
    console.error("Add Items to Order Error:", err);
    res.status(500).json({ success: false, message: 'Lỗi thêm món vào đơn hàng', error: err.message });
  }
};

exports.addItemsToOrder = async (req, res) => {
  // Support both routes: POST /:id/items (orderId in params) and POST /add-items (orderId in body)
  const orderId = req.params.id || req.body.orderId;
  const { items } = req.body;
  return await addItemsToExistingOrder(req, res, orderId, items);
};

// DELETE /api/orders/:id/items - Reject additional items
exports.rejectAdditionalItems = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { itemIds } = req.body;

    // Validation
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách món cần từ chối'
      });
    }

    // 1. Get items to be rejected (to calculate amount to subtract)
    const { data: itemsToReject, error: fetchError } = await supabase
      .from('order_items')
      .select('id, total_price, order_id, menu_item:menu_items(name)')
      .in('id', itemIds)
      .eq('order_id', orderId)
      .eq('status', 'pending'); // Only allow rejecting pending items

    if (fetchError) throw fetchError;

    if (!itemsToReject || itemsToReject.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy món pending để từ chối'
      });
    }

    // 2. Calculate total amount to subtract
    const subtotalToSubtract = itemsToReject.reduce((sum, item) =>
      sum + parseFloat(item.total_price), 0
    );

    // 3. Delete the rejected items and their modifiers (CASCADE will handle modifiers)
    const { error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .in('id', itemIds);

    if (deleteError) throw deleteError;

    // 4. Update order total amount with tax and voucher recalculation
    const { data: currentOrder, error: fetchOrderError } = await supabase
      .from('orders')
      .select('subtotal, tax_amount, total_amount, table_id, coupon_code, discount_amount')
      .eq('id', orderId)
      .single();

    if (fetchOrderError) throw fetchOrderError;

    const newSubtotal = parseFloat(currentOrder.subtotal || currentOrder.total_amount) - subtotalToSubtract;
    const vatRate = await getVATRate();
    const newTaxAmount = newSubtotal * (vatRate / 100);

    // Recalculate voucher discount if exists
    let newDiscountAmount = 0;
    if (currentOrder.coupon_code) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', currentOrder.coupon_code)
        .single();

      if (coupon) {
        // Recalculate discount based on new subtotal
        if (coupon.discount_type === 'fixed') {
          newDiscountAmount = parseFloat(coupon.discount_value);
        } else {
          newDiscountAmount = (newSubtotal * parseFloat(coupon.discount_value)) / 100;
          if (coupon.max_discount_value && newDiscountAmount > parseFloat(coupon.max_discount_value)) {
            newDiscountAmount = parseFloat(coupon.max_discount_value);
          }
        }
      }
    }

    const newTotalAmount = newSubtotal + newTaxAmount - newDiscountAmount;

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        subtotal: newSubtotal,
        tax_amount: newTaxAmount,
        discount_amount: newDiscountAmount,
        total_amount: newTotalAmount,
        updated_at: new Date()
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // 5. Emit socket event to notify customer
    const io = getIO();
    const { data: tableInfo } = await supabase
      .from('tables')
      .select('table_number')
      .eq('id', currentOrder.table_id)
      .single();

    // Notify customer at the table
    if (currentOrder.table_id) {
      io.to(`table_${currentOrder.table_id}`).emit('additional_items_rejected', {
        order_id: orderId,
        rejected_items: itemsToReject.map(item => ({
          id: item.id,
          name: item.menu_item?.name
        })),
        items_count: itemsToReject.length,
        amount_refunded: subtotalToSubtract,
        new_total: newTotalAmount,
        message: `${itemsToReject.length} món đã bị từ chối bởi nhân viên`
      });
    }

    // Notify waiter room to refresh
    io.to('waiter').emit('order_status_updated', {
      order_id: orderId,
      updated_at: new Date()
    });

    res.status(200).json({
      success: true,
      message: `Đã từ chối ${itemsToReject.length} món`,
      rejected_count: itemsToReject.length,
      subtotal_refunded: subtotalToSubtract,
      new_subtotal: newSubtotal,
      new_tax: newTaxAmount,
      new_total: newTotalAmount
    });

  } catch (err) {
    console.error("Reject Additional Items Error:", err);
    res.status(500).json({
      success: false,
      message: 'Lỗi từ chối món ăn',
      error: err.message
    });
  }
};


// POST /api/orders/:id/checkout - Thanh toán
exports.checkoutOrder = async (req, res) => {
  const { id } = req.params;
  const { payment_method } = req.body; // 'cash', 'card', 'transfer'...

  try {
    // 1. Lấy thông tin đơn hàng hiện tại
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, table_id, status, total_amount')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Đơn hàng này đã kết thúc' });
    }

    // 2. Cập nhật trạng thái đơn hàng -> 'completed'
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        payment_status: 'paid',
        payment_method: payment_method || 'cash',
        updated_at: new Date()
      })
      .eq('id', id);

    if (updateOrderError) throw updateOrderError;

    // 3. Giải phóng bàn -> 'available'
    if (order.table_id) {
      const { error: updateTableError } = await supabase
        .from('tables')
        .update({ status: 'available' })
        .eq('id', order.table_id);

      if (updateTableError) throw updateTableError;

      // 4. 🔥 BẮN SOCKET THÔNG BÁO BÀN TRỐNG 🔥
      const io = getIO();

      // Bắn sự kiện này để Admin/Waiter cập nhật lại danh sách bàn
      io.to('waiter').emit('table_status_update', {
        table_id: order.table_id,
        status: 'available'
      });

      // Bắn sự kiện cập nhật đơn hàng (để danh sách đơn biến mất hoặc chuyển tab)
      io.to('waiter').emit('order_status_updated', {
        order_id: id,
        status: 'completed'
      });

      // Bắn cho bếp (để xóa đơn khỏi màn hình bếp nếu cần)
      io.to('kitchen').emit('order_status_updated', {
        order_id: id,
        status: 'completed'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Thanh toán thành công. Bàn đã được giải phóng.',
      order_id: id
    });

  } catch (err) {
    console.error("Checkout Order Error:", err);
    res.status(500).json({ success: false, message: 'Lỗi thanh toán', error: err.message });
  }
};

// GET /api/orders/my-orders - Get all orders for logged-in customer
exports.getCustomerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const customerId = req.user?.id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để xem đơn hàng'
      });
    }

    const offset = (page - 1) * limit;

    let query = supabase
      .from('orders')
      .select(`
        id,
        table_id,
        status,
        total_amount,
        created_at,
        table:tables(table_number),
        items:order_items(id)
      `, { count: 'exact' })
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const formattedData = data.map(order => ({
      id: order.id,
      table_number: order.table?.table_number || 'N/A',
      status: order.status,
      total_amount: order.total_amount,
      created_at: order.created_at,
      items_count: order.items?.length || 0
    }));

    res.status(200).json({
      success: true,
      data: formattedData,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (err) {
    console.error("Get Customer Orders Error:", err);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách đơn hàng',
      error: err.message
    });
  }
};

// POST /api/orders/lookup - Lookup orders by IDs (for guests)
exports.lookupOrders = async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        table_id,
        status,
        total_amount,
        created_at,
        table:tables(table_number),
        items:order_items(count)
      `)
      .in('id', orderIds)
      .in('status', ['pending', 'processing', 'completed', 'cancelled']) // Fetch all status
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedData = orders.map(order => ({
      id: order.id,
      table_number: order.table?.table_number || 'N/A',
      status: order.status,
      total_amount: order.total_amount,
      created_at: order.created_at,
      items_count: order.items?.[0]?.count || 0
    }));

    res.status(200).json({
      success: true,
      data: formattedData
    });

  } catch (err) {
    console.error("Lookup Orders Error:", err);
    res.status(500).json({ success: false, message: 'Lỗi tra cứu đơn hàng', error: err.message });
  }
};
