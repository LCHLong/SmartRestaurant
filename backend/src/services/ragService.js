/**
 * ragService.js
 * Lightweight 2-Stage RAG (Retrieval-Augmented Generation) cho Aria
 *
 * Giai đoạn 1: Lọc nhanh tại Supabase (keyword / category / pgvector similarity)
 * Giai đoạn 2: Trả về Top 6-8 món để nhúng vào dynamic prompt
 *
 * Cache menu theo Redis (TTL 5 phút) để giảm DB calls.
 */

const supabase = require('../config/supabaseClient');
const redis = require('../config/redisClient');

const MENU_CACHE_TTL = 300; // 5 phút
const TOP_K = 6; // Số món tối đa lấy từ RAG

/**
 * Lấy full menu từ Redis cache hoặc Supabase
 * @param {string} restaurantId
 * @returns {Array} danh sách menu items
 */
async function getMenuFromCache(restaurantId) {
  const cacheKey = `menu:${restaurantId || 'default'}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (_) { /* Redis miss - proceed to DB */ }

  // 1. Thử lấy với các cột AI mở rộng (nếu đã chạy migration)
  let { data, error } = await supabase
    .from('menu_items')
    .select(`
      id,
      name,
      price,
      description,
      image_url,
      category_id,
      ingredients,
      allergens,
      spice_level,
      calories,
      ai_description,
      is_trending,
      is_available,
      category:categories ( name )
    `)
    .eq('is_available', true)
    .order('name');

  // 2. Nếu các cột AI chưa tồn tại trong DB, fallback truy vấn các cột mặc định
  if (error) {
    const basicQuery = await supabase
      .from('menu_items')
      .select(`
        id,
        name,
        price,
        description,
        image_url,
        category_id,
        is_available,
        category:categories ( name )
      `)
      .eq('is_available', true)
      .order('name');

    data = basicQuery.data;
    if (basicQuery.error) {
      console.error('[ragService] Supabase fetch error:', basicQuery.error.message);
      return [];
    }
  }

  // Chuẩn hoá dữ liệu category
  const items = (data || []).map(item => ({
    ...item,
    categories: item.categories || item.category || { name: '' }
  }));

  // Lưu vào Redis với TTL 5 phút
  try {
    await redis.set(cacheKey, JSON.stringify(items), { EX: MENU_CACHE_TTL });
  } catch (_) { /* Ignore Redis set error */ }

  return items;
}

/**
 * Lấy order history của user đã đăng nhập (TTL 10 phút)
 * @param {string} userId
 * @returns {Array} danh sách item_id đã đặt trước
 */
async function getOrderHistory(userId) {
  if (!userId) return [];

  const cacheKey = `order_history:${userId}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (_) { /* miss */ }

  try {
    const { data: userOrders, error: orderErr } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (orderErr || !userOrders || userOrders.length === 0) return [];

    const orderIds = userOrders.map(o => o.id);
    const { data, error } = await supabase
      .from('order_items')
      .select('menu_item_id, menu_items(name)')
      .in('order_id', orderIds)
      .limit(20);

    if (error || !data) return [];

    const history = data.map(d => ({
      id: d.menu_item_id,
      name: d.menu_items?.name
    })).filter(d => d.name);

    try {
      await redis.set(cacheKey, JSON.stringify(history), { EX: 600 });
    } catch (_) { /* Ignore */ }

    return history;
  } catch (err) {
    console.warn('[ragService] getOrderHistory error (skipped):', err.message);
    return [];
  }
}

/**
 * Stage 1 — Lọc nhanh: keyword matching trên name, description, category
 * Trả về Top K món liên quan nhất đến user message
 *
 * @param {string} userMessage - Tin nhắn khách
 * @param {Array}  allItems    - Toàn bộ menu từ cache
 * @returns {Array} Top K items
 */
function stage1Filter(userMessage, allItems) {
  const query = userMessage.toLowerCase();

  // Tokenize query thành các từ khoá
  const keywords = query
    .split(/[\s,./!?]+/)
    .filter(w => w.length > 1);

  // Tính score cho từng item
  const scored = allItems.map(item => {
    let score = 0;
    const searchable = [
      item.name,
      item.description,
      item.ai_description,
      item.categories?.name,
      ...(item.ingredients || []),
      ...(item.allergens || [])
    ].filter(Boolean).join(' ').toLowerCase();

    for (const kw of keywords) {
      if (searchable.includes(kw)) score += 2;
    }

    // Bonus: trending item
    if (item.is_trending) score += 1;

    return { item, score };
  });

  // Sort by score, lấy top K
  const topItems = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K)
    .map(s => s.item);

  return topItems;
}

/**
 * Stage 2 — Fallback: nếu Stage 1 không ra kết quả, lấy best-seller / trending
 * @param {Array} allItems
 * @returns {Array}
 */
function stage2Fallback(allItems) {
  const trending = allItems.filter(i => i.is_trending).slice(0, TOP_K);
  if (trending.length >= 3) return trending;

  // Nếu không đủ trending, lấy ngẫu nhiên từ toàn bộ menu
  return allItems.slice(0, TOP_K);
}

/**
 * Main RAG function — Lightweight 2-Stage Retrieval
 * @param {string} userMessage
 * @param {string} restaurantId
 * @returns {{ context: Array, fallbackUsed: boolean, allItems: Array }}
 */
async function retrieveMenuContext(userMessage, restaurantId) {
  const allItems = await getMenuFromCache(restaurantId);

  if (!allItems.length) {
    return { context: [], fallbackUsed: true, allItems: [] };
  }

  // Stage 1: keyword filter
  let context = stage1Filter(userMessage, allItems);
  let fallbackUsed = false;

  // Stage 2: fallback nếu Stage 1 rỗng
  if (context.length === 0) {
    context = stage2Fallback(allItems);
    fallbackUsed = true;
  }

  return { context, fallbackUsed, allItems };
}

/**
 * Invalidate menu cache (khi admin cập nhật menu)
 * @param {string} restaurantId
 */
async function invalidateMenuCache(restaurantId) {
  try {
    await redis.del(`menu:${restaurantId}`);
    console.log(`[ragService] Cache invalidated for restaurant: ${restaurantId}`);
  } catch (err) {
    console.error('[ragService] Cache invalidation error:', err.message);
  }
}

module.exports = {
  retrieveMenuContext,
  getMenuFromCache,
  getOrderHistory,
  invalidateMenuCache
};
