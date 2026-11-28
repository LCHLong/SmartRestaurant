const { test, expect } = require('./fixtures/audit-fixture');
const { API_BASE, loginAs, authHeaders, internalHeaders } = require('./helpers/auth');
const {
  getAvailableTables,
  getTableByNumber,
  getMenuItems,
  createGuestOrder,
  approveOrder,
  addItemsToOrder,
  updateKitchenItem,
  getOrderById,
  createReservation,
} = require('./helpers/api');
const { connectSocket, sleep } = require('./helpers/socket');

const SOCKET_TIMEOUT = 1500;

test.describe('Backend & Socket.IO Realtime Sync and Integrity Audit', () => {
  test('TC_SYNC_BASE_001: Baseline order creation emits new_order, table_status_update, and order_status_update < 1500ms', async ({
    request,
    supabase,
    cleanup,
    sockets,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BASE_001',
      module: 'Order',
      scenario: 'Guest creates order via QR; Waiter & Guest table rooms receive sync events < 1500ms',
      preConditions: 'Table A1 available; Waiter & Guest sockets joined to waiter and table_<A1> rooms',
      steps: [
        '1. Connect Waiter socket (waiter room) and Guest socket (table_<A1> room)',
        '2. Guest sends POST /api/orders with valid table_id, qr_token, and 1 menu item',
        '3. Verify Waiter receives new_order & table_status_update and Guest receives order_status_update < 1500ms',
      ],
      testData: { table: 'A1', endpoint: 'POST /api/orders' },
      expectedBehavior: 'HTTP 201 and all 3 Socket.IO events received within 1500ms',
      passActualResult: 'HTTP 201; new_order, table_status_update (occupied), and order_status_update (pending) all received < 1500ms',
      severity: 'LOW',
      affectedComponents: { backend: 'orderController.js:createOrder', socket: 'waiter, table_<id>' },
    });

    const waiterAuth = await loginAs(request, 'waiter');
    const tableA1 = await getTableByNumber(supabase, 'A1');
    const items = await getMenuItems(supabase, { limit: 5 });

    const waiterSocket = await connectSocket({
      token: waiterAuth.token,
      rooms: ['waiter'],
      registry: sockets,
    });
    const guestSocket = await connectSocket({
      rooms: [`table_${tableA1.id}`],
      registry: sockets,
    });

    const newOrderPromise = waiterSocket.waitForEvent('new_order', (d) => d.table_id === tableA1.id, SOCKET_TIMEOUT);
    const tableStatusPromise = waiterSocket.waitForEvent(
      'table_status_update',
      (d) => d.table_id === tableA1.id && d.status === 'occupied',
      SOCKET_TIMEOUT
    );
    const guestOrderPromise = guestSocket.waitForEvent(
      'order_status_update',
      (d) => d.status === 'pending',
      SOCKET_TIMEOUT
    );

    const { status, body } = await createGuestOrder(request, cleanup, {
      tableId: tableA1.id,
      qrToken: tableA1.qr_code_token,
      items: [{ menu_item_id: items[0].id, quantity: 1 }],
    });

    expect(status).toBe(201);
    expect(body.success).toBe(true);

    const [waiterOrderEvt, tableEvt, guestEvt] = await Promise.all([
      newOrderPromise,
      tableStatusPromise,
      guestOrderPromise,
    ]);
    expect(waiterOrderEvt.order_id).toBe(body.order_id);
    expect(tableEvt.status).toBe('occupied');
    expect(guestEvt.order_id).toBe(body.order_id);
  });

  test('TC_SYNC_BASE_002: Baseline cash payment flow syncs Waiter, Kitchen, Guest rooms and DB < 1500ms', async ({
    request,
    supabase,
    cleanup,
    sockets,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BASE_002',
      module: 'Payment',
      scenario: 'Customer requests cash payment and Waiter confirms cash; all rooms and DB sync < 1500ms',
      preConditions: 'Order on Table A1 in processing status; Waiter, Kitchen, Guest sockets connected',
      steps: [
        '1. Create & approve order on Table A1',
        '2. POST /api/payment/create-intent with paymentMethod=cash',
        '3. Waiter sends POST /api/payment/confirm-cash',
        '4. Assert order_paid, payment_success, table_status_update < 1500ms and DB updated',
      ],
      testData: { table: 'A1', paymentMethod: 'cash' },
      expectedBehavior: 'All rooms receive payment sync < 1500ms; DB order=completed/paid, table=available, items=served',
      passActualResult: 'All rooms received cash payment events < 1500ms and DB state verified clean',
      severity: 'LOW',
      affectedComponents: { backend: 'paymentController.js:createPaymentIntent,confirmCashPayment' },
    });

    const waiterAuth = await loginAs(request, 'waiter');
    const tableA1 = await getTableByNumber(supabase, 'A1');
    const items = await getMenuItems(supabase, { limit: 5 });

    const created = await createGuestOrder(request, cleanup, {
      tableId: tableA1.id,
      qrToken: tableA1.qr_code_token,
      items: [{ menu_item_id: items[0].id, quantity: 1 }],
    });
    expect(created.status).toBe(201);
    const orderId = created.body.order_id;
    await approveOrder(request, waiterAuth.token, orderId);

    const waiterSocket = await connectSocket({ token: waiterAuth.token, rooms: ['waiter'], registry: sockets });
    const kitchenAuth = await loginAs(request, 'kitchen');
    const kitchenSocket = await connectSocket({ token: kitchenAuth.token, rooms: ['kitchen'], registry: sockets });
    const guestSocket = await connectSocket({ rooms: [`table_${tableA1.id}`], registry: sockets });

    const reqWaiterP = waiterSocket.waitForEvent('payment_request', (d) => d.orderId === orderId, SOCKET_TIMEOUT);
    const reqGuestP = guestSocket.waitForEvent('payment_status_update', (d) => d.orderId === orderId, SOCKET_TIMEOUT);

    const intentRes = await request.post(`${API_BASE}/api/payment/create-intent`, {
      data: { orderId, paymentMethod: 'cash' },
    });
    expect(intentRes.status()).toBe(200);
    await Promise.all([reqWaiterP, reqGuestP]);

    const paidWaiterP = waiterSocket.waitForEvent('order_paid', (d) => d.orderId === orderId, SOCKET_TIMEOUT);
    const paidKitchenP = kitchenSocket.waitForEvent('order_paid', (d) => d.orderId === orderId, SOCKET_TIMEOUT);
    const paidGuestP = guestSocket.waitForEvent('payment_success', (d) => d.orderId === orderId, SOCKET_TIMEOUT);
    const tblAvailP = waiterSocket.waitForEvent(
      'table_status_update',
      (d) => d.table_id === tableA1.id && d.status === 'available',
      SOCKET_TIMEOUT
    );

    const confirmRes = await request.post(`${API_BASE}/api/payment/confirm-cash`, {
      headers: authHeaders(waiterAuth.token),
      data: { orderId },
    });
    expect(confirmRes.status()).toBe(200);
    await Promise.all([paidWaiterP, paidKitchenP, paidGuestP, tblAvailP]);

    const { data: orderRow } = await supabase.from('orders').select('status, payment_status').eq('id', orderId).single();
    const { data: tableRow } = await supabase.from('tables').select('status').eq('id', tableA1.id).single();
    const { data: itemRows } = await supabase.from('order_items').select('status').eq('order_id', orderId);

    expect(orderRow.status).toBe('completed');
    expect(orderRow.payment_status).toBe('paid');
    expect(tableRow.status).toBe('available');
    expect(itemRows.every((r) => r.status === 'served')).toBe(true);
  });

  test('TC_SYNC_BASE_003: Baseline reservation create and secure lookup masks customer phone', async ({
    request,
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BASE_003',
      module: 'Reservation',
      scenario: 'Create reservation on free slot and lookup by booking_code + last 4 phone digits',
      preConditions: 'Slot 2026-12-24 18:00 free for 2 guests',
      steps: [
        '1. POST /api/reservations for 2026-12-24 18:00 (2 guests)',
        '2. GET /api/reservations/lookup with booking_code & phone_last4=4999',
        '3. Verify 201 create, assigned table_id in DB, and masked phone in lookup',
      ],
      testData: { date: '2026-12-24', time: '18:00', guest_count: 2 },
      expectedBehavior: 'Reservation created with table_id & booking_code; lookup returns masked phone',
      passActualResult: 'Reservation created (201), DB table_id assigned, and lookup returned 200 with masked phone 0901***999',
      severity: 'LOW',
      affectedComponents: { backend: 'reservationController.js:createReservation,lookupReservation' },
    });

    const { status, body } = await createReservation(
      request,
      cleanup,
      {
        customer_name: 'Audit Base Guest',
        customer_phone: '0901234999',
        guest_count: 2,
        reservation_date: '2026-12-24',
        reservation_time: '18:00',
      },
      { bypassRateLimit: true }
    );

    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.booking_code).toBeTruthy();

    const { data: resvRow } = await supabase
      .from('reservations')
      .select('id, table_id')
      .eq('id', body.data.id)
      .single();
    expect(resvRow.table_id).toBeTruthy();

    const lookupRes = await request.get(
      `${API_BASE}/api/reservations/lookup?booking_code=${encodeURIComponent(body.data.booking_code)}&phone_last4=4999`
    );
    expect(lookupRes.status()).toBe(200);
    const lookupBody = await lookupRes.json();
    expect(lookupBody.data.customer_phone).toMatch(/\*\*\*/);
  });

  test('TC_SYNC_BE_A01: Adding items to processing order must notify Kitchen room < 1500ms', async ({
    request,
    supabase,
    cleanup,
    sockets,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BE_A01',
      module: 'Order',
      scenario: 'Guest adds items to an active processing order; Kitchen socket must receive new_order < 1500ms',
      preConditions: 'Order on Table A1 approved (status=processing); Kitchen socket joined to kitchen room',
      steps: [
        '1. Create order on A1 and approve to processing',
        '2. Connect Kitchen socket to kitchen room and clear buffer',
        '3. POST /api/orders/:id/items with additional menu item',
        '4. Assert Kitchen socket receives new_order within 1500ms',
      ],
      testData: { table: 'A1', endpoint: 'POST /api/orders/:id/items' },
      expectedBehavior: 'Kitchen room receives new_order event within 1500ms for added items',
      failActualResult: 'Kitchen room received ZERO events when items were added to processing order',
      defectId: 'BE-A01',
      severity: 'CRITICAL',
      rootCause: 'backend/src/controllers/orderController.js:825 omits status & customer_id from .select(), making currentOrder.status === "processing" always false at line 890',
      proposedFix: 'Include status and customer_id in .select() at orderController.js:825',
      affectedComponents: { backend: 'orderController.js:823-827,890-897', database: 'orders' },
    });

    const waiterAuth = await loginAs(request, 'waiter');
    const kitchenAuth = await loginAs(request, 'kitchen');
    const tableA1 = await getTableByNumber(supabase, 'A1');
    const items = await getMenuItems(supabase, { limit: 5 });

    const created = await createGuestOrder(request, cleanup, {
      tableId: tableA1.id,
      qrToken: tableA1.qr_code_token,
      items: [{ menu_item_id: items[0].id, quantity: 1 }],
    });
    const orderId = created.body.order_id;
    await approveOrder(request, waiterAuth.token, orderId);

    const kitchenSocket = await connectSocket({ token: kitchenAuth.token, rooms: ['kitchen'], registry: sockets });
    kitchenSocket.clearBuffers();

    const addRes = await addItemsToOrder(request, orderId, {
      qr_token: tableA1.qr_code_token,
      items: [{ menu_item_id: items[1].id, quantity: 1 }],
    });
    expect(addRes.status).toBe(200);

    const evt = await kitchenSocket.waitForEvent('new_order', (d) => d.order_id === orderId, SOCKET_TIMEOUT);
    expect(evt.order_id).toBe(orderId);
  });

  test('TC_SYNC_BE_A02: Stripe payment_intent.succeeded webhook must return 200, emit to table_<tableId>, and free table', async ({
    request,
    supabase,
    cleanup,
    sockets,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BE_A02',
      module: 'Payment',
      scenario: 'Stripe payment_intent.succeeded webhook updates order, notifies table_<table_id>, releases table & sets items served',
      preConditions: 'Order on Table A1 in processing status; Guest socket joined to table_<A1.id>',
      steps: [
        '1. Create & approve order on Table A1',
        '2. Connect Guest socket to table_<A1.id>',
        '3. POST /api/payment/webhook with payment_intent.succeeded payload',
        '4. Assert HTTP 200, payment_success on table_<A1.id> < 1500ms, table available, items served',
      ],
      testData: { endpoint: 'POST /api/payment/webhook', eventType: 'payment_intent.succeeded' },
      expectedBehavior: 'HTTP 200, payment_success emitted to table_<tableId> < 1500ms, table available, items served',
      failActualResult: 'Webhook crashed with HTTP 500 (ReferenceError: orderInfo is not defined) and emitted to wrong room table_<orderId>',
      defectId: 'BE-A02',
      severity: 'CRITICAL',
      rootCause: 'backend/src/controllers/paymentController.js:266 emits to table_${orderId} instead of table_${tableId}, and line 270 references undeclared variable orderInfo',
      proposedFix: 'Fetch order.table_id before emitting, emit to table_${order.table_id}, and wrap webhook in try/catch with strict signature verification',
      affectedComponents: { backend: 'paymentController.js:203-283', database: 'orders, payments, tables, order_items' },
    });

    const waiterAuth = await loginAs(request, 'waiter');
    const tableA1 = await getTableByNumber(supabase, 'A1');
    const items = await getMenuItems(supabase, { limit: 5 });

    const created = await createGuestOrder(request, cleanup, {
      tableId: tableA1.id,
      qrToken: tableA1.qr_code_token,
      items: [{ menu_item_id: items[0].id, quantity: 1 }],
    });
    const orderId = created.body.order_id;
    await approveOrder(request, waiterAuth.token, orderId);

    const guestSocket = await connectSocket({ rooms: [`table_${tableA1.id}`], registry: sockets });

    const webhookRes = await request.post(`${API_BASE}/api/payment/webhook`, {
      data: {
        id: `evt_audit_${Date.now()}`,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: `pi_audit_${Date.now()}`,
            amount: created.body.total_amount,
            metadata: { orderId },
          },
        },
      },
    });

    expect.soft(webhookRes.status(), 'Webhook must return HTTP 200').toBe(200);
    let webhookSocketErr = null;
    try {
      await guestSocket.waitForEvent('payment_success', (d) => d.orderId === orderId, SOCKET_TIMEOUT);
    } catch (err) {
      webhookSocketErr = err.message;
    }
    expect.soft(webhookSocketErr, 'table_<tableId> must receive payment_success < 1500ms').toBeNull();

    const { data: tbl } = await supabase.from('tables').select('status').eq('id', tableA1.id).single();
    expect.soft(tbl.status, 'Table must be released to available after webhook').toBe('available');
  });

  test('TC_SYNC_BE_A03: checkoutOrder must notify table_<table_id> customer room and mark order_items served', async ({
    request,
    supabase,
    cleanup,
    sockets,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BE_A03',
      module: 'Order',
      scenario: 'POST /api/orders/:id/checkout notifies table_<table_id> and updates order_items to served',
      preConditions: 'Order on Table A1 in processing status; Guest socket in table_<A1.id>',
      steps: [
        '1. Create & approve order on Table A1',
        '2. Connect Guest socket to table_<A1.id>',
        '3. POST /api/orders/:id/checkout { payment_method: "cash" }',
        '4. Assert table_<A1.id> receives payment_success/order_status_update < 1500ms and items are served',
      ],
      testData: { endpoint: 'POST /api/orders/:id/checkout', payment_method: 'cash' },
      expectedBehavior: 'Guest room receives completion/payment socket event < 1500ms and all order_items become served',
      failActualResult: 'Customer room received zero events and order_items remained preparing',
      defectId: 'BE-A03',
      severity: 'CRITICAL',
      rootCause: 'backend/src/controllers/orderController.js:1087-1161 (checkoutOrder) emits only to waiter/kitchen rooms, omitting table_${order.table_id} and order_items status update',
      proposedFix: 'Emit payment_success & order_status_update to table_${order.table_id} and update order_items to served',
      affectedComponents: { backend: 'orderController.js:1087-1161', database: 'orders, order_items, tables' },
    });

    const waiterAuth = await loginAs(request, 'waiter');
    const tableA1 = await getTableByNumber(supabase, 'A1');
    const items = await getMenuItems(supabase, { limit: 5 });

    const created = await createGuestOrder(request, cleanup, {
      tableId: tableA1.id,
      qrToken: tableA1.qr_code_token,
      items: [{ menu_item_id: items[0].id, quantity: 1 }],
    });
    const orderId = created.body.order_id;
    await approveOrder(request, waiterAuth.token, orderId);

    const guestSocket = await connectSocket({ rooms: [`table_${tableA1.id}`], registry: sockets });
    guestSocket.clearBuffers();

    const res = await request.post(`${API_BASE}/api/orders/${orderId}/checkout`, {
      headers: authHeaders(waiterAuth.token),
      data: { payment_method: 'cash' },
    });
    expect(res.status()).toBe(200);

    let customerSocketErr = null;
    try {
      await Promise.race([
        guestSocket.waitForEvent('payment_success', () => true, SOCKET_TIMEOUT),
        guestSocket.waitForEvent('order_status_update', (d) => d.status === 'completed', SOCKET_TIMEOUT),
      ]);
    } catch (err) {
      customerSocketErr = err.message;
    }
    expect.soft(customerSocketErr, 'table_<tableId> must receive payment_success/order_status_update < 1500ms').toBeNull();

    const { data: itemRows } = await supabase.from('order_items').select('status').eq('order_id', orderId);
    expect.soft(itemRows.every((r) => r.status === 'served'), 'All order_items must be updated to served').toBe(true);
  });

  test('TC_SYNC_BE_A04: PATCH /api/admin/tables/:id/status must emit table status socket event < 1500ms', async ({
    request,
    supabase,
    cleanup,
    sockets,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BE_A04',
      module: 'Table',
      scenario: 'Updating table status via PATCH /api/admin/tables/:id/status emits realtime event to waiter/admin',
      preConditions: 'Table A1 available; Waiter socket joined to waiter room; authenticated as waiter02',
      steps: [
        '1. Connect Waiter socket to waiter room',
        '2. PATCH /api/admin/tables/:id/status { status: "reserved" } using waiter02 token',
        '3. Assert table_status_update or table_updated event arrives < 1500ms',
      ],
      testData: { table: 'A1', status: 'reserved', endpoint: 'PATCH /api/admin/tables/:id/status' },
      expectedBehavior: 'Waiter socket receives table_status_update or table_updated within 1500ms',
      failActualResult: 'HTTP 200 returned, but zero Socket.IO events emitted to waiter or admin rooms',
      defectId: 'BE-A04',
      severity: 'CRITICAL',
      rootCause: 'backend/src/controllers/tableController.js:564-585 (updateTableStatus) updates Supabase without calling getIO().emit(...)',
      proposedFix: 'Emit canonical table_status_update to waiter and admin rooms after updating tables.status',
      affectedComponents: { backend: 'tableController.js:564-585', frontend: 'TableMapPage.jsx, TableManagement.jsx' },
    });

    const waiterAuth = await loginAs(request, 'waiter');
    const tableA1 = await getTableByNumber(supabase, 'A1');
    cleanup.trackTable(tableA1.id);

    const waiterSocket = await connectSocket({ token: waiterAuth.token, rooms: ['waiter'], registry: sockets });

    const res = await request.patch(`${API_BASE}/api/admin/tables/${tableA1.id}/status`, {
      headers: authHeaders(waiterAuth.token),
      data: { status: 'reserved' },
    });
    expect(res.status()).toBe(200);

    await Promise.race([
      waiterSocket.waitForEvent('table_status_update', (d) => d.table_id === tableA1.id, SOCKET_TIMEOUT),
      waiterSocket.waitForEvent('table_updated', (d) => d.id === tableA1.id, SOCKET_TIMEOUT),
    ]);
  });

  test('TC_SYNC_BE_A05: Concurrent reservation requests for the last slot/table must prevent TOCTOU double-booking', async ({
    request,
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BE_A05',
      module: 'Reservation',
      scenario: 'Two simultaneous POST /api/reservations for 9 guests when only table C5 (cap 10) is free must allow at most 1 booking',
      preConditions: 'Table C4 (cap 10) pre-booked at 2026-12-25 19:00, leaving only C5 free for 9 guests',
      steps: [
        '1. Seed confirmed reservation on C4 for 2026-12-25 19:00',
        '2. Fire Promise.all of two POST /api/reservations (guest_count=9, 2026-12-25 19:00)',
        '3. Assert at most 1 succeeds (201) and the other fails (409), with <= 1 active reservation on C5',
      ],
      testData: { date: '2026-12-25', time: '19:00', guest_count: 9, capacity10Tables: ['C4', 'C5'] },
      expectedBehavior: 'Atomic exclusion: 1 succeeds (201) and 1 returns 409 RESERVATION_CONFLICT',
      failActualResult: 'Both concurrent requests returned HTTP 201 and double-booked the exact same table_id (C5)',
      defectId: 'BE-A05',
      severity: 'CRITICAL',
      rootCause: 'backend/src/controllers/reservationController.js:337-437 performs non-atomic check-then-insert in Node.js without PostgreSQL lock or EXCLUDE constraint',
      proposedFix: 'Use PostgreSQL RPC with advisory lock / SELECT FOR UPDATE and add EXCLUDE USING gist constraint on reservations',
      affectedComponents: { backend: 'reservationController.js:337-437', database: '30_add_reservations_and_shifts.sql' },
    });

    const tableC4 = await getTableByNumber(supabase, 'C4');
    const tableC5 = await getTableByNumber(supabase, 'C5');

    const { data: seedRes, error: seedErr } = await supabase
      .from('reservations')
      .insert([
        {
          customer_name: 'Audit Prebook C4',
          customer_phone: '0909000111',
          guest_count: 9,
          reservation_date: '2026-12-25',
          reservation_time: '19:00',
          end_time: '20:30',
          status: 'confirmed',
          table_id: tableC4.id,
          booking_code: `RES-C4-${Date.now().toString().slice(-5)}`,
        },
      ])
      .select()
      .single();
    if (seedErr) throw new Error(`Seed C4 reservation failed: ${seedErr.message}`);
    cleanup.trackReservation(seedRes.id);

    const [r1, r2] = await Promise.all([
      createReservation(
        request,
        cleanup,
        {
          customer_name: 'Concurrent Guest 1',
          customer_phone: '0901111222',
          guest_count: 9,
          reservation_date: '2026-12-25',
          reservation_time: '19:00',
        },
        { bypassRateLimit: true }
      ),
      createReservation(
        request,
        cleanup,
        {
          customer_name: 'Concurrent Guest 2',
          customer_phone: '0903333444',
          guest_count: 9,
          reservation_date: '2026-12-25',
          reservation_time: '19:00',
        },
        { bypassRateLimit: true }
      ),
    ]);

    const { data: c5Rows } = await supabase
      .from('reservations')
      .select('id, table_id, status')
      .eq('table_id', tableC5.id)
      .eq('reservation_date', '2026-12-25')
      .in('status', ['pending', 'confirmed', 'seated']);

    const successCount = [r1, r2].filter((r) => r.status === 201).length;
    expect.soft(successCount, 'At most 1 concurrent reservation request may succeed (201)').toBeLessThanOrEqual(1);
    expect.soft((c5Rows || []).length, 'Table C5 must have at most 1 active reservation').toBeLessThanOrEqual(1);
  });

  test('TC_SYNC_BE_A07: Admin socket room must receive order/kitchen/table/payment realtime events', async ({
    request,
    supabase,
    cleanup,
    sockets,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BE_A07',
      module: 'Socket/Security',
      scenario: 'Admin room socket receives realtime events across order, kitchen, and payment lifecycle',
      preConditions: 'SuperAdmin socket authenticated and joined to admin room',
      steps: [
        '1. Connect superAdmin socket to admin room',
        '2. Create order -> approve processing -> kitchen ready -> confirm cash payment',
        '3. Assert admin room receives at least one realtime event < 1500ms',
      ],
      testData: { room: 'admin', role: 'super_admin' },
      expectedBehavior: 'Admin room receives order/kitchen/payment/table socket events < 1500ms',
      failActualResult: 'Admin room received 0 events across entire order-kitchen-payment lifecycle',
      defectId: 'BE-A07',
      severity: 'HIGH',
      rootCause: 'orderController.js, kitchenController.js, paymentController.js, and tableController.js emit only to waiter/kitchen/table_* and never to admin room',
      proposedFix: 'Emit order, kitchen, table, and payment lifecycle events to io.to("admin") as well',
      affectedComponents: { backend: 'orderController.js, kitchenController.js, paymentController.js, tableController.js' },
    });

    const superAuth = await loginAs(request, 'superAdmin');
    const waiterAuth = await loginAs(request, 'waiter');
    const kitchenAuth = await loginAs(request, 'kitchen');
    const tableA1 = await getTableByNumber(supabase, 'A1');
    const items = await getMenuItems(supabase, { limit: 5 });

    const adminSocket = await connectSocket({ token: superAuth.token, rooms: ['admin'], registry: sockets });
    expect(adminSocket.errors.length).toBe(0);

    const created = await createGuestOrder(request, cleanup, {
      tableId: tableA1.id,
      qrToken: tableA1.qr_code_token,
      items: [{ menu_item_id: items[0].id, quantity: 1 }],
    });
    const orderId = created.body.order_id;
    await approveOrder(request, waiterAuth.token, orderId);

    const { data: orderItems } = await supabase.from('order_items').select('id').eq('order_id', orderId);
    await updateKitchenItem(request, kitchenAuth.token, orderItems[0].id, 'ready');

    await request.post(`${API_BASE}/api/payment/confirm-cash`, {
      headers: authHeaders(waiterAuth.token),
      data: { orderId },
    });

    await sleep(600);
    expect(adminSocket.events.length).toBeGreaterThan(0);
  });

  test('TC_SYNC_BE_A08: Kitchen rejecting an item must recalculate order subtotal, tax_amount, and total_amount', async ({
    request,
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BE_A08',
      module: 'Kitchen',
      scenario: 'When Kitchen rejects an item via PUT /api/kitchen/items/:id, order totals must decrease accordingly',
      preConditions: 'Processing order with 2 distinct items on Table A1',
      steps: [
        '1. Create order with 2 items and approve to processing',
        '2. Record initial orders.total_amount',
        '3. Kitchen calls PUT /api/kitchen/items/:item2Id { status: "rejected" }',
        '4. Assert orders.total_amount decreased to exclude rejected item price',
      ],
      testData: { endpoint: 'PUT /api/kitchen/items/:id', status: 'rejected' },
      expectedBehavior: 'orders.subtotal, tax_amount, and total_amount decrease to exclude rejected item',
      failActualResult: 'orders.total_amount remained unchanged after kitchen rejected item',
      defectId: 'BE-A08',
      severity: 'HIGH',
      rootCause: 'backend/src/controllers/kitchenController.js:49-137 updates order_items.status to rejected without recalculating parent orders financials',
      proposedFix: 'Recalculate order subtotal, tax, discount, and total_amount when kitchen sets item status=rejected, and guard invalid transitions',
      affectedComponents: { backend: 'kitchenController.js:49-137', database: 'orders, order_items' },
    });

    const waiterAuth = await loginAs(request, 'waiter');
    const kitchenAuth = await loginAs(request, 'kitchen');
    const tableA1 = await getTableByNumber(supabase, 'A1');
    const items = await getMenuItems(supabase, { limit: 5 });

    const created = await createGuestOrder(request, cleanup, {
      tableId: tableA1.id,
      qrToken: tableA1.qr_code_token,
      items: [
        { menu_item_id: items[0].id, quantity: 1 },
        { menu_item_id: items[1].id, quantity: 1 },
      ],
    });
    const orderId = created.body.order_id;
    const initialTotal = Number(created.body.total_amount);
    await approveOrder(request, waiterAuth.token, orderId);

    const { data: orderItems } = await supabase.from('order_items').select('id').eq('order_id', orderId);
    const rejRes = await updateKitchenItem(request, kitchenAuth.token, orderItems[1].id, 'rejected');
    expect(rejRes.status).toBe(200);

    const { data: updatedOrder } = await supabase
      .from('orders')
      .select('subtotal, tax_amount, total_amount')
      .eq('id', orderId)
      .single();

    expect(Number(updatedOrder.total_amount)).toBeLessThan(initialTotal);
  });

  test('TC_SYNC_BE_A10: Completed order must reject status rollback or cancellation via PUT /api/orders/:id/status', async ({
    request,
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BE_A10',
      module: 'Order',
      scenario: 'Completed/paid order cannot be transitioned to cancelled or mutated',
      preConditions: 'Order on A1 marked completed/paid via confirm-cash',
      steps: [
        '1. Create order, approve, and confirm cash payment (status=completed)',
        '2. Waiter sends PUT /api/orders/:id/status { status: "cancelled" }',
        '3. Assert HTTP 400/409 and DB status remains completed',
      ],
      testData: { endpoint: 'PUT /api/orders/:id/status', targetStatus: 'cancelled' },
      expectedBehavior: 'HTTP 400 or 409 rejecting transition out of terminal completed state',
      failActualResult: 'Returned HTTP 200 and mutated completed order status to cancelled',
      defectId: 'BE-A10',
      severity: 'HIGH',
      rootCause: 'backend/src/controllers/orderController.js:164-296 fetches currentOrder.status but never enforces a transition state machine',
      proposedFix: 'Enforce allowed status transitions (reject mutations on completed/cancelled orders)',
      affectedComponents: { backend: 'orderController.js:164-296,699-724' },
    });

    const waiterAuth = await loginAs(request, 'waiter');
    const tableA1 = await getTableByNumber(supabase, 'A1');
    const items = await getMenuItems(supabase, { limit: 5 });

    const created = await createGuestOrder(request, cleanup, {
      tableId: tableA1.id,
      qrToken: tableA1.qr_code_token,
      items: [{ menu_item_id: items[0].id, quantity: 1 }],
    });
    const orderId = created.body.order_id;
    await approveOrder(request, waiterAuth.token, orderId);
    await request.post(`${API_BASE}/api/payment/confirm-cash`, {
      headers: authHeaders(waiterAuth.token),
      data: { orderId },
    });

    const mutRes = await request.put(`${API_BASE}/api/orders/${orderId}/status`, {
      headers: authHeaders(waiterAuth.token),
      data: { status: 'cancelled' },
    });

    expect([400, 409]).toContain(mutRes.status());
  });

  test('TC_SYNC_BE_A11: reallocateTable must not assign a table that already has an overlapping reservation', async ({
    request,
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BE_A11',
      module: 'Reservation',
      scenario: 'reallocateTable must check overlapping reservations, not just tables.status === available',
      preConditions: 'All tables >=6 capacity (C1..C5) booked at 2026-12-26 19:00 while tables.status remains available',
      steps: [
        '1. Seed confirmed reservations on C1, C2, C3, C4, C5 for 2026-12-26 19:00',
        '2. Waiter calls POST /api/reservations/:c1ResId/reallocate',
        '3. Assert 409 NO_FREE_TABLE rather than double-booking C2',
      ],
      testData: { date: '2026-12-26', time: '19:00', tables: ['C1', 'C2', 'C3', 'C4', 'C5'] },
      expectedBehavior: 'HTTP 409 because all capacity>=6 tables already have overlapping bookings',
      failActualResult: 'Returned HTTP 200 and reassigned C1 reservation onto already-booked table C2',
      defectId: 'BE-A11',
      severity: 'HIGH',
      rootCause: 'backend/src/controllers/reservationController.js:851 filters tables by status === available without checking reservations time-window overlaps',
      proposedFix: 'Exclude tables with overlapping pending/confirmed/seated reservations in the +-90m window inside reallocateTable',
      affectedComponents: { backend: 'reservationController.js:824-902' },
    });

    const waiterAuth = await loginAs(request, 'waiter');
    const targets = await Promise.all(['C1', 'C2', 'C3', 'C4', 'C5'].map((n) => getTableByNumber(supabase, n)));

    const inserted = [];
    for (let i = 0; i < targets.length; i++) {
      const { data, error } = await supabase
        .from('reservations')
        .insert([
          {
            customer_name: `Audit Realloc ${targets[i].table_number}`,
            customer_phone: `090800000${i}`,
            guest_count: 6,
            reservation_date: '2026-12-26',
            reservation_time: '19:00',
            end_time: '20:30',
            status: 'confirmed',
            table_id: targets[i].id,
            booking_code: `RES-RA-${i}-${Date.now().toString().slice(-4)}`,
          },
        ])
        .select()
        .single();
      if (error) throw new Error(`Seed reallocate failed: ${error.message}`);
      cleanup.trackReservation(data.id);
      inserted.push(data);
    }

    const res = await request.post(`${API_BASE}/api/reservations/${inserted[0].id}/reallocate`, {
      headers: authHeaders(waiterAuth.token),
    });

    expect(res.status()).toBe(409);
  });

  test('TC_SYNC_BE_A12: cancelByCode must reject wildcard substring & seated cancellations, and emit socket update', async ({
    request,
    supabase,
    cleanup,
    sockets,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BE_A12',
      module: 'Reservation',
      scenario: 'cancelByCode enforces exact code match, blocks cancelling seated bookings, and notifies waiter/admin via socket',
      preConditions: 'Seated reservation RES-ZZ9911 and pending reservation RES-YY8822 exist',
      steps: [
        '1. POST /api/reservations/cancel-by-code with partial substring ZZ99 -> expect 404',
        '2. POST /api/reservations/cancel-by-code with exact seated RES-ZZ9911 -> expect 400',
        '3. Cancel pending RES-YY8822 and assert waiter socket receives reservation_status_updated < 1500ms',
      ],
      testData: { seatedCode: 'RES-ZZ9911', pendingCode: 'RES-YY8822', partial: 'ZZ99' },
      expectedBehavior: 'Partial match returns 404, seated cancel returns 400, pending cancel emits socket < 1500ms',
      failActualResult: 'Partial substring matched and cancelled seated reservation without socket notification',
      defectId: 'BE-A12',
      severity: 'HIGH',
      rootCause: 'reservationController.js:984 uses .ilike(%code%), lacks status guard against seated/completed, and emits no Socket.IO event',
      proposedFix: 'Use exact .eq("booking_code", cleanCode), reject seated/completed states, and emit reservation_status_updated to waiter & admin',
      affectedComponents: { backend: 'reservationController.js:908-1027' },
    });

    const waiterAuth = await loginAs(request, 'waiter');
    const tableA1 = await getTableByNumber(supabase, 'A1');
    const tableA2 = await getTableByNumber(supabase, 'A2');

    const { data: rSeated } = await supabase
      .from('reservations')
      .insert([
        {
          customer_name: 'Audit Seated Guest',
          customer_phone: '0907777111',
          guest_count: 2,
          reservation_date: '2026-12-27',
          reservation_time: '18:00',
          end_time: '19:30',
          status: 'seated',
          table_id: tableA1.id,
          booking_code: 'RES-ZZ9911',
        },
      ])
      .select()
      .single();
    cleanup.trackReservation(rSeated.id);

    const { data: rPending } = await supabase
      .from('reservations')
      .insert([
        {
          customer_name: 'Audit Pending Guest',
          customer_phone: '0907777222',
          guest_count: 2,
          reservation_date: '2026-12-27',
          reservation_time: '20:00',
          end_time: '21:30',
          status: 'pending',
          table_id: tableA2.id,
          booking_code: 'RES-YY8822',
        },
      ])
      .select()
      .single();
    cleanup.trackReservation(rPending.id);

    const waiterSocket = await connectSocket({ token: waiterAuth.token, rooms: ['waiter'], registry: sockets });

    const seatedRes = await request.post(`${API_BASE}/api/reservations/cancel-by-code`, {
      data: { booking_code: 'RES-ZZ9911' },
    });
    expect.soft(seatedRes.status(), 'Cancelling seated reservation RES-ZZ9911 must return 400').toBe(400);

    const partialRes = await request.post(`${API_BASE}/api/reservations/cancel-by-code`, {
      data: { booking_code: 'ZZ99' },
    });
    expect.soft(partialRes.status(), 'Partial wildcard booking_code ZZ99 must return 404').toBe(404);

    const pendRes = await request.post(`${API_BASE}/api/reservations/cancel-by-code`, {
      data: { booking_code: 'RES-YY8822' },
    });
    expect.soft(pendRes.status(), 'Cancelling pending reservation RES-YY8822 must return 200').toBe(200);
    let cancelSocketErr = null;
    try {
      await waiterSocket.waitForEvent('reservation_status_updated', () => true, SOCKET_TIMEOUT);
    } catch (err) {
      cancelSocketErr = err.message;
    }
    expect.soft(cancelSocketErr, 'Waiter room must receive reservation_status_updated < 1500ms').toBeNull();
  });

  test('TC_SYNC_BE_A14: rejectAdditionalItems must enforce min_order_value and clamp discount so total_amount >= 0', async ({
    request,
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BE_A14',
      module: 'Payment',
      scenario: 'Rejecting items on coupon-applied order must not produce negative total_amount or keep invalid discount',
      preConditions: 'Temp coupon AUDIT_NEG (fixed 80,000, min_order_value 100,000); order initially >= 100,000 then item rejected',
      steps: [
        '1. Insert active coupon AUDIT_NEG (fixed 80,000, min_order_value 100,000)',
        '2. Create order with low-price item + high-qty second item totaling >= 100,000 with AUDIT_NEG',
        '3. Waiter rejects the second pending item via DELETE /api/orders/:id/items',
        '4. Assert new_total >= 0 and discount cleared when remaining subtotal < min_order_value',
      ],
      testData: { coupon: 'AUDIT_NEG_A14', discount_value: 80000, min_order_value: 100000 },
      expectedBehavior: 'new_total >= 0 and discount_amount = 0 when remaining subtotal drops below 100,000',
      failActualResult: 'new_total became negative and 80,000 fixed discount remained applied below min_order_value',
      defectId: 'BE-A14',
      severity: 'HIGH',
      rootCause: 'orderController.js:995-1021 recalculates fixed discount without checking min_order_value or clamping discount <= newSubtotal + newTaxAmount',
      proposedFix: 'Re-verify min_order_value and cap discount_amount <= newSubtotal + newTaxAmount so total_amount >= 0',
      affectedComponents: { backend: 'orderController.js:837-857,995-1021' },
    });

    const waiterAuth = await loginAs(request, 'waiter');
    const tableA1 = await getTableByNumber(supabase, 'A1');
    const items = await getMenuItems(supabase, { limit: 20 });

    const cheapItem = items.find((i) => Number(i.price) <= 50000) || items[0];
    const secondItem = items.find((i) => i.id !== cheapItem.id && Number(i.price) >= 35000) || items[1];
    const qty2 = Math.max(1, Math.ceil((110000 - Number(cheapItem.price)) / Number(secondItem.price)));

    const now = new Date();
    const start = new Date(now.getTime() - 86400_000).toISOString();
    const end = new Date(now.getTime() + 30 * 86400_000).toISOString();

    const { data: coupon, error: cErr } = await supabase
      .from('coupons')
      .insert([
        {
          code: 'AUDIT_NEG_A14',
          title: 'Audit Negative Total Test',
          discount_type: 'fixed',
          discount_value: 80000,
          min_order_value: 100000,
          start_date: start,
          end_date: end,
          is_active: true,
          target_type: 'all',
          used_count: 0,
        },
      ])
      .select()
      .single();
    if (cErr) throw new Error(`Failed to create temp coupon: ${cErr.message}`);
    cleanup.trackCoupon(coupon.id);

    const created = await createGuestOrder(request, cleanup, {
      tableId: tableA1.id,
      qrToken: tableA1.qr_code_token,
      items: [
        { menu_item_id: cheapItem.id, quantity: 1 },
        { menu_item_id: secondItem.id, quantity: qty2 },
      ],
      couponCode: 'AUDIT_NEG_A14',
    });
    expect(created.status).toBe(201);
    const orderId = created.body.order_id;

    const { data: orderItems } = await supabase
      .from('order_items')
      .select('id, menu_item_id')
      .eq('order_id', orderId);
    const targetItem = orderItems.find((oi) => oi.menu_item_id === secondItem.id);

    const rejRes = await request.delete(`${API_BASE}/api/orders/${orderId}/items`, {
      headers: authHeaders(waiterAuth.token),
      data: { itemIds: [targetItem.id] },
    });
    expect(rejRes.status()).toBe(200);
    const rejBody = await rejRes.json();

    expect.soft(Number(rejBody.new_total), 'rejectAdditionalItems new_total must be >= 0').toBeGreaterThanOrEqual(0);
    const { data: updatedOrder } = await supabase
      .from('orders')
      .select('discount_amount, total_amount')
      .eq('id', orderId)
      .single();
    expect.soft(Number(updatedOrder.discount_amount), 'discount_amount must reset to 0 below min_order_value').toBe(0);
    expect.soft(Number(updatedOrder.total_amount), 'DB orders.total_amount must be >= 0').toBeGreaterThanOrEqual(0);
  });

  test('TC_SYNC_BE_A16: Socket.IO leave_room must unsubscribe from prior table room', async ({
    request,
    supabase,
    cleanup,
    sockets,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BE_A16',
      module: 'Socket/Security',
      scenario: 'Socket emitting leave_room(table_A1) then join_room(table_A2) must not receive A1 events',
      preConditions: 'Guest socket joins table_<A1> then emits leave_room(table_<A1>) and joins table_<A2>',
      steps: [
        '1. Connect Guest socket, join table_<A1>',
        '2. Emit leave_room table_<A1> and join_room table_<A2>',
        '3. Create order on A1 and assert Guest socket does NOT receive order_status_update for A1',
      ],
      testData: { fromRoom: 'table_A1', toRoom: 'table_A2' },
      expectedBehavior: 'Socket leaves table_<A1> cleanly and receives zero A1 order events',
      failActualResult: 'Socket still received A1 order_status_update because socket.js lacks leave_room handler',
      defectId: 'BE-A16',
      severity: 'MEDIUM',
      rootCause: 'backend/src/config/socket.js:44-115 registers join_room without a corresponding leave_room handler',
      proposedFix: 'Implement socket.on("leave_room", (room) => socket.leave(room)) in socket.js',
      affectedComponents: { backend: 'socket.js:44-115' },
    });

    const tableA1 = await getTableByNumber(supabase, 'A1');
    const tableA2 = await getTableByNumber(supabase, 'A2');
    const items = await getMenuItems(supabase, { limit: 5 });

    const guestSocket = await connectSocket({ rooms: [`table_${tableA1.id}`], registry: sockets });
    guestSocket.socket.emit('leave_room', `table_${tableA1.id}`);
    guestSocket.socket.emit('join_room', `table_${tableA2.id}`);
    await sleep(150);
    guestSocket.clearBuffers();

    const noEvtPromise = guestSocket.assertNoEvent('order_status_update', () => true, 700);
    await createGuestOrder(request, cleanup, {
      tableId: tableA1.id,
      qrToken: tableA1.qr_code_token,
      items: [{ menu_item_id: items[0].id, quantity: 1 }],
    });

    await noEvtPromise;
  });

  test('TC_SYNC_BE_B01: Unauthenticated checkout and payment confirm without auth/qr_token must return 401', async ({
    request,
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BE_B01',
      module: 'Payment',
      scenario: 'Unauthenticated client cannot call POST /api/orders/:id/checkout or POST /api/payment/confirm',
      preConditions: 'Active order exists on Table A1; caller holds no Bearer token and no qr_token',
      steps: [
        '1. Create order on A1',
        '2. Unauthenticated POST /api/orders/:id/checkout { payment_method: "cash" }',
        '3. Unauthenticated POST /api/payment/confirm { orderId, paymentIntentId: "pi_fake" }',
        '4. Assert HTTP 401 Unauthorized on both',
      ],
      testData: { endpoints: ['POST /api/orders/:id/checkout', 'POST /api/payment/confirm'] },
      expectedBehavior: 'Both endpoints reject unauthenticated callers with HTTP 401',
      failActualResult: 'Unauthenticated /checkout succeeded with HTTP 200 and marked the order paid/completed',
      defectId: 'BE-B01',
      severity: 'CRITICAL',
      rootCause: 'orderRoutes.js:44 and paymentRoutes.js:7,23 lack verifyToken/authorizeRoles; confirmPayment never verifies metadata.orderId or amount',
      proposedFix: 'Require verifyToken + authorizeRoles on /checkout and /payment/confirm, and verify PaymentIntent metadata.orderId & amount',
      affectedComponents: { backend: 'orderRoutes.js:44, paymentRoutes.js:7,23, paymentController.js:141-196' },
    });

    const tableA1 = await getTableByNumber(supabase, 'A1');
    const items = await getMenuItems(supabase, { limit: 5 });

    const created = await createGuestOrder(request, cleanup, {
      tableId: tableA1.id,
      qrToken: tableA1.qr_code_token,
      items: [{ menu_item_id: items[0].id, quantity: 1 }],
    });
    const orderId = created.body.order_id;

    const chkRes = await request.post(`${API_BASE}/api/orders/${orderId}/checkout`, {
      data: { payment_method: 'cash' },
    });
    const confRes = await request.post(`${API_BASE}/api/payment/confirm`, {
      data: { orderId, paymentIntentId: 'pi_fake_audit' },
    });

    expect.soft(chkRes.status(), 'Unauthenticated POST /api/orders/:id/checkout must return 401').toBe(401);
    expect.soft(confRes.status(), 'Unauthenticated POST /api/payment/confirm must return 401').toBe(401);
  });

  test('TC_SYNC_BE_B03: POST /api/orders must reject negative item quantity with 400/422', async ({
    request,
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BE_B03',
      module: 'Order',
      scenario: 'Creating an order with negative item quantity must fail validation (400/422)',
      preConditions: 'Table A1 available with valid qr_code_token',
      steps: [
        '1. POST /api/orders with quantity: -2',
        '2. Assert HTTP 400 or 422 validation error',
      ],
      testData: { quantity: -2 },
      expectedBehavior: 'HTTP 400 or 422 rejecting non-positive quantity',
      failActualResult: 'Returned HTTP 201 and created order with negative total_amount',
      defectId: 'BE-B03',
      severity: 'CRITICAL',
      rootCause: 'backend/src/controllers/orderController.js:446-470,751-775 never validates item.quantity > 0 integer',
      proposedFix: 'Validate items[].quantity as integer >= 1 via Joi schema in orderRoutes/orderController',
      affectedComponents: { backend: 'orderController.js:446-470,751-775' },
    });

    const tableA1 = await getTableByNumber(supabase, 'A1');
    const items = await getMenuItems(supabase, { limit: 5 });

    const res = await createGuestOrder(request, cleanup, {
      tableId: tableA1.id,
      qrToken: tableA1.qr_code_token,
      items: [{ menu_item_id: items[0].id, quantity: -2 }],
    });

    expect([400, 422]).toContain(res.status);
  });

  test('TC_SYNC_BE_B04: Socket.IO must restrict unauthenticated table_*/session_* room joins and call_staff spoofing', async ({
    request,
    supabase,
    sockets,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BE_B04',
      module: 'Socket/Security',
      scenario: 'Unauthenticated socket cannot join table_*/session_* rooms without proof or spoof call_staff alerts to waiter',
      preConditions: 'Waiter socket joined to waiter room; unauthenticated socket connected without token',
      steps: [
        '1. Unauthenticated socket emits join_room(table_<A1>) and join_room(session_victim)',
        '2. Unauthenticated socket emits call_staff { tableId: "T01", reason: "spoof" }',
        '3. Assert join_room emits error and waiter does NOT receive spoofed ai_handoff_alert',
      ],
      testData: { spoofTable: 'T01', sessionRoom: 'session_victim' },
      expectedBehavior: 'Unauthorized room join emits error and unauthenticated call_staff is rejected',
      failActualResult: 'Unauthenticated socket joined open rooms without error and waiter received spoofed ai_handoff_alert',
      defectId: 'BE-B04',
      severity: 'HIGH',
      rootCause: 'backend/src/config/socket.js:82-85,98-110 permits any unauthenticated socket into table_*/session_* rooms and forwards unvalidated call_staff',
      proposedFix: 'Require signed qr_token/session proof for table_*/session_* rooms and authenticate/rate-limit call_staff',
      affectedComponents: { backend: 'socket.js:82-110' },
    });

    const waiterAuth = await loginAs(request, 'waiter');
    const tableA1 = await getTableByNumber(supabase, 'A1');

    const waiterSocket = await connectSocket({ token: waiterAuth.token, rooms: ['waiter'], registry: sockets });
    const unauthSocket = await connectSocket({ registry: sockets });

    const noSpoofResultPromise = waiterSocket
      .assertNoEvent('ai_handoff_alert', (d) => d.reason === 'audit_spoof_b04', 700)
      .then(() => null, (err) => err.message);

    unauthSocket.socket.emit('join_room', `table_${tableA1.id}`);
    unauthSocket.socket.emit('join_room', 'session_victim');
    unauthSocket.socket.emit('call_staff', { tableId: 'T01', reason: 'audit_spoof_b04' });

    await sleep(250);
    expect.soft(unauthSocket.errors.length, 'Unauthenticated table_*/session_* join_room must emit socket error').toBeGreaterThan(0);
    const spoofErr = await noSpoofResultPromise;
    expect.soft(spoofErr, 'Unauthenticated call_staff must not deliver ai_handoff_alert to waiter').toBeNull();
  });

  test('TC_SYNC_BE_B06: Unauthenticated endpoints must not accept spoofed client userId parameter (IDOR)', async ({
    request,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BE_B06',
      module: 'Socket/Security',
      scenario: 'Unauthenticated GET /api/coupons?userId=... and DELETE /api/ai/session/:id?userId=... must reject userId impersonation',
      preConditions: 'Victim userId obtained from waiter02 profile; caller sends NO Authorization header',
      steps: [
        '1. Send unauthenticated GET /api/coupons?userId=<victim>',
        '2. Send unauthenticated DELETE /api/ai/session/audit-sess-b06?userId=<victim>',
        '3. Assert HTTP 401/403 rejecting unauthenticated userId impersonation',
      ],
      testData: { endpoints: ['GET /api/coupons', 'DELETE /api/ai/session/:id'] },
      expectedBehavior: 'HTTP 401/403 when unauthenticated request supplies arbitrary userId',
      failActualResult: 'Both endpoints returned HTTP 200 accepting unauthenticated userId parameter',
      defectId: 'BE-B06',
      severity: 'HIGH',
      rootCause: 'couponController.js:8,137 and aiController.js:202,739 trust req.query.userId / req.body.userId without verifyToken',
      proposedFix: 'Derive userId strictly from verified JWT (req.user.id) and reject unauthenticated userId params',
      affectedComponents: { backend: 'aiController.js:202,739, couponController.js:8,137' },
    });

    const waiterAuth = await loginAs(request, 'waiter');
    const victimId = waiterAuth.user.id;

    const cRes = await request.get(`${API_BASE}/api/coupons?userId=${victimId}`);
    const sRes = await request.delete(`${API_BASE}/api/ai/session/audit-sess-b06?userId=${victimId}`);

    expect.soft([401, 403], 'Unauthenticated GET /api/coupons?userId= must return 401/403').toContain(cRes.status());
    expect.soft([401, 403], 'Unauthenticated DELETE /api/ai/session/:id?userId= must return 401/403').toContain(sRes.status());
  });

  test('TC_SYNC_BE_B09: Coupon create with target_type="guest" must succeed matching couponController & validation must reject empty body with 400', async ({
    request,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BE_B09',
      module: 'Payment',
      scenario: 'POST /api/coupons/create accepts target_type="guest" supported by controller/UI and rejects empty payload with 400',
      preConditions: 'Authenticated as superAdmin (admin@restaurant.com)',
      steps: [
        '1. POST /api/coupons/create with target_type="guest"',
        '2. POST /api/coupons/create with empty body {}',
        '3. Assert 200/201 for valid guest coupon and 400/422 for empty payload',
      ],
      testData: { target_type: 'guest', code: 'AUDIT_GUEST_B09' },
      expectedBehavior: 'target_type="guest" succeeds (200/201) and {} returns 400/422',
      failActualResult: 'PostgreSQL CHECK constraint rejected target_type="guest" with HTTP 500 and empty {} also returned HTTP 500',
      defectId: 'BE-B09',
      severity: 'MEDIUM',
      rootCause: 'database/migrations/17_add_coupon_usage.sql:3 CHECK (target_type IN ("all","new_user")) conflicts with couponController.js/couponService.js ("guest","customer"), and createCoupon lacks Joi validation',
      proposedFix: 'Update DB CHECK constraint to include guest/customer and add Joi schema validation on createCoupon',
      affectedComponents: { backend: 'couponController.js:31-38,165', database: '17_add_coupon_usage.sql:3' },
    });

    const superAuth = await loginAs(request, 'superAdmin');
    const now = new Date();
    const start = now.toISOString();
    const end = new Date(now.getTime() + 7 * 86400_000).toISOString();

    const guestCouponRes = await request.post(`${API_BASE}/api/coupons/create`, {
      headers: authHeaders(superAuth.token),
      data: {
        code: `AUDIT_GUEST_B09_${Date.now().toString().slice(-4)}`,
        title: 'Audit Guest Coupon',
        discount_type: 'fixed',
        discount_value: 10000,
        target_type: 'guest',
        start_date: start,
        end_date: end,
        is_active: true,
      },
    });
    const gBody = await guestCouponRes.json();
    if (gBody?.data?.id) cleanup.trackCoupon(gBody.data.id);

    const emptyRes = await request.post(`${API_BASE}/api/coupons/create`, {
      headers: authHeaders(superAuth.token),
      data: {},
    });

    expect.soft([200, 201], 'Coupon create with target_type="guest" must succeed (200/201)').toContain(guestCouponRes.status());
    expect.soft([400, 422], 'Coupon create with empty body {} must return 400/422').toContain(emptyRes.status());
  });
});
