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

  // 1. Nhận diện các từ khoá bị phủ định / loại trừ (ví dụ: "không muốn ăn thịt", "kiêng hải sản", "ngán thịt", "không cay")
  const isNonSpicyRequested = /(?:không cay|khong cay|ít cay|it cay|cay nhẹ|cay nhe|đừng cay|dung cay|không ăn cay|khong an cay)/i.test(query);
  const isSpicyRequested = /(?:thật cay|that cay|siêu cay|sieu cay|rất cay|rat cay|cay nồng|cay nong|món cay|mon cay|ăn cay|an cay)/i.test(query) && !isNonSpicyRequested;

  const negationRegex = /(?:không muốn ăn|khong muon an|không thích ăn|khong thich an|không ăn|khong an|không dùng|khong dung|dị ứng|di ung|kiêng|kieng|tránh|tranh|ngán|ngan|đừng|dung)\s+(?:với\s+|món có\s+|đồ có\s+|các món\s+)?([a-zA-Zà-ỹÀ-Ỹ\s,]+)/i;
  const negMatch = query.match(negationRegex);
  const negativeKeywords = [];

  if (isNonSpicyRequested) {
    negativeKeywords.push('cay nồng', 'sa tế', 'siêu cay', 'cay nhiều');
  }

  if (negMatch && negMatch[1]) {
    const negPhrase = negMatch[1].toLowerCase();
    if (negPhrase.includes('hải sản') || negPhrase.includes('hai san') || negPhrase.includes('tôm') || negPhrase.includes('cua') || negPhrase.includes('mực') || negPhrase.includes('ốc') || negPhrase.includes('cá')) {
      negativeKeywords.push('tôm', 'cua', 'mực', 'cá', 'hải sản', 'ốc', 'ngao', 'sò', 'hàu');
    }
    if (negPhrase.includes('đậu phộng') || negPhrase.includes('dau phong') || negPhrase.includes('lạc') || negPhrase.includes('lac') || negPhrase.includes('hạnh nhân')) {
      negativeKeywords.push('đậu phộng', 'dau phong', 'lạc', 'hạt', 'hạnh nhân');
    }
    if (negPhrase.includes('thịt') || negPhrase.includes('thit') || negPhrase.includes('bò') || negPhrase.includes('heo') || negPhrase.includes('gà')) {
      negativeKeywords.push('thịt', 'thit', 'heo', 'bò', 'gà', 'lợn', 'thịt băm', 'chả lụa', 'sườn');
    }
    if (negPhrase.includes('sữa') || negPhrase.includes('sua') || negPhrase.includes('phô mai')) {
      negativeKeywords.push('sữa', 'phô mai', 'kem', 'cheese');
    }
    if (negPhrase.includes('trứng') || negPhrase.includes('trung')) {
      negativeKeywords.push('trứng', 'hột gà');
    }
  }

  // 2. Tokenize query thành các từ khoá tích cực (loại bỏ từ dừng phủ định)
  const stopWords = new Set(['không', 'khong', 'muốn', 'muon', 'thích', 'thich', 'ăn', 'an', 'món', 'mon', 'có', 'co', 'đồ', 'do', 'được', 'duoc', 'tôi', 'toi', 'mình', 'cho', 'gợi', 'ý', 'giúp', 'nhé', 'ạ']);
  if (isNonSpicyRequested) {
    stopWords.add('cay');
  }

  const keywords = query
    .split(/[\s,./!?]+/)
    .filter(w => w.length > 1 && !stopWords.has(w) && !negativeKeywords.includes(w));

  // 3. Tính score cho từng item với bộ lọc loại trừ
  const scored = allItems.map(item => {
    const searchable = [
      item.name,
      item.description,
      item.ai_description,
      item.categories?.name,
      ...(item.ingredients || []),
      ...(item.allergens || []),
      ...(item.dietary_tags || [])
    ].filter(Boolean).join(' ').toLowerCase();

    // Loại trừ ngay lập tức nếu chứa thành phần bị cấm/kiêng
    for (const negKw of negativeKeywords) {
      if (searchable.includes(negKw)) {
        return { item, score: -999 };
      }
    }

    // Nếu khách yêu cầu không cay: loại trừ món có chữ cay hoặc spice_level > 0
    if (isNonSpicyRequested) {
      const isSpicy = (item.spice_level !== undefined && item.spice_level !== null && item.spice_level > 0) ||
                      searchable.includes('cay nồng') || searchable.includes('sa tế') ||
                      (searchable.includes('cay') && !searchable.includes('không cay'));
      if (isSpicy) {
        return { item, score: -999 };
      }
    }

    let score = 0;

    // Điểm thưởng cho món không cay khi khách yêu cầu
    if (isNonSpicyRequested) {
      score += 3;
    }

    // Điểm thưởng cho món cay khi khách yêu cầu
    if (isSpicyRequested) {
      const isSpicy = (item.spice_level !== undefined && item.spice_level !== null && item.spice_level >= 2) ||
                      searchable.includes('cay nồng') || searchable.includes('sa tế') || searchable.includes('chua cay');
      if (isSpicy) score += 5;
    }

    for (const kw of keywords) {
      if (searchable.includes(kw)) score += 2;
    }

    // Bonus: trending item
    if (item.is_trending) score += 1;

    return { item, score };
  });

  // Sort by score, lấy top K (chỉ lấy các món score > 0)
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
