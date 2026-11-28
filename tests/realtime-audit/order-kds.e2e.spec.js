const { test, expect } = require('./fixtures/audit-fixture');
const { API_BASE, loginAs, loginViaUI, seedBrowserAuth, authHeaders } = require('./helpers/auth');
const {
  getTableByNumber,
  getMenuItems,
  createGuestOrder,
  approveOrder,
  addItemsToOrder,
  updateKitchenItem,
} = require('./helpers/api');

test.describe('Order Lifecycle & Kitchen KDS Multi-Context E2E Audit', () => {
  test('TC_SYNC_ORD_BASE_001: Baseline Guest Order -> Waiter Accept -> Kitchen Cook/Ready -> Waiter Served syncs < 1500ms', async ({
    request,
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_ORD_BASE_001',
      module: 'Order',
      scenario: 'End-to-end multi-context order lifecycle: Guest QR Menu -> Waiter POS -> Kitchen KDS -> Served',
      preConditions: 'Waiter and Kitchen contexts pre-authenticated; Table A1 available',
      steps: [
        '1. Open Waiter (/waiter/orders), Kitchen (/kitchen), and Guest (/menu QR A1) contexts',
        '2. Guest adds 1 dish to cart and submits Checkout -> redirects to /orders/:id',
        '3. Verify Waiter sees new order < 1500ms without reload, then clicks Accept',
        '4. Verify Kitchen sees order < 1500ms without reload, clicks Start Cooking -> Complete',
        '5. Verify Waiter processing view shows Mark as Served < 1500ms and marks order served',
      ],
      testData: { table: 'A1', roles: ['guest', 'waiter', 'kitchen'] },
      expectedBehavior: 'Waiter and Kitchen UIs update across contexts within < 1500ms without F5 reload',
      passActualResult: 'Guest order -> Waiter Accept -> Kitchen Ready -> Waiter Served all synced < 1500ms without reload',
      severity: 'LOW',
      affectedComponents: {
        backend: 'orderController.js, kitchenController.js',
        frontend: 'MenuPage.jsx, CartPage.jsx, OrderListPage.jsx, KitchenDisplayPage.jsx',
      },
    });

    const waiterAuth = await loginAs(request, 'waiter');
    const kitchenAuth = await loginAs(request, 'kitchen');
    const tableA1 = await getTableByNumber(supabase, 'A1');
    const items = await getMenuItems(supabase, { limit: 10 });
    const targetItem = items[0];
    cleanup.trackTable(tableA1.id);

    const waiterCtx = await audit.createAuditContext('waiter');
    await seedBrowserAuth(waiterCtx, waiterAuth);
    const waiterPage = await audit.newPage(waiterCtx);
    await waiterPage.goto('/waiter/orders');
    await expect(waiterPage.locator('select')).toBeVisible();

    const kitchenCtx = await audit.createAuditContext('kitchen');
    await seedBrowserAuth(kitchenCtx, kitchenAuth);
    const kitchenPage = await audit.newPage(kitchenCtx);
    await kitchenPage.goto('/kitchen');
    await expect(kitchenPage.locator('p').filter({ hasText: /orders to process/i }).first()).toBeVisible();

    const guestCtx = await audit.createAuditContext('guest');
    await guestCtx.addInitScript(() => {
      localStorage.setItem('hasSeenGuestModal', 'true');
      localStorage.setItem('i18nextLng', 'en');
    });
    const guestPage = await audit.newPage(guestCtx);
    await guestPage.goto(
      `/menu?table=${tableA1.id}&table_number=${encodeURIComponent(tableA1.table_number)}&token=${tableA1.qr_code_token}`
    );

    const searchInput = guestPage.locator('input[placeholder*="Search"]');
    await searchInput.fill(targetItem.name);
    const itemCard = guestPage.locator('div.cursor-pointer').filter({ has: guestPage.locator('h3', { hasText: targetItem.name }) }).first();
    await itemCard.click();

    await guestPage.locator('div.fixed button').filter({ hasText: /Add to Cart/i }).click();
    await guestPage.locator('button:visible').filter({ hasText: /Shopping Cart/i }).click();
    await expect(guestPage).toHaveURL(/\/cart/);

    await guestPage.getByRole('button', { name: /Checkout/i }).click();
    await guestPage.waitForURL(/\/orders\/[0-9a-f-]+/i, { timeout: 10_000 });
    const orderId = guestPage.url().split('/orders/')[1].split('?')[0];
    cleanup.trackOrder(orderId);

    const waiterCard = waiterPage.locator('div.rounded-2xl, div.rounded-xl').filter({ hasText: `#${orderId.slice(0, 6)}` }).first();
    await expect(waiterCard).toBeVisible({ timeout: 1500 });

    await waiterCard.getByRole('button', { name: /^Accept$/i }).click();

    const kitchenCard = kitchenPage.locator('div.rounded-3xl').filter({ hasText: `#${orderId.slice(0, 8)}` }).first();
    await expect(kitchenCard).toBeVisible({ timeout: 1500 });

    const itemRow = kitchenCard.locator('div.relative.pl-3').filter({ hasText: targetItem.name }).first();
    await itemRow.getByRole('button', { name: /Complete/i }).click();
    await expect(itemRow.getByText(/Done/i)).toBeVisible({ timeout: 1500 });

    await waiterPage.locator('select').selectOption('processing');
    const waiterProcCard = waiterPage.locator('div.rounded-2xl, div.rounded-xl').filter({ hasText: `#${orderId.slice(0, 6)}` }).first();
    await expect(waiterProcCard).toBeVisible({ timeout: 1500 });
    const servedBtn = waiterProcCard.getByRole('button', { name: /Mark as Served/i });
    await expect(servedBtn).toBeVisible({ timeout: 1500 });
    await servedBtn.click();

    await waiterPage.locator('select').selectOption('served');
    const waiterServedCard = waiterPage.locator('div.rounded-2xl, div.rounded-xl').filter({ hasText: `#${orderId.slice(0, 6)}` }).first();
    await expect(waiterServedCard).toBeVisible({ timeout: 1500 });
  });

  test('TC_SYNC_FE_A01: Waiter logging in via /login SPA must receive new_order < 1500ms without F5 reload', async ({
    request,
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_FE_A01',
      module: 'Order',
      scenario: 'AuthContext omits token so SocketContext stays unauthenticated after SPA login; Waiter misses new_order until F5',
      preConditions: 'Fresh browser context logs in via /login UI as waiter02 without page reload',
      steps: [
        '1. Open fresh context and log in via /login UI as waiter02@restaurant.com (NO reload)',
        '2. Verify /waiter/orders is open on Pending tab',
        '3. Create guest order on Table A1 via POST /api/orders',
        '4. Assert Waiter UI displays new order #<6chars> within < 1500ms without F5 reload',
      ],
      testData: { role: 'waiter', email: 'waiter02@restaurant.com', table: 'A1' },
      expectedBehavior: 'SocketContext reconnects with JWT after login() and Waiter receives new_order < 1500ms',
      failActualResult: 'AuthContext omitted token; SocketContext stayed guest socket, join_room("waiter") failed, and order never appeared without F5',
      defectId: 'BUG-FE-A01',
      severity: 'CRITICAL',
      rootCause: 'frontend/src/contexts/AuthContext.jsx:34 omits token from Provider value; SocketContext.jsx:15,67 depends on [token] (always undefined)',
      proposedFix: 'Expose token state in AuthContext.jsx and pass it to SocketContext useEffect dependency array',
      affectedComponents: {
        frontend: 'AuthContext.jsx:33-37, SocketContext.jsx:15,21,67',
        backend: 'socket.js:52-72',
      },
    });

    const tableA1 = await getTableByNumber(supabase, 'A1');
    const items = await getMenuItems(supabase, { limit: 5 });

    const waiterCtx = await audit.createAuditContext('waiter-spa-login');
    await waiterCtx.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
    const waiterPage = await audit.newPage(waiterCtx);
    audit.setEvidencePage(waiterPage, 'FE-A01', 'AuthTokenOmittedSocketDesync');

    await loginViaUI(waiterPage, 'waiter', { reloadAfterLogin: false });
    await expect(waiterPage).toHaveURL(/\/waiter\/orders/);
    await expect(waiterPage.locator('select')).toBeVisible();

    const created = await createGuestOrder(request, cleanup, {
      tableId: tableA1.id,
      qrToken: tableA1.qr_code_token,
      items: [{ menu_item_id: items[0].id, quantity: 1 }],
    });
    expect(created.status).toBe(201);
    const orderId = created.body.order_id;

    const newCard = waiterPage.locator('div.rounded-2xl, div.rounded-xl').filter({ hasText: `#${orderId.slice(0, 6)}` }).first();
    await expect(newCard).toBeVisible({ timeout: 1500 });
  });

  test('TC_SYNC_FE_A02: Customer OrderTrackingPage must render order items and Pay Now button when all items are ready', async ({
    request,
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_FE_A02',
      module: 'Order',
      scenario: 'OrderTrackingPage reads order.order_items while GET /api/orders/:id returns order.items',
      preConditions: 'Order on Table A1 is processing and all items are marked ready by Kitchen',
      steps: [
        '1. Seed order on A1, approve to processing, mark item ready via Kitchen API',
        '2. Open /orders/:orderId in Guest browser context',
        '3. Assert dish name/item row is rendered and Pay Now button is visible',
      ],
      testData: { route: '/orders/:orderId', apiField: 'order.items', uiField: 'order.order_items' },
      expectedBehavior: 'Order items render with status Ready and Pay Now button is enabled/visible',
      failActualResult: 'OrderTrackingPage rendered 0 items and never displayed Pay Now button (reading undefined order.order_items)',
      defectId: 'BUG-FE-A02',
      severity: 'CRITICAL',
      rootCause: 'frontend/src/pages/customer/OrderTrackingPage.jsx:65,96,275,400 reads order.order_items instead of order.items returned by GET /api/orders/:id',
      proposedFix: 'Replace order.order_items with order.items across OrderTrackingPage.jsx and allow ready/served items for canPay',
      affectedComponents: {
        frontend: 'OrderTrackingPage.jsx:65,96,275,400',
        backend: 'orderController.js:659',
      },
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

    const { data: orderItems } = await supabase.from('order_items').select('id').eq('order_id', orderId);
    await updateKitchenItem(request, kitchenAuth.token, orderItems[0].id, 'ready');

    const guestCtx = await audit.createAuditContext('guest-tracking');
    await guestCtx.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
    const guestPage = await audit.newPage(guestCtx);
    audit.setEvidencePage(guestPage, 'FE-A02', 'OrderTrackingItemsAndPayNowMissing');

    await guestPage.goto(`/orders/${orderId}`);
    await expect(guestPage.locator('h1', { hasText: `#${orderId.slice(0, 8)}` })).toBeVisible();

    await expect.soft(guestPage.locator('div.space-y-6 > div'), 'OrderTrackingPage must render 1 order item').toHaveCount(1, { timeout: 1500 });
    await expect.soft(guestPage.getByRole('button', { name: /Pay Now/i }), 'OrderTrackingPage must render Pay Now button when ready').toBeVisible({ timeout: 1500 });
  });

  test('TC_SYNC_BE_A01_E2E: Kitchen KDS UI must display newly added items on processing order < 1500ms without reload', async ({
    request,
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BE_A01_E2E',
      module: 'Kitchen',
      scenario: 'Guest adds a second dish to an active processing order; Kitchen KDS UI must show it < 1500ms',
      preConditions: 'Order on Table A1 in processing status visible on Kitchen KDS',
      steps: [
        '1. Seed processing order with item1 on Table A1',
        '2. Open Kitchen KDS (/kitchen) and verify order card is visible',
        '3. Guest sends POST /api/orders/:id/items adding item2',
        '4. Assert Kitchen KDS order card renders item2 within < 1500ms without reload',
      ],
      testData: { table: 'A1', endpoint: 'POST /api/orders/:id/items' },
      expectedBehavior: 'Kitchen KDS receives new_order socket event and renders newly added dish < 1500ms',
      failActualResult: 'Kitchen KDS card did not show newly added dish without F5 reload',
      defectId: 'BE-A01',
      severity: 'CRITICAL',
      rootCause: 'orderController.js:825 omits status from .select(), so currentOrder.status === "processing" is always false and Kitchen receives no new_order event',
      proposedFix: 'Include status and customer_id in .select() at orderController.js:825',
      affectedComponents: {
        backend: 'orderController.js:823-827,890-897',
        frontend: 'KitchenDisplayPage.jsx:67-76',
      },
    });

    const waiterAuth = await loginAs(request, 'waiter');
    const kitchenAuth = await loginAs(request, 'kitchen');
    const tableA1 = await getTableByNumber(supabase, 'A1');
    const items = await getMenuItems(supabase, { limit: 10 });
    const item1 = items[0];
    const item2 = items.find((i) => i.id !== item1.id && i.name !== item1.name) || items[1];

    const created = await createGuestOrder(request, cleanup, {
      tableId: tableA1.id,
      qrToken: tableA1.qr_code_token,
      items: [{ menu_item_id: item1.id, quantity: 1 }],
    });
    const orderId = created.body.order_id;
    await approveOrder(request, waiterAuth.token, orderId);

    const kitchenCtx = await audit.createAuditContext('kitchen-add-items');
    await seedBrowserAuth(kitchenCtx, kitchenAuth);
    const kitchenPage = await audit.newPage(kitchenCtx);
    audit.setEvidencePage(kitchenPage, 'BE-A01', 'AddItemsKitchenKdsDesync');

    await kitchenPage.goto('/kitchen');
    const kitchenCard = kitchenPage.locator('div.rounded-3xl').filter({ hasText: `#${orderId.slice(0, 8)}` }).first();
    await expect(kitchenCard).toBeVisible();

    const addRes = await addItemsToOrder(request, orderId, {
      qr_token: tableA1.qr_code_token,
      items: [{ menu_item_id: item2.id, quantity: 1 }],
    });
    expect(addRes.status).toBe(200);

    await expect(kitchenCard.getByText(item2.name)).toBeVisible({ timeout: 1500 });
  });

  test('TC_SYNC_FE_A03: Kitchen KDS must remove completed order when order_status_updated is emitted by checkoutOrder', async ({
    request,
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_FE_A03',
      module: 'Kitchen',
      scenario: 'KitchenDisplayPage listens to order_paid only and misses order_status_updated emitted by checkoutOrder',
      preConditions: 'Processing order on Table A1 visible on Kitchen KDS (/kitchen)',
      steps: [
        '1. Seed processing order on Table A1 and verify it appears on /kitchen',
        '2. Complete order via POST /api/orders/:id/checkout (emits order_status_updated to kitchen)',
        '3. Assert order card disappears from /kitchen within < 1500ms without reload',
      ],
      testData: { route: '/kitchen', event: 'order_status_updated' },
      expectedBehavior: 'Kitchen KDS removes completed/cancelled order within 1500ms on order_status_updated',
      failActualResult: 'Completed order remained stuck on Kitchen KDS until F5 reload',
      defectId: 'BUG-FE-A03',
      severity: 'CRITICAL',
      rootCause: 'frontend/src/pages/kitchen/KitchenDisplayPage.jsx:104-106 lacks socket.on("order_status_updated") and socket.on("additional_items_rejected")',
      proposedFix: 'Subscribe to order_status_updated (remove completed/cancelled orders) and additional_items_rejected in KitchenDisplayPage.jsx',
      affectedComponents: {
        frontend: 'KitchenDisplayPage.jsx:104-106',
        backend: 'orderController.js:277,1145',
      },
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

    const kitchenCtx = await audit.createAuditContext('kitchen-fe-a03');
    await seedBrowserAuth(kitchenCtx, kitchenAuth);
    const kitchenPage = await audit.newPage(kitchenCtx);
    audit.setEvidencePage(kitchenPage, 'FE-A03', 'KitchenMissesOrderStatusUpdated');

    await kitchenPage.goto('/kitchen');
    const kitchenCard = kitchenPage.locator('div.rounded-3xl').filter({ hasText: `#${orderId.slice(0, 8)}` }).first();
    await expect(kitchenCard).toBeVisible();

    const chkRes = await request.post(`${API_BASE}/api/orders/${orderId}/checkout`, {
      headers: authHeaders(waiterAuth.token),
      data: { payment_method: 'cash' },
    });
    expect(chkRes.status()).toBe(200);

    await expect(kitchenCard).toBeHidden({ timeout: 1500 });
  });

  test('TC_SYNC_FE_A07: Admin OrderManagement (/admin/orders) must display newly created orders < 1500ms without manual Refresh', async ({
    request,
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_FE_A07',
      module: 'Order',
      scenario: 'Admin OrderManagement has zero Socket.IO listeners so new orders never appear without Refresh/F5',
      preConditions: 'Temp admin user logged into /admin/orders',
      steps: [
        '1. Open /admin/orders authenticated as role=admin',
        '2. Create new guest order on Table A1 via POST /api/orders',
        '3. Assert new order row #<8chars> appears in /admin/orders table within < 1500ms',
      ],
      testData: { route: '/admin/orders', table: 'A1', role: 'admin' },
      expectedBehavior: 'Admin OrderManagement receives realtime event and renders new order row < 1500ms',
      failActualResult: 'Admin OrderManagement table did not update without manual Refresh/F5 (zero socket listeners)',
      defectId: 'BUG-FE-A07',
      severity: 'HIGH',
      rootCause: 'frontend/src/pages/admin/OrderManagement.jsx has zero useSocket() subscriptions; backend also omits admin room emits (BE-A07)',
      proposedFix: 'Subscribe OrderManagement.jsx to admin room socket events and emit order events to admin room on backend',
      affectedComponents: {
        frontend: 'OrderManagement.jsx:269,337,492,496,539-543',
        backend: 'orderController.js',
      },
    });

    const adminAuth = await loginAs(request, 'tempAdmin');
    const tableA1 = await getTableByNumber(supabase, 'A1');
    const items = await getMenuItems(supabase, { limit: 5 });

    const adminCtx = await audit.createAuditContext('admin-orders');
    await seedBrowserAuth(adminCtx, adminAuth);
    const adminPage = await audit.newPage(adminCtx);
    audit.setEvidencePage(adminPage, 'FE-A07', 'AdminOrderManagementNoRealtime');

    await adminPage.goto('/admin/orders');
    await expect(adminPage.locator('h1', { hasText: /Order Management/i })).toBeVisible();

    const created = await createGuestOrder(request, cleanup, {
      tableId: tableA1.id,
      qrToken: tableA1.qr_code_token,
      items: [{ menu_item_id: items[0].id, quantity: 1 }],
    });
    expect(created.status).toBe(201);
    const orderId = created.body.order_id;

    const orderRow = adminPage.locator('tbody tr').filter({ hasText: `#${orderId.slice(0, 8)}` }).first();
    await expect(orderRow).toBeVisible({ timeout: 1500 });
  });
});
