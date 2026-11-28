# SmartRestaurant Realtime Sync & Data Integrity Audit Findings

**Audit Branch:** `audit/realtime-sync-data-consistency-20261127-190740`  
**Execution Date:** `2026-11-27T19:51:55Z`  
**Test Suite:** `/workspaces/SmartRestaurant/tests/realtime-audit/` (`npx playwright test -c tests/realtime-audit/playwright.config.js`)  
**Machine-Readable Results:** `tests/realtime-audit/results.json`  
**Summary:** **34 Executed** | **6 PASS** (all baseline E2E + API/Socket flows) | **28 FAIL** (verified application defects; all multi-assertion defect sub-checks executed via `expect.soft()`) | **0 BLOCKED**

---

## 1. Baseline Flows Verified (PASS)

| Test Case ID | Module | Scenario | Result |
|---|---|---|---|
| `TC_SYNC_BASE_001` | Order | Guest `POST /api/orders` emits `new_order`, `table_status_update`, `order_status_update` < 1500ms | **PASS** (1011ms) |
| `TC_SYNC_BASE_002` | Payment | Cash payment `create-intent` -> `confirm-cash` syncs `waiter`, `kitchen`, `table_<id>`, and DB < 1500ms | **PASS** (1297ms) |
| `TC_SYNC_BASE_003` | Reservation | `POST /api/reservations` + `GET /api/reservations/lookup` assigns DB table & masks phone | **PASS** (205ms) |
| `TC_SYNC_ORD_BASE_001` | Order | Multi-context E2E: Guest QR Menu -> Waiter POS Accept -> Kitchen KDS Complete -> Waiter Served < 1500ms | **PASS** (11409ms) |
| `TC_SYNC_RES_BASE_001` | Reservation | Public `/reservations` UI booking + `/reservations/lookup` UI verification | **PASS** (3411ms) |
| `TC_SYNC_PAY_BASE_001` | Payment | Customer `/checkout` Cash -> Waiter `/waiter/orders` confirm -> Guest `/orders/:id` Paid < 1500ms | **PASS** (8356ms) |

---

## 2. Dynamically Verified Defects (28 FAIL Records across 26 Unique Defect IDs)

### Group A — Realtime Sync & Data Consistency Defects (CRITICAL / HIGH / MEDIUM)

#### 1. `BUG-FE-A01` (CRITICAL) — `AuthContext` omits `token`, leaving `SocketContext` unauthenticated after SPA login
- **Test Case ID:** `TC_SYNC_FE_A01`
- **Affected Components:** `frontend/src/contexts/AuthContext.jsx:33-37`, `frontend/src/contexts/SocketContext.jsx:15,21,67`, `backend/src/config/socket.js:52-72`
- **Steps to Reproduce:**
  1. Open fresh context and log in at `/login` as `waiter02@restaurant.com` / `admin123` (no F5 reload).
  2. Navigate via SPA to `/waiter/orders`.
  3. Create a guest order on Table `A1` via `POST /api/orders`.
- **Expected vs Actual:** Waiter UI should display the new order `< 1500ms`; instead `SocketContext` remained a guest socket (`token` was `undefined`), `join_room('waiter')` failed, and the order never appeared without F5.
- **Root Cause:** `AuthContext` exports `{ user, login, logout, loading }` without `token`, so `SocketContext`'s `[token]` dependency never re-runs after login/logout.
- **Proposed Fix:** Track and export `token` in `AuthContext.jsx` so `SocketContext` reconnects immediately on `login()` and `logout()`.
- **Evidence:** `tests/realtime-audit/evidence/BUG_FE-A01_AuthTokenOmittedSocketDesync.png`, `tests/realtime-audit/evidence/BUG_FE-A01_AuthTokenOmittedSocketDesync.webm`

#### 2. `BUG-FE-A02` (CRITICAL) — `OrderTrackingPage` reads `order.order_items` while API returns `order.items`
- **Test Case ID:** `TC_SYNC_FE_A02`
- **Affected Components:** `frontend/src/pages/customer/OrderTrackingPage.jsx:65,96,275,400`, `backend/src/controllers/orderController.js:659`
- **Steps to Reproduce:**
  1. Create an order on `A1`, approve to `processing`, and mark all items `ready` via Kitchen API.
  2. Open `/orders/:orderId` in a customer browser context.
