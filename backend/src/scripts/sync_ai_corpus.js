/**
 * sync_ai_corpus.js
 * Đồng bộ hóa toàn bộ 60+ món ăn từ Supabase và bộ dữ liệu phong phú
 * Tạo chuỗi row_serialized chuẩn xác và ghi trực tiếp vào:
 * 1. Cột `row_serialized` trên Supabase PostgreSQL.
 * 2. File offline `ai-service/data/serialized_menu_corpus.json`.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Lỗi: SUPABASE_URL hoặc SUPABASE_SERVICE_KEY chưa được cấu hình.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Nạp thông tin chi tiết từ RICH_MENU_ITEMS
const richMenuSeedPath = path.join(__dirname, 'seed_rich_menu.js');
let richMenuMap = {};

try {
    // Đọc mã nguồn seed_rich_menu để lấy metadata chi tiết nếu DB chưa có cột migration 27
    const seedContent = fs.readFileSync(richMenuSeedPath, 'utf8');
    const match = seedContent.match(/const RICH_MENU_ITEMS = (\[[\s\S]*?\]);\n\n\/\/ --- CORE SEEDING LOGIC ---/);
    if (match) {
        const items = eval(match[1]);
        items.forEach(it => {
            richMenuMap[it.name] = it;
        });
    }
} catch (e) {
    console.warn('⚠️ Không thể nạp tĩnh RICH_MENU_ITEMS, sẽ dùng dữ liệu thuần từ DB:', e.message);
}

function formatList(val, defaultStr) {
    if (!val) return defaultStr;
    if (Array.isArray(val)) {
        const filtered = val.map(v => String(v).trim()).filter(Boolean);
        return filtered.length > 0 ? filtered.join(', ') : defaultStr;
    }
    if (typeof val === 'string' && val.trim()) return val.trim();
    return String(val);
}

function formatPrice(price) {
    if (price === null || price === undefined) return 'Liên hệ';
    const num = Number(price);
    if (isNaN(num)) return `${price} VND`;
    return `${num.toLocaleString('vi-VN')} VND`;
}

function serializeRow(item, categoryName) {
    const name = item.name || 'Chưa rõ';
    const trendingStr = item.is_trending ? ' (Món thịnh hành ⭐)' : '';
    const cat = categoryName || 'Khác';
    const priceVnd = formatPrice(item.price);

    const spice = item.spice_level !== undefined && item.spice_level !== null ? `${item.spice_level}/5` : '0/5 (Không cay)';
    const calories = item.calories ? `${item.calories} kcal` : 'N/A';

    const ingredients = formatList(item.ingredients, 'Không ghi chú');
    const allergens = formatList(item.allergens, 'Không có dị ứng phổ biến');
    const dietaryTags = formatList(item.dietary_tags, 'Không có nhãn đặc biệt');

    const desc = (item.description || '').trim();
    const aiDesc = (item.ai_description || '').trim();
    const combinedDesc = `${desc} ${aiDesc}`.trim() || 'Đang cập nhật mô tả món ăn.';

    return `[MÓN ĂN: ${name}${trendingStr}]\n` +
           `• Phân loại: ${cat}\n` +
           `• Giá bán: ${priceVnd}\n` +
           `• Độ cay: ${spice}\n` +
           `• Lượng Calo: ${calories}\n` +
           `• Thành phần nguyên liệu: ${ingredients}\n` +
           `• Cảnh báo dị ứng: ${allergens}\n` +
           `• Nhãn chế độ ăn: ${dietaryTags}\n` +
           `• Mô tả hương vị: ${combinedDesc}`.trim();
}

async function main() {
    console.log('🚀 [START] BẮT ĐẦU ĐỒNG BỘ CORPUS CHO AI CONSULTANT...');

    // 1. Lấy toàn bộ categories
    const { data: categories, error: catErr } = await supabase.from('categories').select('id, name');
    if (catErr) throw catErr;
    const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

    // 2. Lấy toàn bộ menu_items
    const { data: menuItems, error: menuErr } = await supabase.from('menu_items').select('*').order('name');
    if (menuErr) throw menuErr;

    console.log(`📦 Đã lấy ${menuItems.length} món ăn từ cơ sở dữ liệu.`);

    const updatedCorpus = [];
    let dbUpdateSuccess = 0;

    for (const item of menuItems) {
        const catName = catMap[item.category_id] || 'Khác';
        const richMeta = richMenuMap[item.name] || {};

        // Merge dữ liệu giàu metadata (ưu tiên DB nếu có, fallback vào richMeta)
        const mergedItem = {
            ...item,
            ingredients: item.ingredients || richMeta.ingredients || null,
            allergens: item.allergens || richMeta.allergens || null,
            spice_level: item.spice_level !== undefined && item.spice_level !== null ? item.spice_level : (richMeta.spice_level ?? 0),
            calories: item.calories || richMeta.calories || null,
            ai_description: item.ai_description || richMeta.ai_description || null,
            is_trending: item.is_trending || richMeta.is_trending || false,
            dietary_tags: item.dietary_tags || richMeta.dietary_tags || null,
            category: { name: catName }
        };

        const serializedText = serializeRow(mergedItem, catName);
        mergedItem.row_serialized = serializedText;

        // Cập nhật lại row_serialized vào Supabase
        const { error: updErr } = await supabase.from('menu_items').update({ row_serialized: serializedText }).eq('id', item.id);
        if (!updErr) dbUpdateSuccess++;

        updatedCorpus.push(mergedItem);
    }

    console.log(`✅ Đã cập nhật ${dbUpdateSuccess}/${menuItems.length} chuỗi row_serialized lên Supabase.`);

    // 3. Ghi vào file serialized_menu_corpus.json
    const corpusPath = path.resolve(__dirname, '../../../ai-service/data/serialized_menu_corpus.json');
    fs.writeFileSync(corpusPath, JSON.stringify(updatedCorpus, null, 2), 'utf8');
    console.log(`💾 Đã xuất bản sao corpus đầy đủ vào: ${corpusPath}`);

    console.log('\n======================================================');
    console.log('🎉 [DONE] ĐỒNG BỘ CORPUS THỰC ĐƠN THÀNH CÔNG CHO AI ARIA!');
    console.log('======================================================');
}

main().catch(err => {
    console.error('❌ Lỗi:', err);
    process.exit(1);
});
