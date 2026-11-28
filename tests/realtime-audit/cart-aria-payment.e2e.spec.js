const { test, expect } = require('./fixtures/audit-fixture');
const { API_BASE, loginAs, seedBrowserAuth, authHeaders } = require('./helpers/auth');
const {
  getTableByNumber,
  getMenuItems,
  createGuestOrder,
  approveOrder,
  updateKitchenItem,
  getOrderById,
} = require('./helpers/api');

test.describe('Cart, Aria AI Chatbot, Pricing & Payment Multi-Context E2E Audit', () => {
  test('TC_SYNC_PAY_BASE_001: Baseline Cash Payment UI (/checkout -> Waiter confirm -> Guest /orders/:id Paid < 1500ms)', async ({
    request,
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_PAY_BASE_001',
      module: 'Payment',
      scenario: 'Customer submits Cash payment on /checkout; Waiter confirms in /waiter/orders; Customer /orders/:id updates to Paid < 1500ms',
      preConditions: 'Order on Table A1 in processing & marked served; Waiter on /waiter/orders',
      steps: [
        '1. Seed order on A1, approve processing, mark item ready, mark order served',
        '2. Open Waiter /waiter/orders (processing filter) and Guest /checkout with order state',
        '3. Guest selects Cash -> Call Staff for Payment (redirects to /orders/:id showing Waiting for staff confirmation)',
        '4. Waiter clicks Customer requesting payment! -> Xác nhận đã thu tiền mặt',
        '5. Assert Guest /orders/:id shows Payment Successful within < 1500ms without F5 reload',
      ],
      testData: { table: 'A1', paymentMethod: 'cash' },
      expectedBehavior: 'Guest OrderTrackingPage updates to Payment Successful < 1500ms after Waiter confirms cash',
      passActualResult: 'Customer Cash request -> Waiter confirm -> Customer OrderTrackingPage synced to Payment Successful < 1500ms',
      severity: 'LOW',
      affectedComponents: {
        frontend: 'CustomerCheckoutPage.jsx, OrderListPage.jsx, OrderDetailModal.jsx, OrderTrackingPage.jsx',
        backend: 'paymentController.js:createPaymentIntent,confirmCashPayment',
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

    const { body: orderRes } = await getOrderById(request, orderId);
    const orderObj = orderRes.data;

    const waiterCtx = await audit.createAuditContext('waiter-pay-base');
    await seedBrowserAuth(waiterCtx, waiterAuth);
    const waiterPage = await audit.newPage(waiterCtx);
    await waiterPage.goto('/waiter/orders');
    await waiterPage.locator('select').selectOption('processing');

    const waiterCard = waiterPage.locator('div.rounded-2xl, div.rounded-xl').filter({ hasText: `#${orderId.slice(0, 6)}` }).first();
    await expect(waiterCard).toBeVisible({ timeout: 5000 });

    const guestCtx = await audit.createAuditContext('guest-pay-base');
    await guestCtx.addInitScript(() => {
      localStorage.setItem('hasSeenGuestModal', 'true');
      localStorage.setItem('i18nextLng', 'en');
    });
    const guestPage = await audit.newPage(guestCtx);
    await guestPage.goto('/menu');
    await guestPage.evaluate((order) => {
      window.history.pushState({ usr: { order }, key: 'audit-base-pay', idx: 1 }, '', '/checkout');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, orderObj);

    await expect(guestPage.getByRole('heading', { name: /Checkout/i })).toBeVisible({ timeout: 5000 });
    await guestPage.getByRole('button', { name: /Cash/i }).click();
    await guestPage.getByRole('button', { name: /Call Staff for Payment/i }).click();

    await guestPage.waitForURL(new RegExp(`/orders/${orderId}`), { timeout: 8000 });
    await expect(guestPage.getByText(/Waiting for staff confirmation/i)).toBeVisible({ timeout: 5000 });

    const reqPayBtn = waiterCard.getByRole('button', { name: /Customer requesting payment/i });
    await expect(reqPayBtn).toBeVisible({ timeout: 5000 });
    await reqPayBtn.click();

    const confirmCashBtn = waiterPage.getByRole('button', { name: /Xác nhận đã thu tiền mặt/i });
    await expect(confirmCashBtn).toBeVisible({ timeout: 3000 });
    await confirmCashBtn.click();

    await expect(guestPage.getByText(/Payment Successful/i)).toBeVisible({ timeout: 1500 });
  });

  test('TC_SYNC_FE_A06: Aria AI add-to-cart must use valid DB modifier UUIDs & CartContext must preserve distinct item notes', async ({
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_FE_A06',
      module: 'Cart/Aria',
      scenario: 'Aria cart_tools.py injects synthetic modifier IDs (mod-sugar-50) breaking POST /api/orders, and CartContext drops notes on merge',
      preConditions: 'Guest on QR Menu for Table A1; AI Service live on :8000',
      steps: [
        '1. Open Guest /menu?table=<A1>, add the same dish twice via UI with distinct notes ("No ice", "Extra sweet"), and verify CartContext keeps 2 separate entries',
        '2. Open Aria chat widget and send "Thêm 1 Trà Đào Cam Sả 50% đường 70% đá vào giỏ hàng"',
        '3. Verify Aria cart item modifiers have valid Supabase UUIDs (not synthetic mod-sugar-50/mod-ice-70)',
        '4. Navigate to /cart and click Checkout; verify POST /api/orders returns HTTP 201',
      ],
      testData: { table: 'A1', notes: ['No ice', 'Extra sweet'], ariaPrompt: 'Thêm 1 Trà Đào Cam Sả 50% đường 70% đá vào giỏ hàng' },
      expectedBehavior: 'CartContext preserves distinct notes as 2 items, Aria modifiers use valid UUIDs, and Checkout POST /api/orders returns 201',
      failActualResult: 'CartContext merged distinct-note items into 1 entry, Aria injected synthetic modifier IDs (mod-sugar-50/mod-ice-70), and Checkout POST /api/orders failed',
      defectId: 'BUG-FE-A06',
      severity: 'CRITICAL',
      rootCause: 'ai-service/tools/cart_tools.py:243-273 emits synthetic IDs (mod-sugar-50, price_modifier: 0); CartContext.jsx:48-77 ignores notes in merge and mutates quantity in-place; orderController.js:458-463 queries UUID column with synthetic strings',
      proposedFix: 'Map AI modifiers to real Supabase modifier UUIDs/prices and include notes + immutable cloning in CartContext.addToCart',
      affectedComponents: {
        aiService: 'cart_tools.py:243-273,310-316',
        frontend: 'CartContext.jsx:48-77, AiChatContext.jsx:177-203,308-313',
        backend: 'orderController.js:458-463',
      },
    });

    const tableA1 = await getTableByNumber(supabase, 'A1');
    const items = await getMenuItems(supabase, { limit: 10 });
    const noteDish = items.find((i) => !/trà đào/i.test(i.name)) || items[0];
    cleanup.trackTable(tableA1.id);

    const guestCtx = await audit.createAuditContext('guest-aria-fe-a06');
    await guestCtx.addInitScript(() => {
      localStorage.setItem('hasSeenGuestModal', 'true');
      localStorage.setItem('i18nextLng', 'en');
    });
    const guestPage = await audit.newPage(guestCtx);
    audit.setEvidencePage(guestPage, 'FE-A06', 'AriaSyntheticModifiersCartDesync');

    await guestPage.goto(
      `/menu?table=${tableA1.id}&table_number=${encodeURIComponent(tableA1.table_number)}&token=${tableA1.qr_code_token}`
    );

    // Sub-check (b): CartContext notes-merge check via /menu UI
    const searchInput = guestPage.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await searchInput.fill(noteDish.name);
    const dishCard = guestPage
      .locator('div.cursor-pointer')
      .filter({ has: guestPage.locator('h3', { hasText: noteDish.name }) })
      .first();
    await expect(dishCard).toBeVisible({ timeout: 5000 });

    await dishCard.click();
    await guestPage.locator('#notes').fill('No ice');
    await guestPage.locator('div.fixed button').filter({ hasText: /Add to Cart/i }).click();

    await dishCard.click();
    await guestPage.locator('#notes').fill('Extra sweet');
    await guestPage.locator('div.fixed button').filter({ hasText: /Add to Cart/i }).click();

    const cartAfterNotes = await guestPage.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'));
    const matchingNotesItems = cartAfterNotes.filter((item) => item.id === noteDish.id);
    expect.soft(
      matchingNotesItems.length,
      'CartContext must preserve distinct item notes ("No ice", "Extra sweet") as 2 separate cart entries'
    ).toBe(2);

    // Sub-check (a): Aria adds item with modifiers
    await guestPage.locator('button[aria-label="Mở Aria chat"]').click();
    const chatInput = guestPage.locator('textarea[placeholder="Nhập câu hỏi cho Aria..."]');
    await expect(chatInput).toBeVisible({ timeout: 3000 });
    await chatInput.fill('Thêm 1 Trà Đào Cam Sả 50% đường 70% đá vào giỏ hàng');
    await guestPage.locator('button[aria-label="Gửi tin nhắn"]').click();

    await expect
      .poll(
        async () => {
          const c = await guestPage.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'));
          return c.some((item) => Array.isArray(item.modifiers) && item.modifiers.length > 0);
        },
        { timeout: 20_000, message: 'Wait for Aria to add item with modifiers to localStorage cart' }
      )
      .toBe(true);

    const cartJson = await guestPage.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'));
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const allModifierIds = cartJson.flatMap((item) => (item.modifiers || []).map((m) => m.id));
    expect.soft(allModifierIds.length, 'Aria item must contain modifiers').toBeGreaterThan(0);
    for (const modId of allModifierIds) {
      expect.soft(modId, 'Aria modifier ID must be a valid Supabase UUID').toMatch(uuidRegex);
    }

    // Sub-check (c): Attempt Checkout (POST /api/orders) with Aria cart item
    await guestPage.goto('/cart');
    await expect(guestPage.getByRole('heading', { name: /Shopping Cart/i })).toBeVisible({ timeout: 5000 });

    const orderResPromise = guestPage.waitForResponse(
      (res) => {
        try {
          return new URL(res.url()).pathname === '/api/orders' && res.request().method() === 'POST';
        } catch (_) {
          return false;
        }
      },
      { timeout: 10_000 }
    );
    await guestPage.getByRole('button', { name: /Checkout/i }).click();
    const orderRes = await orderResPromise;
    const orderResStatus = orderRes.status();
    try {
      const orderBody = await orderRes.json();
      if (orderBody?.order_id) cleanup.trackOrder(orderBody.order_id);
    } catch (_) {}
    expect.soft(orderResStatus, 'Checkout POST /api/orders with Aria cart item must return 201').toBe(201);
  });

  test('TC_SYNC_FE_A09: CartPage must not trigger 401 for unauthenticated guests and must clamp Total >= 0', async ({
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_FE_A09',
      module: 'Cart/Aria',
      scenario: 'CartPage fires unauthorized GET /api/admin/tables (401) for guests and CartPage.jsx:306 lacks defensive Math.max(0, ...) Total clamp',
      preConditions: 'Temp coupon AUDIT_FE_A09 (fixed 500,000đ); unauthenticated Guest adds 1 dish and visits /cart',
      steps: [
        '1. Insert temp coupon AUDIT_FE_A09 (fixed 500,000đ, min_order_value 0)',
        '2. Guest adds 1 item on /menu?table=<A1> and navigates to /cart while monitoring 401 responses',
        '3. Apply voucher AUDIT_FE_A09',
        '4. Assert zero 401 responses on /api/admin/tables and displayed Total >= 0',
      ],
      testData: { coupon: 'AUDIT_FE_A09', discount_value: 500000 },
      expectedBehavior: 'Zero 401 errors for guest and Total clamped to >= 0đ',
      failActualResult: 'Guest /cart triggered 401 on GET /api/admin/tables (couponService capped discountAmount at subtotal so displayed Total was >= 0; CartPage.jsx:306 still lacks Math.max(0, ...))',
      defectId: 'BUG-FE-A09',
      severity: 'HIGH',
      rootCause: 'frontend/src/pages/customer/CartPage.jsx:49 calls /api/admin/tables without auth check, and line 306 computes total = totalBeforeDiscount - voucherDiscount without Math.max(0, ...)',
      proposedFix: 'Guard /api/admin/tables fetch behind user token (or use public table endpoint) and clamp total = Math.max(0, totalBeforeDiscount - voucherDiscount)',
      affectedComponents: { frontend: 'CartPage.jsx:49,282-283,304-306' },
    });

    const tableA1 = await getTableByNumber(supabase, 'A1');
    const items = await getMenuItems(supabase, { limit: 10 });
    const cheapItem = items[0];

    const now = new Date();
    const { data: coupon, error: cErr } = await supabase
      .from('coupons')
      .insert([
        {
          code: 'AUDIT_FE_A09',
          title: 'Audit Cart Negative Total',
          discount_type: 'fixed',
          discount_value: 500000,
          min_order_value: 0,
          start_date: new Date(now.getTime() - 86400_000).toISOString(),
          end_date: new Date(now.getTime() + 7 * 86400_000).toISOString(),
          is_active: true,
          target_type: 'all',
          used_count: 0,
        },
      ])
      .select()
      .single();
    if (cErr) throw new Error(`Failed to insert AUDIT_FE_A09: ${cErr.message}`);
    cleanup.trackCoupon(coupon.id);

    const guestCtx = await audit.createAuditContext('guest-cart-fe-a09');
    await guestCtx.addInitScript(() => {
      localStorage.setItem('hasSeenGuestModal', 'true');
      localStorage.setItem('i18nextLng', 'en');
    });
    const guestPage = await audit.newPage(guestCtx);
    audit.setEvidencePage(guestPage, 'FE-A09', 'CartPageGuest401AndNegativeTotal');

    const adminTable401s = [];
    guestPage.on('response', (res) => {
      if (res.url().includes('/api/admin/tables') && res.status() === 401) {
        adminTable401s.push(res.status());
      }
    });

    await guestPage.goto(
      `/menu?table=${tableA1.id}&table_number=${encodeURIComponent(tableA1.table_number)}&token=${tableA1.qr_code_token}`
    );
    await guestPage.locator('input[placeholder*="Search"]').fill(cheapItem.name);
    await guestPage.locator('div.cursor-pointer').filter({ has: guestPage.locator('h3', { hasText: cheapItem.name }) }).first().click();
    await guestPage.locator('div.fixed button').filter({ hasText: /Add to Cart/i }).click();

    await guestPage.goto('/cart');
    await expect(guestPage.getByRole('heading', { name: /Shopping Cart/i })).toBeVisible();

    const voucherInput = guestPage.locator('input[placeholder*="voucher" i]');
    await voucherInput.fill('AUDIT_FE_A09');
    await guestPage.getByRole('button', { name: /^Apply$/i }).click();

    await expect(guestPage.getByText(/✓ AUDIT_FE_A09/)).toBeVisible({ timeout: 5000 });
    const totalEl = guestPage.locator('div').filter({ hasText: /^Total:/ }).locator('span.text-emerald-600').last();
    const totalText = (await totalEl.textContent()) || '';
    const numericTotal = parseInt(totalText.replace(/[^0-9-]/g, ''), 10);

    expect.soft(adminTable401s.length, 'CartPage must not fire unauthorized GET /api/admin/tables (401) for guests').toBe(0);
    expect.soft(numericTotal, 'CartPage displayed Total must be >= 0').toBeGreaterThanOrEqual(0);
  });

  test('TC_SYNC_FE_A05: CustomerCheckoutPage must disable payment or redirect < 1500ms if order is already paid via Waiter', async ({
    request,
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_FE_A05',
      module: 'Payment',
      scenario: 'CustomerCheckoutPage has zero Socket.IO listeners, leaving payment button active after Waiter already confirmed cash payment',
      preConditions: 'Order on Table A1 in processing; Customer viewing /checkout on Cash tab',
      steps: [
        '1. Create & approve order on Table A1',
        '2. Open Customer /checkout with order state and switch to Cash tab',
        '3. Waiter confirms cash payment via POST /api/payment/confirm-cash',
        '4. Assert Call Staff for Payment button becomes disabled/hidden within < 1500ms',
      ],
      testData: { route: '/checkout', table: 'A1' },
      expectedBehavior: 'CustomerCheckoutPage listens to payment_success/order_paid and prevents double payment within 1500ms',
      failActualResult: 'CustomerCheckoutPage had zero socket listeners; Call Staff for Payment remained enabled after order was paid',
      defectId: 'BUG-FE-A05',
      severity: 'CRITICAL',
      rootCause: 'frontend/src/pages/customer/CustomerCheckoutPage.jsx has zero useSocket() subscriptions and relies on static location.state.order',
      proposedFix: 'Subscribe CustomerCheckoutPage to table_${order.table_id} payment_success/order_paid events and redirect/lock UI immediately when paid',
      affectedComponents: { frontend: 'CustomerCheckoutPage.jsx:19-25,103-140' },
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

    const { body: orderRes } = await getOrderById(request, orderId);
    const orderObj = orderRes.data;

    const guestCtx = await audit.createAuditContext('guest-checkout-fe-a05');
    await guestCtx.addInitScript(() => {
      localStorage.setItem('hasSeenGuestModal', 'true');
      localStorage.setItem('i18nextLng', 'en');
    });
    const guestPage = await audit.newPage(guestCtx);
    audit.setEvidencePage(guestPage, 'FE-A05', 'CheckoutZeroSocketDoublePayRisk');

    await guestPage.goto('/menu');
    await guestPage.evaluate((order) => {
      window.history.pushState({ usr: { order }, key: 'audit-chk-a05', idx: 1 }, '', '/checkout');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, orderObj);

    await guestPage.getByRole('button', { name: /Cash/i }).click();
    const callStaffBtn = guestPage.getByRole('button', { name: /Call Staff for Payment/i });
    await expect(callStaffBtn).toBeVisible();

    const payRes = await request.post(`${API_BASE}/api/payment/confirm-cash`, {
      headers: authHeaders(waiterAuth.token),
      data: { orderId },
    });
    expect(payRes.status()).toBe(200);

    await expect(callStaffBtn).toBeHidden({ timeout: 1500 });
  });

  test('TC_SYNC_FE_B02: AiChatContext must not send DELETE /api/ai/session/:id on initial page mount under StrictMode', async ({
    supabase,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_FE_B02',
      module: 'Cart/Aria',
      scenario: 'React 19 StrictMode triggers AiChatContext useEffect cleanup on mount, immediately firing DELETE /api/ai/session/<uuid>',
      preConditions: 'Guest visits /menu with QR params',
      steps: [
        '1. Attach request listener for DELETE /api/ai/session/*',
        '2. Navigate to /menu?table=<A1>',
        '3. Assert zero DELETE /api/ai/session/ requests fired during initial boot',
      ],
      testData: { route: '/menu', endpoint: 'DELETE /api/ai/session/:id' },
      expectedBehavior: 'Zero DELETE /api/ai/session/ calls during initial mount',
      failActualResult: 'StrictMode mount-unmount-remount immediately fired DELETE /api/ai/session/<uuid> on boot',
      defectId: 'BUG-FE-B02',
      severity: 'HIGH',
      rootCause: 'frontend/src/contexts/AiChatContext.jsx:380-386 deletes session in useEffect cleanup without pagehide/unmount guard, triggered by React.StrictMode (main.jsx:14)',
      proposedFix: 'Move session deletion to explicit resetSession/beforeunload or track active mount ref instead of unconditional useEffect cleanup',
      affectedComponents: { frontend: 'AiChatContext.jsx:379-386, main.jsx:14' },
    });

    const tableA1 = await getTableByNumber(supabase, 'A1');

    const guestCtx = await audit.createAuditContext('guest-strictmode-b02');
    await guestCtx.addInitScript(() => {
      localStorage.setItem('hasSeenGuestModal', 'true');
      localStorage.setItem('i18nextLng', 'en');
    });
    const guestPage = await audit.newPage(guestCtx);
    audit.setEvidencePage(guestPage, 'FE-B02', 'StrictModeDeletesAiSessionOnBoot');

    const deleteRequests = [];
    guestPage.on('request', (req) => {
      if (req.method() === 'DELETE' && req.url().includes('/api/ai/session/')) {
        deleteRequests.push(req.url());
      }
    });

    await guestPage.goto(
      `/menu?table=${tableA1.id}&table_number=${encodeURIComponent(tableA1.table_number)}&token=${tableA1.qr_code_token}`
    );
    await guestPage.waitForTimeout(1000);

    expect(deleteRequests.length).toBe(0);
  });
});