- **Expected vs Actual:** Order item rows render with `Ready` badge and `Pay Now` button is visible; actually 0 item rows rendered and `Pay Now` never appeared.
- **Root Cause:** `GET /api/orders/:id` returns `items:order_items(...)`, whereas `OrderTrackingPage.jsx` accesses `order.order_items`.
- **Proposed Fix:** Replace `order.order_items` with `order.items` throughout `OrderTrackingPage.jsx` and include `'served'` in `canPay` readiness checks.
- **Evidence:** `tests/realtime-audit/evidence/BUG_FE-A02_OrderTrackingItemsAndPayNowMissing.png`, `tests/realtime-audit/evidence/BUG_FE-A02_OrderTrackingItemsAndPayNowMissing.webm`

#### 3. `BE-A01` (CRITICAL) — `addItemsToExistingOrder` omits `status` in SELECT, never notifying Kitchen KDS
- **Test Case IDs:** `TC_SYNC_BE_A01`, `TC_SYNC_BE_A01_E2E`
- **Affected Components:** `backend/src/controllers/orderController.js:823-827,890-897`, `frontend/src/pages/kitchen/KitchenDisplayPage.jsx:67-76`
- **Steps to Reproduce:**
  1. Approve an order on `A1` (`status = 'processing'`) visible on `/kitchen`.
  2. Send `POST /api/orders/:id/items` with an additional menu item.
- **Expected vs Actual:** Kitchen room receives `new_order` and KDS displays the new dish `< 1500ms`; actually 0 events were emitted to `'kitchen'` and KDS did not update without F5.
- **Root Cause:** `orderController.js:825` selects `subtotal, tax_amount, total_amount, table_id, coupon_code, discount_amount` without `status` or `customer_id`, so `currentOrder.status === 'processing'` at line 890 is always `false`.
- **Proposed Fix:** Include `status` and `customer_id` in `.select(...)` at `orderController.js:825`.
- **Evidence:** `tests/realtime-audit/evidence/BUG_BE-A01_AddItemsKitchenKdsDesync.png`, `tests/realtime-audit/evidence/BUG_BE-A01_AddItemsKitchenKdsDesync.webm`

#### 4. `BUG-FE-A03` (CRITICAL) — Kitchen KDS misses `order_status_updated` and `additional_items_rejected`
- **Test Case ID:** `TC_SYNC_FE_A03`
- **Affected Components:** `frontend/src/pages/kitchen/KitchenDisplayPage.jsx:104-106`, `backend/src/controllers/orderController.js:277,1145`
- **Steps to Reproduce:**
  1. Open `/kitchen` displaying an active `processing` order on `A1`.
  2. Complete the order via `POST /api/orders/:id/checkout` (which emits `order_status_updated` to `'kitchen'`).
- **Expected vs Actual:** Completed order card disappears from `/kitchen` `< 1500ms`; actually the card remained stuck on KDS until F5.
- **Root Cause:** `KitchenDisplayPage.jsx` subscribes only to `new_order`, `kitchen_item_update`, and `order_paid`, omitting `order_status_updated` and `additional_items_rejected` (and `updateOrderStatus` at `orderController.js:277` also omits `'kitchen'` on cancel).
- **Proposed Fix:** Add `order_status_updated` and `additional_items_rejected` handlers in `KitchenDisplayPage.jsx`, and emit `order_status_updated` to `'kitchen'` in `orderController.updateOrderStatus`.
- **Evidence:** `tests/realtime-audit/evidence/BUG_FE-A03_KitchenMissesOrderStatusUpdated.png`, `tests/realtime-audit/evidence/BUG_FE-A03_KitchenMissesOrderStatusUpdated.webm`

#### 5. `BUG-FE-A04` (CRITICAL) — `TableMapPage` vs `TableManagement` `table_status_update` / `table_updated` Event Split
- **Test Case ID:** `TC_SYNC_FE_A04`
- **Affected Components:** `frontend/src/pages/waiter/TableMapPage.jsx:96-132`, `frontend/src/pages/admin/TableManagement.jsx:98,162-163`, `backend/src/controllers/paymentController.js:351`, `tableController.js:532`
- **Steps to Reproduce:**
  1. Open Waiter `/waiter/map` and Admin `/admin/tables` while Table `A1` has an active order (`occupied` / `Đang dùng`).
  2. Confirm cash payment via `POST /api/payment/confirm-cash` (emits `order_paid` + `table_status_update` `{ status: 'available' }`).
