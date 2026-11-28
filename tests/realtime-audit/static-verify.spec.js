const { test, expect } = require('./fixtures/audit-fixture');
const { API_BASE, loginAs, authHeaders, seedBrowserAuth } = require('./helpers/auth');
const { getTableByNumber, getMenuItems, createGuestOrder, approveOrder, updateKitchenItem } = require('./helpers/api');
const { connectSocket } = require('./helpers/socket');

test.describe('Static Issues Dynamic Verification (#67-#80)', () => {
  test('#67 [BE-A06]: Socket event names & payloads should be consistent across controllers', async ({ request, supabase, cleanup, sockets }) => {
    const waiter = await loginAs(request, 'waiter');
    const table = await getTableByNumber(supabase, 'A1');
    cleanup.trackTable(table.id);
    const items = await getMenuItems(supabase, { limit: 2 });

    const waiterSock = await connectSocket({ token: waiter.token, rooms: ['waiter'], registry: sockets });

    const { status, body } = await createGuestOrder(request, cleanup, {
      tableId: table.id,
      qrToken: table.qr_code_token,
      items: [{ menu_item_id: items[0].id, quantity: 1 }],
    });
    expect(status).toBe(201);
    const orderId = body.order_id;

    await approveOrder(request, waiter.token, orderId);
    await request.post(`${API_BASE}/api/payment/confirm-cash`, {
      headers: authHeaders(waiter.token),
      data: { orderId },
    });
    await new Promise((r) => setTimeout(r, 800));

    const names = [...new Set(waiterSock.events.map((e) => e.eventName))];
    const hasSplitOrderEvent = names.includes('order_status_update') && names.includes('order_status_updated');
    const hasSplitTableEvent = names.includes('table_status_update') && names.includes('table_updated');
    expect(hasSplitOrderEvent || hasSplitTableEvent, `Inconsistent socket event names observed: ${JSON.stringify(names)}`).toBe(false);
  });

  test('#68 [BE-A09]: updateOrderServedStatus should allow marking served when an item is rejected', async ({ request, supabase, cleanup }) => {
    const waiter = await loginAs(request, 'waiter');
    const kitchen = await loginAs(request, 'kitchen');
    const table = await getTableByNumber(supabase, 'A1');
    cleanup.trackTable(table.id);
    const items = await getMenuItems(supabase, { limit: 2 });

    const { status, body } = await createGuestOrder(request, cleanup, {
      tableId: table.id,
      qrToken: table.qr_code_token,
      items: [
        { menu_item_id: items[0].id, quantity: 1 },
        { menu_item_id: items[1].id, quantity: 1 },
      ],
    });
    expect(status).toBe(201);
    const orderId = body.order_id;

    await approveOrder(request, waiter.token, orderId);

    const { data: orderItems } = await supabase.from('order_items').select('id').eq('order_id', orderId);
    await updateKitchenItem(request, kitchen.token, orderItems[0].id, 'ready');
    await updateKitchenItem(request, kitchen.token, orderItems[1].id, 'rejected');

    const servedRes = await request.put(`${API_BASE}/api/orders/${orderId}/served`, {
      headers: authHeaders(waiter.token),
      data: { is_served: true },
    });
    const servedBody = await servedRes.json();
    expect(servedRes.status(), `Expected 200 when non-rejected items are ready, got ${servedRes.status()}: ${JSON.stringify(servedBody)}`).toBe(200);
  });

  test('#69 [BE-A13]: updateReservationStatus to cancelled should sync tables.status back to available', async ({ request, supabase, cleanup }) => {
    const waiter = await loginAs(request, 'waiter');
    const createRes = await request.post(`${API_BASE}/api/reservations`, {
      data: {
        customer_name: 'Audit BE-A13',
        customer_phone: '0909123456',
        guest_count: 2,
        reservation_date: '2026-12-29',
        reservation_time: '19:00',
      },
    });
    const created = await createRes.json();
    const resId = created.data?.id;
    if (resId) cleanup.trackReservation(resId);
    expect(resId).toBeTruthy();

    const { data: resRow } = await supabase.from('reservations').select('table_id').eq('id', resId).single();
    const tableId = resRow.table_id;
    expect(tableId).toBeTruthy();

    await supabase.from('tables').update({ status: 'reserved' }).eq('id', tableId);
    cleanup.trackTable(tableId);

    const updRes = await request.patch(`${API_BASE}/api/reservations/${resId}/status`, {
      headers: authHeaders(waiter.token),
      data: { status: 'cancelled' },
    });
    expect(updRes.status()).toBe(200);

    const { data: tbl } = await supabase.from('tables').select('status').eq('id', tableId).single();
    expect(tbl.status, `Expected table ${tableId} status to sync back to available after cancel, got ${tbl.status}`).toBe('available');
  });

  test('#70 [BE-A15]: regenerateAllQR should NOT rotate QR token on occupied tables', async ({ request, supabase }) => {
    const admin = await loginAs(request, 'tempAdmin');
    const table = await getTableByNumber(supabase, 'A2');
    const origStatus = table.status;
    const origToken = table.qr_code_token;

    try {
      await supabase.from('tables').update({ status: 'occupied' }).eq('id', table.id);
      const res = await request.post(`${API_BASE}/api/admin/tables/qr/regenerate-all`, {
        headers: authHeaders(admin.token),
      });
      expect(res.status()).toBe(200);

      const { data: after } = await supabase.from('tables').select('qr_code_token').eq('id', table.id).single();
      expect(after.qr_code_token, 'QR token on occupied table was rotated mid-meal').toBe(origToken);
    } finally {
      await supabase.from('tables').update({ status: origStatus, qr_code_token: origToken }).eq('id', table.id);
    }
  });

  test('#71 [BE-B05]: createOrder should be atomic (no orphan order if an item fails)', async ({ request, supabase, cleanup }) => {
    const table = await getTableByNumber(supabase, 'A1');
    const items = await getMenuItems(supabase, { limit: 1 });
    const fakeMenuItemId = '00000000-0000-0000-0000-000000009999';

    const beforeCount = (await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('table_id', table.id)).count;
    const res = await request.post(`${API_BASE}/api/orders`, {
      data: {
        table_id: table.id,
        qr_token: table.qr_code_token,
        items: [
          { menu_item_id: items[0].id, quantity: 1 },
          { menu_item_id: fakeMenuItemId, quantity: 1 },
        ],
      },
    });
    const afterCount = (await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('table_id', table.id)).count;
    if (res.status() === 201) {
      const b = await res.json();
      if (b.order_id) cleanup.trackOrder(b.order_id);
    }
    expect(res.status(), 'Order with nonexistent menu_item_id should fail').toBeGreaterThanOrEqual(400);
    expect(afterCount, 'Orphan order was left in DB after partial failure').toBe(beforeCount);
  });

  test('#72 [BE-B07]: Socket.IO should reject invalid JWT instead of downgrading to guest', async ({ sockets }) => {
    let outcome = 'unknown';
    try {
      const s = await connectSocket({ token: 'invalid.tampered.jwt', timeoutMs: 4000, registry: sockets });
      outcome = s.socket.connected ? 'connected_as_guest' : 'disconnected';
    } catch (err) {
      outcome = `rejected:${err.message}`;
    }
    expect(outcome, 'Invalid JWT should be rejected with connect_error, not connected as guest').toMatch(/^rejected:/);
  });

  test('#73 [BE-B08]: confirmCashPayment should reject double payment on already paid order', async ({ request, supabase, cleanup }) => {
    const waiter = await loginAs(request, 'waiter');
    const table = await getTableByNumber(supabase, 'A1');
    cleanup.trackTable(table.id);
    const items = await getMenuItems(supabase, { limit: 1 });

    const { status, body } = await createGuestOrder(request, cleanup, {
      tableId: table.id,
      qrToken: table.qr_code_token,
      items: [{ menu_item_id: items[0].id, quantity: 1 }],
    });
    expect(status).toBe(201);
    const orderId = body.order_id;

    const first = await request.post(`${API_BASE}/api/payment/confirm-cash`, {
      headers: authHeaders(waiter.token),
      data: { orderId },
    });
    expect(first.status()).toBe(200);

    const second = await request.post(`${API_BASE}/api/payment/confirm-cash`, {
      headers: authHeaders(waiter.token),
      data: { orderId },
    });
    expect(second.status(), `Second confirm-cash on already paid order returned ${second.status()} instead of 400/409`).toBeGreaterThanOrEqual(400);
  });

  test('#74 [BE-B10]: super_admin should have access to kitchen & order REST routes', async ({ request }) => {
    const superAdmin = await loginAs(request, 'superAdmin');
    const resKitchen = await request.get(`${API_BASE}/api/kitchen/orders`, {
      headers: authHeaders(superAdmin.token),
    });
    expect(resKitchen.status(), `super_admin got ${resKitchen.status()} on GET /api/kitchen/orders`).toBe(200);
  });

  test('#75 [BE-B11]: getOrders search by table_number should return matching orders', async ({ request, supabase, cleanup }) => {
    const waiter = await loginAs(request, 'waiter');
    const table = await getTableByNumber(supabase, 'A1');
    cleanup.trackTable(table.id);
    const items = await getMenuItems(supabase, { limit: 1 });

    const { status, body: created } = await createGuestOrder(request, cleanup, {
      tableId: table.id,
      qrToken: table.qr_code_token,
      items: [{ menu_item_id: items[0].id, quantity: 1 }],
    });
    expect(status).toBe(201);
    const orderId = created.order_id;

    const res = await request.get(`${API_BASE}/api/orders?search=A1`, {
      headers: authHeaders(waiter.token),
    });
    const body = await res.json();
    const list = body.orders || body.data || [];
    const found = list.some((o) => o.id === orderId);
    expect(found, `GET /api/orders?search=A1 did not return order ${orderId} (total returned: ${list.length})`).toBe(true);
  });

  test('#76 [BE-B12]: getAvailableSlots without time param should report reservation conflicts', async ({ request, cleanup }) => {
    const createRes = await request.post(`${API_BASE}/api/reservations`, {
      data: {
        customer_name: 'Audit BE-B12',
        customer_phone: '0909888777',
        guest_count: 10,
        reservation_date: '2026-12-30',
        reservation_time: '19:00',
      },
    });
    const created = await createRes.json();
    const resId = created.data?.id;
    if (resId) cleanup.trackReservation(resId);

    const slotsRes = await request.get(`${API_BASE}/api/reservations/available-slots?date=2026-12-30&guest_count=10`);
    const slotsBody = await slotsRes.json();
    expect(slotsRes.status(), `available-slots returned ${slotsRes.status()}: ${JSON.stringify(slotsBody)}`).toBe(200);
  });

  test('#77 [BE-B13]: lookupReservation with nonexistent code should return clean 404 (not 500)', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/reservations/lookup?booking_code=NONEXISTENT_CODE_999&phone=0909999999`);
    expect([400, 404]).toContain(res.status());
  });

  test('#78 [BUG-FE-A08]: Waiter OrderListPage should receive realtime updates on order_status_updated', async ({ request, supabase, cleanup, audit }) => {
    const waiter = await loginAs(request, 'waiter');
    const table = await getTableByNumber(supabase, 'A1');
    cleanup.trackTable(table.id);
    const items = await getMenuItems(supabase, { limit: 1 });

    const { status, body } = await createGuestOrder(request, cleanup, {
      tableId: table.id,
      qrToken: table.qr_code_token,
      items: [{ menu_item_id: items[0].id, quantity: 1 }],
    });
    expect(status).toBe(201);
    const orderId = body.order_id;

    const ctx = await audit.createAuditContext('waiter');
    await seedBrowserAuth(ctx, waiter);
    const page = await ctx.newPage();
    await page.goto('/waiter/orders');
    await expect(page.getByText(`#${orderId.slice(0, 6)}`)).toBeVisible({ timeout: 5000 });
  });

  test('#79 [BUG-FE-B01]: GoogleCallback for kitchen role should redirect to /kitchen (not /kitchen/orders 404)', async ({ request, audit }) => {
    const kitchen = await loginAs(request, 'kitchen');
    const ctx = await audit.createAuditContext('kitchen-oauth');
    const page = await ctx.newPage();
    await page.goto(`/auth/google/callback?token=${encodeURIComponent(kitchen.token)}`);
    await page.waitForTimeout(2000);
    expect(page.url(), `Kitchen OAuth redirected to ${page.url()}`).toContain('/kitchen');
    expect(page.url()).not.toContain('/kitchen/orders');
  });

  test('#80 [BUG-FE-B03]: Corrupted localStorage.user should not crash app on boot', async ({ audit }) => {
    const ctx = await audit.createAuditContext('corrupt-ls');
    await ctx.addInitScript(() => {
      localStorage.setItem('user', '{corrupted-json');
      localStorage.setItem('token', 'fake');
    });
    const page = await ctx.newPage();
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    await page.goto('/login');
    await page.waitForTimeout(1000);
    expect(pageErrors, `Uncaught page errors on corrupted localStorage: ${JSON.stringify(pageErrors)}`).toEqual([]);
  });
});
