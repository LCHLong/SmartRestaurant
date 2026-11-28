const { API_BASE, authHeaders, internalHeaders } = require('./auth');

async function getAvailableTables(supabase) {
  const { data, error } = await supabase
    .from('tables')
    .select('id, table_number, capacity, status, qr_code_token, is_active')
    .eq('is_active', true)
    .order('table_number', { ascending: true });

  if (error) throw new Error(`Failed to fetch tables: ${error.message}`);
  return data || [];
}

async function getTableByNumber(supabase, tableNumber) {
  const { data, error } = await supabase
    .from('tables')
    .select('id, table_number, capacity, status, qr_code_token, is_active')
    .eq('table_number', tableNumber)
    .single();
  if (error) throw new Error(`Failed to fetch table ${tableNumber}: ${error.message}`);
  return data;
}

async function getMenuItems(supabase, { limit = 20 } = {}) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('id, name, price, status, is_available, category_id')
    .eq('is_available', true)
    .eq('status', 'available')
    .order('price', { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch menu_items: ${error.message}`);
  return data || [];
}

async function getMenuItemWithModifier(supabase) {
  const { data: links } = await supabase
    .from('menu_item_modifier_groups')
    .select('menu_item_id, group_id')
    .limit(10);

  if (!links || links.length === 0) return null;

  for (const link of links) {
    const { data: item } = await supabase
      .from('menu_items')
      .select('id, name, price, status, is_available')
      .eq('id', link.menu_item_id)
      .eq('is_available', true)
      .eq('status', 'available')
      .single();

    if (!item) continue;

    const { data: mods } = await supabase
      .from('modifiers')
      .select('id, name, price_modifier, group_id')
      .eq('group_id', link.group_id)
      .eq('is_available', true)
      .limit(2);

    if (mods && mods.length > 0) {
      return { item, modifiers: mods };
    }
  }
  return null;
}

async function createGuestOrder(request, cleanup, { tableId, qrToken, items, couponCode = null, customerId = null }) {
  const payload = {
    table_id: tableId,
    qr_token: qrToken,
    items,
  };
  if (couponCode) payload.coupon_code = couponCode;
  if (customerId) payload.customer_id = customerId;

  const res = await request.post(`${API_BASE}/api/orders`, { data: payload });
  const body = await res.json();
  if (body && body.order_id) {
    cleanup.trackOrder(body.order_id);
  }
  if (tableId) {
    cleanup.trackTable(tableId);
  }
  return { status: res.status(), body };
}

async function approveOrder(request, waiterToken, orderId) {
  const res = await request.put(`${API_BASE}/api/orders/${orderId}/status`, {
    headers: authHeaders(waiterToken),
    data: { status: 'processing' },
  });
  return { status: res.status(), body: await res.json() };
}

async function addItemsToOrder(request, orderId, { qr_token, items }, token = null) {
  const opts = {
    data: { qr_token, items },
  };
  if (token) opts.headers = authHeaders(token);
  const res = await request.post(`${API_BASE}/api/orders/${orderId}/items`, opts);
  return { status: res.status(), body: await res.json() };
}

async function updateKitchenItem(request, kitchenToken, itemId, status) {
  const res = await request.put(`${API_BASE}/api/kitchen/items/${itemId}`, {
    headers: authHeaders(kitchenToken),
    data: { status },
  });
  return { status: res.status(), body: await res.json() };
}

async function getOrderById(request, orderId) {
  const res = await request.get(`${API_BASE}/api/orders/${orderId}`);
  return { status: res.status(), body: await res.json() };
}

async function createReservation(request, cleanup, payload, { bypassRateLimit = false } = {}) {
  const opts = { data: payload };
  if (bypassRateLimit) {
    opts.headers = internalHeaders();
  }
  const res = await request.post(`${API_BASE}/api/reservations`, opts);
  let body;
  try {
    body = await res.json();
  } catch (_) {
    body = { raw: await res.text() };
  }
  if (body?.data?.id) {
    cleanup.trackReservation(body.data.id);
  }
  return { status: res.status(), body };
}

module.exports = {
  getAvailableTables,
  getTableByNumber,
  getMenuItems,
  getMenuItemWithModifier,
  createGuestOrder,
  approveOrder,
  addItemsToOrder,
  updateKitchenItem,
  getOrderById,
  createReservation,
};