- **Expected vs Actual:** Waiter `/waiter/map` updates `A1` back to `Trống` `< 1500ms`; actually Waiter Table Map stayed `Đang dùng` (`occupied`).
- **Root Cause:** `TableMapPage` listens only to `table_updated` (ignoring `table_status_update` and `order_paid`), while `TableManagement` listens only to `table_status_update` (ignoring `table_updated`) and never updates `stats` KPIs.
- **Proposed Fix:** Unify table status event payloads across backend/frontend and subscribe both views to `table_status_update`, `table_updated`, and `order_paid`.
- **Evidence:** `tests/realtime-audit/evidence/BUG_FE-A04_WaiterTableMapDesync.png`, `tests/realtime-audit/evidence/BUG_FE-A04_WaiterTableMapDesync.webm`

#### 6. `BE-A04` (CRITICAL) — `PATCH /api/admin/tables/:id/status` emits ZERO Socket.IO events
- **Test Case IDs:** `TC_SYNC_BE_A04`, `TC_SYNC_BE_A04_E2E`
- **Affected Components:** `backend/src/controllers/tableController.js:564-585`, `frontend/src/pages/admin/TableManagement.jsx`, `frontend/src/pages/waiter/TableMapPage.jsx`
- **Steps to Reproduce:**
  1. Open Admin `/admin/tables` and Waiter `/waiter/map` showing Table `A2` available.
  2. Send `PATCH /api/admin/tables/:id/status` `{ status: "occupied" }` as `waiter02`.
- **Expected vs Actual:** Waiter/Admin sockets and UIs reflect `occupied` `< 1500ms`; actually HTTP 200 returned with 0 socket events emitted and both UIs remained stale.
- **Root Cause:** `tableController.updateTableStatus` updates Supabase without calling `getIO()`.
- **Proposed Fix:** Emit `table_status_update` to `'waiter'` and `'admin'` rooms after updating `tables.status`.
- **Evidence:** `tests/realtime-audit/evidence/BUG_BE-A04_PatchTableStatusNoSocketEmit.png`, `tests/realtime-audit/evidence/BUG_BE-A04_PatchTableStatusNoSocketEmit.webm`

#### 7. `BE-A02` (CRITICAL) — Stripe `handleWebhook` emits to wrong room `table_${orderId}` and crashes (`ReferenceError: orderInfo is not defined`)
- **Test Case ID:** `TC_SYNC_BE_A02`
- **Affected Components:** `backend/src/controllers/paymentController.js:203-283`
- **Steps to Reproduce:** Send `POST /api/payment/webhook` with `payment_intent.succeeded` and `metadata: { orderId }`.
- **Expected vs Actual:** HTTP 200, `payment_success` emitted to `table_<tableId>`, table released, items marked `served`; actually crashed with HTTP 500 `orderInfo is not defined`, emitted to `table_${orderId}`, and left table `occupied`.
- **Root Cause:** `handleWebhook` emits to `table_${orderId}` at line 266 and dereferences undeclared `orderInfo?.table_id` at line 270 without `try/catch`.
- **Proposed Fix:** Query `orders` for `table_id`, emit to `table_${order.table_id}`, enforce strict Stripe signature verification, and add idempotency checks.

#### 8. `BE-A03` (CRITICAL) — `checkoutOrder` omits customer room emit and leaves `order_items` un-served
- **Test Case ID:** `TC_SYNC_BE_A03`
- **Affected Components:** `backend/src/controllers/orderController.js:1087-1161`
- **Steps to Reproduce:** Call `POST /api/orders/:id/checkout` `{ payment_method: 'cash' }` while Guest socket listens on `table_<tableId>`.
- **Expected vs Actual:** Customer room receives completion/payment event `< 1500ms` and `order_items` become `served`; actually 0 events reached `table_<tableId>` and items stayed `preparing`.
- **Root Cause:** `checkoutOrder` emits only to `'waiter'` and `'kitchen'`, omitting `table_${order.table_id}` and `order_items` update.
- **Proposed Fix:** Emit `payment_success` & `order_status_update` to `table_${order.table_id}` and update `order_items.status` to `'served'`.

