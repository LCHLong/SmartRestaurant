const { test, expect } = require('./fixtures/audit-fixture');
const { API_BASE, loginAs, seedBrowserAuth, authHeaders } = require('./helpers/auth');
const {
  getTableByNumber,
  getMenuItems,
  createGuestOrder,
  approveOrder,
} = require('./helpers/api');

test.describe('Table State & Reservation Multi-Context E2E Audit', () => {
  test('TC_SYNC_RES_BASE_001: Baseline Public Reservation UI create and secure lookup', async ({
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_RES_BASE_001',
      module: 'Reservation',
      scenario: 'Customer creates reservation on /reservations UI and verifies it via /reservations/lookup UI',
      preConditions: 'Free slot 2026-12-28 18:00 for 2 guests',
      steps: [
        '1. Navigate to /reservations, fill contact info + 2026-12-28 18:00 + 2 guests',
        '2. Click Check Availability, then Continue to Confirm, then Confirm Reservation',
        '3. Capture booking_code, navigate to /reservations/lookup with code + last 4 phone digits',
        '4. Verify lookup displays booking code and masked phone',
      ],
      testData: { date: '2026-12-28', time: '18:00', guest_count: 2, phone: '0901234888' },
      expectedBehavior: 'Reservation created via UI with booking_code and lookup returns booking details',
      passActualResult: 'Reservation UI created booking and /reservations/lookup verified details cleanly',
      severity: 'LOW',
      affectedComponents: { frontend: 'ReservationPage.jsx, ReservationLookupPage.jsx', backend: 'reservationController.js' },
    });

    const guestCtx = await audit.createAuditContext('guest-resv');
    const page = await audit.newPage(guestCtx);

    await page.goto('/reservations');
    await page.locator('input[name="customer_name"]').fill('Audit UI Guest');
    await page.locator('input[name="customer_phone"]').fill('0901234888');
    await page.locator('input[name="reservation_date"]').fill('2026-12-28');
    await page.locator('select[name="reservation_time"]').selectOption('18:00');

    await page.getByRole('button', { name: /Kiểm tra bàn trống/i }).click();
    await expect(page.getByText(/bàn phù hợp/i)).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /Tiếp tục xác nhận/i }).click();
    await page.getByRole('button', { name: /Xác nhận đặt bàn/i }).click();

    const codeLocator = page.locator('span.text-3xl.font-bold.text-emerald-700');
    await expect(codeLocator).toBeVisible({ timeout: 8000 });
    const bookingCode = (await codeLocator.textContent()).trim();
    expect(bookingCode).toBeTruthy();

    const { data: resvRow } = await supabase
      .from('reservations')
      .select('id')
      .eq('booking_code', bookingCode)
      .single();
    if (resvRow?.id) cleanup.trackReservation(resvRow.id);

    await page.goto('/reservations/lookup');
    await page.locator('input[placeholder*="SR-"]').fill(bookingCode);
    await page.locator('input[placeholder*="5678"]').fill('4888');
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText(bookingCode, { exact: true }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/0901\*\*\*888/)).toBeVisible({ timeout: 5000 });
  });

  test('TC_SYNC_FE_A04: Waiter TableMapPage must update table from occupied back to available < 1500ms on cash payment', async ({
    request,
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_FE_A04',
      module: 'Table',
      scenario: 'Waiter TableMapPage listens only to table_updated and misses table_status_update / order_paid emitted by confirmCashPayment',
      preConditions: 'Order on Table A1 in processing (A1 is occupied); Waiter viewing /waiter/map and Admin viewing /admin/tables',
      steps: [
        '1. Create & approve order on Table A1 so A1 is occupied',
        '2. Open Waiter /waiter/map (shows A1 "Đang dùng") and Admin /admin/tables (shows Table A1 "Occupied")',
        '3. Confirm cash payment via POST /api/payment/confirm-cash (emits table_status_update available + order_paid)',
        '4. Assert Waiter /waiter/map updates Table A1 to "Trống" within < 1500ms without reload',
      ],
      testData: { table: 'A1', routes: ['/waiter/map', '/admin/tables'] },
      expectedBehavior: 'Waiter TableMapPage updates A1 from "Đang dùng" to "Trống" within 1500ms',
      failActualResult: 'Waiter TableMapPage remained stuck on "Đang dùng" (occupied) after cash payment freed A1',
      defectId: 'BUG-FE-A04',
      severity: 'CRITICAL',
      rootCause: 'frontend/src/pages/waiter/TableMapPage.jsx:101 listens only to table_updated and misses table_status_update & order_paid; TableManagement.jsx:162 listens only to table_status_update',
      proposedFix: 'Standardize table status socket event name across backend/frontend and handle both table_status_update & order_paid in TableMapPage.jsx',
      affectedComponents: {
        frontend: 'TableMapPage.jsx:96-132, TableManagement.jsx:98,162-163',
        backend: 'paymentController.js:351, tableController.js:532',
      },
    });

    const waiterAuth = await loginAs(request, 'waiter');
    const adminAuth = await loginAs(request, 'tempAdmin');
    const tableA1 = await getTableByNumber(supabase, 'A1');
    const items = await getMenuItems(supabase, { limit: 5 });

    const created = await createGuestOrder(request, cleanup, {
      tableId: tableA1.id,
      qrToken: tableA1.qr_code_token,
      items: [{ menu_item_id: items[0].id, quantity: 1 }],
    });
    const orderId = created.body.order_id;
    await approveOrder(request, waiterAuth.token, orderId);

    const waiterCtx = await audit.createAuditContext('waiter-map-fe-a04');
    await seedBrowserAuth(waiterCtx, waiterAuth);
    const waiterPage = await audit.newPage(waiterCtx);
    audit.setEvidencePage(waiterPage, 'FE-A04', 'WaiterTableMapDesync');

    const adminCtx = await audit.createAuditContext('admin-tables-fe-a04');
    await seedBrowserAuth(adminCtx, adminAuth);
    const adminPage = await audit.newPage(adminCtx);

    await waiterPage.goto('/waiter/map');
    await adminPage.goto('/admin/tables');

    const waiterA1Card = waiterPage
      .locator('div.h-36.rounded-2xl')
      .filter({ has: waiterPage.locator('span.text-3xl', { hasText: /^A1$/ }) })
      .first();
    await expect(waiterA1Card).toContainText(/Đang dùng/i);

    const adminA1Card = adminPage
      .locator('div.rounded-2xl.shadow-sm')
      .filter({ has: adminPage.locator('h3', { hasText: /Table\s+A1$/ }) })
      .first();
    await expect(adminA1Card).toContainText(/Occupied/i);

    const payRes = await request.post(`${API_BASE}/api/payment/confirm-cash`, {
      headers: authHeaders(waiterAuth.token),
      data: { orderId },
    });
    expect(payRes.status()).toBe(200);

    await expect(adminA1Card).toContainText(/Available/i, { timeout: 1500 });
    await expect(waiterA1Card).toContainText(/Trống/i, { timeout: 1500 });
  });

  test('TC_SYNC_BE_A04_E2E: PATCH /api/admin/tables/:id/status must sync Admin TableManagement & Waiter TableMapPage < 1500ms', async ({
    request,
    supabase,
    cleanup,
    audit,
  }) => {
    audit.setMeta({
      testCaseId: 'TC_SYNC_BE_A04_E2E',
      module: 'Table',
      scenario: 'PATCH /api/admin/tables/:id/status emits zero socket events, leaving both Admin TableManagement & Waiter TableMapPage stale',
      preConditions: 'Table A2 available; Admin on /admin/tables and Waiter on /waiter/map',
      steps: [
        '1. Open Admin /admin/tables and Waiter /waiter/map showing Table A2 available',
        '2. Send PATCH /api/admin/tables/:id/status { status: "occupied" } as waiter02',
        '3. Assert Admin card updates to Occupied and Waiter card updates to Đang dùng < 1500ms',
      ],
      testData: { table: 'A2', endpoint: 'PATCH /api/admin/tables/:id/status', status: 'occupied' },
      expectedBehavior: 'Both /admin/tables and /waiter/map reflect Table A2 status=occupied within 1500ms without reload',
      failActualResult: 'Both Admin TableManagement and Waiter TableMapPage stayed Available/Trống because PATCH /status emitted zero socket events',
      defectId: 'BE-A04',
      severity: 'CRITICAL',
      rootCause: 'backend/src/controllers/tableController.js:564-585 (updateTableStatus) performs DB update without emitting Socket.IO event',
      proposedFix: 'Emit table_status_update to waiter and admin rooms from tableController.updateTableStatus',
      affectedComponents: {
        backend: 'tableController.js:564-585',
        frontend: 'TableManagement.jsx, TableMapPage.jsx',
      },
    });

    const waiterAuth = await loginAs(request, 'waiter');
    const adminAuth = await loginAs(request, 'tempAdmin');
    const tableA2 = await getTableByNumber(supabase, 'A2');
    cleanup.trackTable(tableA2.id);

    const adminCtx = await audit.createAuditContext('admin-tables-be-a04');
    await seedBrowserAuth(adminCtx, adminAuth);
    const adminPage = await audit.newPage(adminCtx);
    audit.setEvidencePage(adminPage, 'BE-A04', 'PatchTableStatusNoSocketEmit');

    const waiterCtx = await audit.createAuditContext('waiter-map-be-a04');
    await seedBrowserAuth(waiterCtx, waiterAuth);
    const waiterPage = await audit.newPage(waiterCtx);

    await adminPage.goto('/admin/tables');
    await waiterPage.goto('/waiter/map');

    const adminA2Card = adminPage
      .locator('div.rounded-2xl.shadow-sm')
      .filter({ has: adminPage.locator('h3', { hasText: /Table\s+A2$/ }) })
      .first();
    await expect(adminA2Card).toContainText(/Available/i);

    const waiterA2Card = waiterPage
      .locator('div.h-36.rounded-2xl')
      .filter({ has: waiterPage.locator('span.text-3xl', { hasText: /^A2$/ }) })
      .first();
    await expect(waiterA2Card).toContainText(/Trống/i);

    const patchRes = await request.patch(`${API_BASE}/api/admin/tables/${tableA2.id}/status`, {
      headers: authHeaders(waiterAuth.token),
      data: { status: 'occupied' },
    });
    expect(patchRes.status()).toBe(200);

    await expect(adminA2Card).toContainText(/Occupied/i, { timeout: 1500 });
    await expect(waiterA2Card).toContainText(/Đang dùng/i, { timeout: 1500 });
  });
});