#### 9. `BE-A05` (CRITICAL) — Reservation TOCTOU double-booking race condition
- **Test Case ID:** `TC_SYNC_BE_A05`
- **Affected Components:** `backend/src/controllers/reservationController.js:337-437`, `database/migrations/30_add_reservations_and_shifts.sql`
- **Steps to Reproduce:** Pre-book `C4` (cap 10) at `2026-12-25 19:00` leaving only `C5` free for 9 guests; fire two concurrent `POST /api/reservations` requests via `Promise.all`.
- **Expected vs Actual:** At most 1 succeeds (`201`) and the other returns `409`; actually BOTH returned `201` and double-booked the exact same `table_id` (`C5`).
- **Root Cause:** Non-atomic `SELECT` -> in-memory filter -> `INSERT` without PostgreSQL transaction lock or `EXCLUDE USING gist` constraint.
- **Proposed Fix:** Move table allocation & insert into an atomic PostgreSQL RPC (`FOR UPDATE` / advisory lock) and add a DB exclusion constraint.

#### 10. `BUG-FE-A05` (CRITICAL) — `CustomerCheckoutPage` has zero Socket.IO listeners (double-payment risk)
- **Test Case ID:** `TC_SYNC_FE_A05`
- **Affected Components:** `frontend/src/pages/customer/CustomerCheckoutPage.jsx:19-25,103-140`
- **Steps to Reproduce:** Open `/checkout` on Cash tab for an active order, then have Waiter confirm cash payment via `POST /api/payment/confirm-cash`.
- **Expected vs Actual:** Checkout page locks/redirects within `< 1500ms` upon payment; actually `Call Staff for Payment` remained enabled and clickable.
- **Root Cause:** `CustomerCheckoutPage` has zero `useSocket()` listeners and relies on static `location.state.order` (also `handleCashPayment` lacks a loading lock and `handleSubmit` leaves `processing=true` if `!stripe`).
- **Proposed Fix:** Subscribe `CustomerCheckoutPage` to `table_${order.table_id}` `payment_success`/`order_paid` events and add loading guards.
- **Evidence:** `tests/realtime-audit/evidence/BUG_FE-A05_CheckoutZeroSocketDoublePayRisk.png`, `tests/realtime-audit/evidence/BUG_FE-A05_CheckoutZeroSocketDoublePayRisk.webm`

#### 11. `BUG-FE-A06` (CRITICAL) — Aria Chatbot synthetic modifier IDs & `CartContext` merge/StrictMode bugs
- **Test Case ID:** `TC_SYNC_FE_A06`
- **Affected Components:** `ai-service/tools/cart_tools.py:243-273,310-316`, `frontend/src/contexts/CartContext.jsx:48-77`, `frontend/src/contexts/AiChatContext.jsx:177-203,308-313`, `backend/src/controllers/orderController.js:458-463`
- **Steps to Reproduce:**
  1. On `/menu?table=<A1>`, add the same dish twice via UI with distinct `notes` (`"No ice"`, `"Extra sweet"`).
  2. Open Aria chat and send `"Thêm 1 Trà Đào Cam Sả 50% đường 70% đá vào giỏ hàng"`.
  3. Navigate to `/cart` and submit Checkout (`POST /api/orders`).
- **Expected vs Actual:** `CartContext` keeps 2 distinct-note entries, Aria modifiers carry valid Supabase UUIDs, and Checkout returns `201`; dynamically verified via `expect.soft()` that: (a) `CartContext` merged the 2 distinct-note additions into `1` entry (dropping `"Extra sweet"`, while `StrictMode` mutated quantity to `3`), (b) `cart_tools.py` injected synthetic IDs (`"mod-sugar-50"`, `"mod-ice-70"`, `price_modifier: 0`), and (c) Checkout `POST /api/orders` crashed with HTTP `500` (`invalid input syntax for type uuid: "mod-sugar-50"`).
- **Root Cause:** `cart_tools.py` hardcodes string IDs instead of querying DB modifiers; `CartContext.jsx:51-65` omits `notes` comparison and mutates state array in-place.
- **Proposed Fix:** Resolve real modifier UUIDs/prices from catalog in `ai-service` and fix `CartContext.addToCart` to compare `notes` and return immutable objects.
- **Evidence:** `tests/realtime-audit/evidence/BUG_FE-A06_AriaSyntheticModifiersCartDesync.png`, `tests/realtime-audit/evidence/BUG_FE-A06_AriaSyntheticModifiersCartDesync.webm`

#### 12. `BE-A07` (HIGH) — `admin` Socket.IO room receives zero order/kitchen/table/payment events
- **Test Case ID:** `TC_SYNC_BE_A07`
- **Affected Components:** `backend/src/config/socket.js:66-72`, `orderController.js`, `kitchenController.js`, `paymentController.js`, `tableController.js`
- **Expected vs Actual:** `admin` socket joined by `super_admin` receives lifecycle events `< 1500ms`; actually 0 events were emitted to `'admin'` across order creation, approval, kitchen ready, and cash confirmation.
- **Root Cause:** Controllers emit to `'waiter'`, `'kitchen'`, and `'table_<id>'` only.
- **Proposed Fix:** Broadcast order, kitchen, table, and payment events to `'admin'` room as well.

#### 13. `BUG-FE-A07` (HIGH) — Admin `OrderManagement` (`/admin/orders`) has zero Socket.IO listeners & field mismatches
- **Test Case ID:** `TC_SYNC_FE_A07`
- **Affected Components:** `frontend/src/pages/admin/OrderManagement.jsx:269,337,492,496,539-543`
- **Expected vs Actual:** New orders appear in `/admin/orders` `< 1500ms`; actually table never updated without Refresh/F5 (and detail modal reads `selectedOrder.tables`, `selectedOrder.users`, `selectedOrder.order_items` instead of `table`, `customer`, `items`).
- **Root Cause:** Zero `useSocket()` integration and stale API field names in `OrderManagement.jsx`.
- **Proposed Fix:** Subscribe `OrderManagement.jsx` to `admin` room socket events and align field names with `getOrders` response.
- **Evidence:** `tests/realtime-audit/evidence/BUG_FE-A07_AdminOrderManagementNoRealtime.png`, `tests/realtime-audit/evidence/BUG_FE-A07_AdminOrderManagementNoRealtime.webm`

#### 14. `BE-A08` (HIGH) — Kitchen rejecting an item does not recalculate order totals
- **Test Case ID:** `TC_SYNC_BE_A08`
- **Affected Components:** `backend/src/controllers/kitchenController.js:49-137`
- **Expected vs Actual:** Setting item status to `'rejected'` decreases `orders.subtotal`, `tax_amount`, and `total_amount`; actually totals remained unchanged (customer still billed for rejected dishes).
- **Root Cause:** `kitchenController.updateItemStatus` updates `order_items.status` without recalculating parent `orders` totals or guarding invalid transitions.
- **Proposed Fix:** Recalculate parent order subtotal/tax/discount/total when rejecting items and enforce valid item status transitions.

#### 15. `BE-A10` (HIGH) — No state transition guard on `completed` / `cancelled` orders
- **Test Case ID:** `TC_SYNC_BE_A10`
- **Affected Components:** `backend/src/controllers/orderController.js:164-296,699-724`
- **Expected vs Actual:** Transitioning a `completed` (paid) order to `cancelled` returns `400`/`409`; actually returned `200` and reverted the completed order to `cancelled`.
- **Root Cause:** `updateOrderStatus` fetches `currentOrder.status` without validating allowed transitions.
- **Proposed Fix:** Reject mutations/status changes on terminal `completed` and `cancelled` orders.

#### 16. `BE-A11` (HIGH) — `reallocateTable` ignores overlapping reservations on target table
- **Test Case ID:** `TC_SYNC_BE_A11`
- **Affected Components:** `backend/src/controllers/reservationController.js:824-902`
- **Expected vs Actual:** Returns `409 NO_FREE_TABLE` when all tables >= 6 capacity already have overlapping reservations at `2026-12-26 19:00`; actually returned `200` and double-booked `C2` because `C2.status` was `'available'`.
- **Root Cause:** `reallocateTable` checks `tables.status === 'available'` without checking `reservations` time-window overlaps.
- **Proposed Fix:** Filter out tables with overlapping active reservations (`pending`, `confirmed`, `seated`) in the `±90m` window.

#### 17. `BE-A12` (HIGH) — `cancelByCode` uses wildcard `.ilike`, cancels `seated` bookings, and emits no socket event
- **Test Case ID:** `TC_SYNC_BE_A12`
- **Affected Components:** `backend/src/controllers/reservationController.js:908-1027`
- **Expected vs Actual:** Partial substring returns `404`, `seated` returns `400`, and `pending` cancel emits `reservation_status_updated`; actually `.ilike('%ZZ99%')` matched and cancelled a `seated` reservation without emitting any socket event.
- **Root Cause:** `cancelByCode` uses `.ilike('booking_code', '%${cleanCode}%')`, lacks status guard, and omits socket broadcast.
- **Proposed Fix:** Use exact equality, block cancelling `seated`/`completed` reservations, require phone verification, and emit `reservation_status_updated`.

#### 18. `BE-A14` (HIGH) — `rejectAdditionalItems` produces negative `total_amount` and ignores `min_order_value`
- **Test Case ID:** `TC_SYNC_BE_A14`
- **Affected Components:** `backend/src/controllers/orderController.js:837-857,995-1021`
- **Expected vs Actual:** When rejecting items drops subtotal below `min_order_value` (100,000đ), fixed discount (80,000đ) is cleared and `new_total >= 0`; actually `new_total` became negative and invalid discount stayed applied.
- **Root Cause:** Inline coupon recalculation ignores `min_order_value` and omits `Math.max(0, ...)` / discount cap.
- **Proposed Fix:** Re-validate `min_order_value` and cap `newDiscountAmount <= newSubtotal + newTaxAmount`.

#### 19. `BUG-FE-A09` (HIGH) — `CartPage` triggers guest `401` on `/api/admin/tables` and lacks `Math.max(0, ...)` total clamp
- **Test Case ID:** `TC_SYNC_FE_A09`
- **Affected Components:** `frontend/src/pages/customer/CartPage.jsx:49,282-283,304-306`
- **Expected vs Actual:** Unauthenticated QR guest loads `/cart` with zero `401` errors and non-negative total; dynamically `GET /api/admin/tables` returned `401` (`Received: 2` unauthorized requests on `/cart`) while `couponService.js:103` capped returned `discountAmount` at subtotal so `/cart` displayed `2.000đ` (VAT) on the valid-coupon path, though `CartPage.jsx:306` statically lacks `Math.max(0, totalBeforeDiscount - voucherDiscount)` (contrasted with `BE-A14`, where backend `new_total` becomes `-53000`).
- **Root Cause:** `CartPage.jsx:49` unconditionally calls authenticated `/api/admin/tables` for guests and computes unclamped subtraction at line 306.
- **Proposed Fix:** Skip `/api/admin/tables` when unauthenticated (rely on QR table info/public endpoint) and clamp `total = Math.max(0, ...)`.
- **Evidence:** `tests/realtime-audit/evidence/BUG_FE-A09_CartPageGuest401AndNegativeTotal.png`, `tests/realtime-audit/evidence/BUG_FE-A09_CartPageGuest401AndNegativeTotal.webm`

#### 20. `BE-A16` (MEDIUM) — Missing `leave_room` Socket.IO handler leaks events across table switches
- **Test Case ID:** `TC_SYNC_BE_A16`
- **Affected Components:** `backend/src/config/socket.js:44-115`
- **Expected vs Actual:** Socket emitting `leave_room(table_A1)` stops receiving `A1` events; actually `A1` `order_status_update` still arrived because `socket.js` has no `leave_room` listener.
- **Root Cause:** `socket.js` registers `join_room` only without `leave_room`.
- **Proposed Fix:** Add `socket.on('leave_room', (room) => socket.leave(room))`.

---

### Group B — System-wide Security, Auth, Validation & Lifecycle Vulnerabilities

#### 21. `BE-B01` (CRITICAL) — Unauthenticated `/api/orders/:id/checkout` and `/api/payment/confirm`
- **Test Case ID:** `TC_SYNC_BE_B01`
- **Affected Components:** `backend/src/routes/orderRoutes.js:44`, `backend/src/routes/paymentRoutes.js:7,23`, `paymentController.js:141-196`
- **Expected vs Actual:** Unauthenticated calls return `401`; dynamically verified via `expect.soft()` that `/checkout` returned `200` (marking the order `paid`/`completed` with no token or `qr_token`) and `/payment/confirm` bypassed `401` and reached the controller returning `400`.
- **Root Cause:** Missing `verifyToken`/`authorizeRoles` middleware and missing `paymentIntent.metadata.orderId` / `amount` checks.
- **Proposed Fix:** Enforce staff JWT or verified QR session ownership and validate PaymentIntent metadata & amount.

#### 22. `BE-B03` (CRITICAL) — Negative `item.quantity` accepted in `POST /api/orders`
- **Test Case ID:** `TC_SYNC_BE_B03`
- **Affected Components:** `backend/src/controllers/orderController.js:446-470,751-775`
- **Expected vs Actual:** Quantity `-2` rejected with `400`/`422`; actually returned `201` with negative `total_amount`.
- **Root Cause:** Missing Joi schema / integer `>= 1` validation on `items[].quantity`.
- **Proposed Fix:** Add Joi validation requiring `quantity` to be a positive integer (`>= 1`).

#### 23. `BE-B04` (HIGH) — Unauthenticated Socket.IO access to `table_*` / `session_*` rooms and `call_staff` spoofing
- **Test Case ID:** `TC_SYNC_BE_B04`
- **Affected Components:** `backend/src/config/socket.js:82-110`
- **Expected vs Actual:** Unauthenticated socket cannot eavesdrop on `table_*`/`session_*` or emit spoofed `call_staff` alerts to `'waiter'`; actually joined open rooms with no error and delivered spoofed `ai_handoff_alert` (`T01`) to Waiter.
- **Root Cause:** `socket.js:82-84` blindly permits any socket into `table_*` and `session_*`, and `call_staff` lacks auth/rate-limiting.
- **Proposed Fix:** Require signed QR token / session ownership proof on `join_room` and authenticate/rate-limit `call_staff`.

#### 24. `BE-B06` (HIGH) — Unauthenticated `userId` IDOR on coupons and AI session endpoints
- **Test Case ID:** `TC_SYNC_BE_B06`
- **Affected Components:** `backend/src/controllers/aiController.js:202,739`, `backend/src/controllers/couponController.js:8,137`
- **Expected vs Actual:** Unauthenticated requests supplying arbitrary `userId` return `401`/`403`; actually returned `200` accepting client-supplied `userId`.
- **Root Cause:** Controllers trust `req.query.userId` / `req.body.userId` without JWT verification.
- **Proposed Fix:** Derive `userId` strictly from `req.user.id` when authenticated and ignore/reject unauthenticated `userId` params.

#### 25. `BUG-FE-B02` (HIGH) — React 19 `StrictMode` deletes AI session immediately on boot
- **Test Case ID:** `TC_SYNC_FE_B02`
- **Affected Components:** `frontend/src/contexts/AiChatContext.jsx:379-386`, `frontend/src/main.jsx:14`
- **Expected vs Actual:** Zero `DELETE /api/ai/session/:id` calls during initial page load; actually `StrictMode` mount-unmount-remount fired `DELETE /api/ai/session/<uuid>` immediately on boot.
- **Root Cause:** `AiChatContext.jsx:380-386` unconditionally calls `api.delete` inside `useEffect` cleanup.
- **Proposed Fix:** Trigger session cleanup only on explicit `resetSession()` or `pagehide`/`beforeunload` instead of `useEffect` unmount cleanup.
- **Evidence:** `tests/realtime-audit/evidence/BUG_FE-B02_StrictModeDeletesAiSessionOnBoot.png`, `tests/realtime-audit/evidence/BUG_FE-B02_StrictModeDeletesAiSessionOnBoot.webm`

#### 26. `BE-B09` (MEDIUM) — Coupon `target_type='guest'` DB constraint mismatch & missing `createCoupon` validation
- **Test Case ID:** `TC_SYNC_BE_B09`
- **Affected Components:** `database/migrations/17_add_coupon_usage.sql:3`, `backend/src/controllers/couponController.js:31-38,165`
- **Expected vs Actual:** `target_type='guest'` succeeds (`200`/`201`) and `{}` returns `400`/`422`; actually both returned `500` PostgreSQL constraint errors.
- **Root Cause:** DB `CHECK (target_type IN ('all', 'new_user'))` conflicts with `'guest'`/`'customer'` in controller/UI, and `createCoupon` inserts unvalidated `req.body`.
- **Proposed Fix:** Align DB CHECK constraint with `'guest'`/`'customer'` and add Joi validation on `POST /api/coupons/create`.

---

## 3. Additional Static-Verified Findings (Cataloged for M2 Issue / Defect Log Coverage)

The following static defects were also verified during code inspection (`explorer_backend_1` & `explorer_frontend_ai_1`) and are documented for completeness alongside the 26 dynamically asserted defects above:
- **`BE-A06` (HIGH):** Event name & payload inconsistency across controllers (`order_status_updated` vs `order_status_update`, `table_status_update` vs `table_updated`, `order_paid` vs `order_status_updated`, `{ orderId }` vs `{ order_id }`).
- **`BE-A09` (HIGH):** `updateOrderServedStatus` (`orderController.js:324,351-364`) blocks marking served if any item is `'rejected'` and never notifies `'kitchen'`.
- **`BE-A13` (HIGH):** `updateReservationStatus` does not sync `tables.status`; `checkInReservation` has non-atomic check-then-update race on `tables.status`.
- **`BE-A15` (MEDIUM):** `regenerateAllQR` (`tableController.js:256-332`) rotates QR tokens on `occupied` tables, invalidating active diners mid-meal.
- **`BE-B02` (CRITICAL):** `handleWebhook` (`paymentController.js:209-213`) catches Stripe signature verification failure and falls back to `event = req.body`.
- **`BE-B05` (HIGH):** Zero multi-table DB transactions / atomic RPCs (`createOrder`, `confirmCashPayment`, `approveSwapRequest`, `createReservation`).
- **`BE-B07` (HIGH):** Inconsistent hardcoded JWT fallback secrets (`'secret_tam_thoi'` vs `'your-default-secret'`) and silent downgrade of invalid JWTs in `socket.js:37-40`.
- **`BE-B08` (HIGH):** Double-payment possible (`createPaymentIntent`, `confirmPayment`, `confirmCashPayment`, `handleWebhook` accept already-`paid` orders; `payments.transaction_code` lacks `UNIQUE`; `orders.payment_method` stays `'pay_later'`).
- **`BE-B10` (MEDIUM):** `super_admin` excluded from REST `orderRoutes`, `kitchenRoutes`, `adminRoutes`, `tableRoutes` despite socket room access; `POST /api/orders/add-items` vs `POST /api/orders/:id/items` auth mismatch.
- **`BE-B11` (MEDIUM):** `getOrders` search (`orderController.js:114-125`) checks `order.tables` / `order.users` instead of aliased `order.table` / `order.customer`.
- **`BE-B12` (MEDIUM):** `getAvailableSlots` ignores conflicts when `time` omitted and returns hardcoded `DEFAULT_FALLBACK_TABLES` on error (`reservationController.js:52-69,219,263-282`).
- **`BE-B13` (LOW):** Missing global Express error handler; null dereference risks in `authController.getMe` and `reservationController.lookupReservation`.
- **`BUG-FE-A08` (HIGH):** Missing socket listeners & reconnect re-joins on `OrderTrackingPage`, `OrderListPage`, `TableMapPage`, `ReservationManagement`, `MyOrdersPage`, `GuestActiveOrdersBanner`, `MyShiftsPage`, `ShiftManagement`.
- **`BUG-FE-B01` (HIGH):** `GoogleCallback.jsx:7,51` hardcodes port `5000` and navigates kitchen OAuth logins to `/kitchen/orders` (404).
- **`BUG-FE-B03..B08` (MEDIUM/LOW) & `BUG-AI-B01..B03` (HIGH/MEDIUM):** Unguarded `JSON.parse` & missing 401 expiry interceptor (`AuthContext`, `api.js`), raw `axios` bypassing banned-user interceptor, full-page `<a href>` reloads in `ChatMessage.jsx`, unthrottled `handleReasonClick` `call_staff` spam + `'T01'` fallback, mock UI in `WaiterBillPage.jsx`, in-place `orders.sort()` in `OrderManagement.jsx`, hardcoded `20:00`/`6 guests` & `0901.234.567` in `aria_pipeline.py`, hardcoded persona patterns in `memory_engine.py`, invalid CORS wildcard+credentials in `ai-service/main.py`.
