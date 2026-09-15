/**
 * seed_rich_menu.js
 * Script tạo dữ liệu thực đơn mở rộng (52 món ăn chất lượng cao)
 * Tích hợp ảnh CDN Unsplash HD, thông tin dinh dưỡng, dị ứng, độ cay, nhãn ăn kiêng
 * và ngữ cảnh mô tả tầng vị chuyên sâu phục vụ AI Consultant "Aria".
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Lỗi: SUPABASE_URL hoặc SUPABASE_SERVICE_KEY chưa được cấu hình trong backend/.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 1. DANH MỤC (CATEGORIES)
const CATEGORIES = [
    {
        name: 'Khai vị (Starters)',
        image_url: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=800&q=80',
        sort_order: 1
    },
    {
        name: 'Món chính (Main Dish)',
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        sort_order: 2
    },
    {
        name: 'Món chay & Healthy (Vegetarian)',
        image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
        sort_order: 3
    },
    {
        name: 'Đồ uống (Drinks)',
        image_url: 'https://images.unsplash.com/photo-1544145945-f904253db0ad?auto=format&fit=crop&w=800&q=80',
        sort_order: 4
    },
    {
        name: 'Tráng miệng (Desserts)',
        image_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',
        sort_order: 5
    },
    {
        name: 'Đặc biệt (Special)',
        image_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
        sort_order: 6
    }
];

// 2. NHÓM TÙY CHỌN (MODIFIERS)
const MODIFIER_GROUPS = [
    {
        name: 'Mức độ cay',
        min_selection: 1,
        max_selection: 1,
        modifiers: [
            { name: 'Không cay (Trẻ em/Dị ứng cay)', price_modifier: 0 },
            { name: 'Cay vừa (Tiêu chuẩn)', price_modifier: 0 },
            { name: 'Cay nhiều (Chuẩn vị)', price_modifier: 0 }
        ]
    },
    {
        name: 'Lượng đá',
        min_selection: 1,
        max_selection: 1,
        modifiers: [
            { name: 'Đá bình thường (100%)', price_modifier: 0 },
            { name: 'Ít đá (50%)', price_modifier: 0 },
            { name: 'Không đá (Uống lạnh nhẹ)', price_modifier: 0 }
        ]
    },
    {
        name: 'Lượng đường',
        min_selection: 1,
        max_selection: 1,
        modifiers: [
            { name: 'Đường bình thường (100%)', price_modifier: 0 },
            { name: 'Ít ngọt (50%)', price_modifier: 0 },
            { name: 'Không đường (Nguyên bản/Healthy)', price_modifier: 0 }
        ]
    },
    {
        name: 'Topping đồ uống',
        min_selection: 0,
        max_selection: 3,
        modifiers: [
            { name: 'Trân châu trắng giòn', price_modifier: 10000 },
            { name: 'Thạch củ năng hoa đậu biếc', price_modifier: 10000 },
            { name: 'Kem cheese Macchiato béo mặn', price_modifier: 15000 },
            { name: 'Hạt chia hữu cơ', price_modifier: 8000 }
        ]
    },
    {
        name: 'Món ăn kèm',
        min_selection: 0,
        max_selection: 2,
        modifiers: [
            { name: 'Thêm trứng ốp la lòng đào', price_modifier: 10000 },
            { name: 'Thêm chả trứng hấp nấm mèo', price_modifier: 15000 },
            { name: 'Thêm sườn nướng mật ong', price_modifier: 30000 },
            { name: 'Thêm chén bắp bò hoa', price_modifier: 35000 }
        ]
    }
];

// 3. DANH SÁCH 52 MÓN ĂN CHI TIẾT
const RICH_MENU_ITEMS = [
    // ==========================================
    // KHAI VỊ (STARTERS) - 8 MÓN
    // ==========================================
    {
        name: 'Gỏi cuốn Tôm Thịt Cố Đô',
        category: 'Khai vị (Starters)',
        price: 48000,
        description: 'Tôm sú tươi giòn, thịt ba chỉ heo thảo mộc, bún tươi và rau húng láng cuốn bánh tráng dẻo.',
        image_url: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=800&q=80'],
        prep_time: 10,
        spice_level: 0,
        calories: 220,
        ingredients: ['Tôm sú', 'Thịt ba chỉ heo', 'Bún tươi', 'Rau sống', 'Bánh tráng'],
        allergens: ['Hải sản'],
        dietary_tags: ['Thanh đạm', 'Ít béo', 'Gluten-Free'],
        ai_description: 'Món khai vị mát lành, vị tôm ngọt tự nhiên cuộn cùng rau thơm, chấm tương đậu phộng béo bùi chuẩn vị Nam Bộ.',
        is_trending: true,
        is_chef_recommendation: false
    },
    {
        name: 'Chả giò Hải sản Hoàng Kim',
        category: 'Khai vị (Starters)',
        price: 68000,
        description: 'Vỏ rế vàng ươm giòn rụm bọc nhân tôm, cua biển, nấm tuyết và sốt mayonnaise béo nhẹ.',
        image_url: 'https://images.unsplash.com/photo-1606471191009-63994c53433b?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1606471191009-63994c53433b?auto=format&fit=crop&w=800&q=80'],
        prep_time: 12,
        spice_level: 0,
        calories: 360,
        ingredients: ['Tôm sú', 'Thịt cua biển', 'Nấm tuyết', 'Bánh tráng rế', 'Trứng gà'],
        allergens: ['Hải sản', 'Trứng', 'Gluten'],
        dietary_tags: ['Chiên giòn', 'High-Protein'],
        ai_description: 'Giòn tan nơi đầu lưỡi, nhân hải sản tươi ngọt béo nhẹ, ăn kèm rau xà lách tươi và nước mắm chua ngọt dịu.',
        is_trending: true,
        is_chef_recommendation: true
    },
    {
        name: 'Súp Bắp Cua Tuyết Nhĩ',
        category: 'Khai vị (Starters)',
        price: 58000,
        description: 'Súp bắp Mỹ ngọt thanh nấu cùng thịt cua gỡ tươi nguyên thớ, nấm tuyết nhĩ và trứng cút bùi.',
        image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80'],
        prep_time: 8,
        spice_level: 0,
        calories: 195,
        ingredients: ['Thịt cua biển', 'Bắp ngọt Mỹ', 'Nấm tuyết nhĩ', 'Trứng cút', 'Nước hầm gà'],
        allergens: ['Hải sản', 'Trứng'],
        dietary_tags: ['Ấm bụng', 'Dễ tiêu hóa', 'Low-Fat'],
        ai_description: 'Nước súp sánh mịn óng ánh, thơm dịu ngậy ngọt vị cua tươi, làm ấm dạ dày lý tưởng trước bữa tiệc.',
        is_trending: false,
        is_chef_recommendation: false
    },
    {
        name: 'Salad Ức Gà Sốt Mè Rang (Healthy)',
        category: 'Khai vị (Starters)',
        price: 65000,
        description: 'Ức gà xé áp chảo mềm mọng, xà lách Frisee, cà chua bi, dưa leo Nhật và sốt mè rang bùi thơm.',
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'],
        prep_time: 10,
        spice_level: 0,
        calories: 275,
        ingredients: ['Ức gà thảo mộc', 'Xà lách Frisee', 'Cà chua bi', 'Dưa leo Nhật', 'Sốt mè rang'],
        allergens: ['Mè'],
        dietary_tags: ['Keto', 'High-Protein', 'Low-Carb', 'Healthy'],
        ai_description: 'Món ăn hoàn hảo cho gymer hoặc thực khách theo đuổi chế độ eat-clean, tươi mát giàu chất xơ và protein tinh khiết.',
        is_trending: true,
        is_chef_recommendation: false
    },
    {
        name: 'Khoai Tây Múi Cau Phô Mai Truffle',
        category: 'Khai vị (Starters)',
        price: 55000,
        description: 'Khoai tây Mỹ cắt múi cau chiên vàng ruộm, lắc phô mai Parmesan và thoảng dầu nấm Truffle đen quý tộc.',
        image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80'],
        prep_time: 10,
        spice_level: 0,
        calories: 340,
        ingredients: ['Khoai tây Mỹ', 'Bột phô mai Parmesan', 'Dầu nấm Truffle đen', 'Muối hồng Himalaya'],
        allergens: ['Sữa'],
        dietary_tags: ['Ăn vặt', 'Vegetarian'],
        ai_description: 'Lớp vỏ giòn xốp bên ngoài, ruột khoai bở bùi, dậy mùi thơm sang trọng quyến rũ của nấm Truffle.',
        is_trending: false,
        is_chef_recommendation: false
    },
    {
        name: 'Gỏi Ngó Sen Tôm Thịt Chua Cay',
        category: 'Khai vị (Starters)',
        price: 69000,
        description: 'Ngó sen tươi giòn sần sật ngâm chua ngọt, tôm luộc bóc nõn, tai heo giòn sần sật, rau răm và lạc rang.',
        image_url: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=800&q=80'],
        prep_time: 12,
        spice_level: 1,
        calories: 240,
        ingredients: ['Ngó sen', 'Tôm sú', 'Tai heo', 'Cà rốt', 'Đậu phộng', 'Rau răm'],
        allergens: ['Hải sản', 'Đậu phộng'],
        dietary_tags: ['Thanh nhiệt', 'Ít béo', 'Gluten-Free'],
        ai_description: 'Hòa quyện vị chua thanh, cay nhẹ, ngó sen giữ độ giòn tự nhiên và mùi thơm nồng nàn của rau răm.',
        is_trending: false,
        is_chef_recommendation: false
    },
    {
        name: 'Nem Lụi Nướng Than Hoa Phố Cổ',
        category: 'Khai vị (Starters)',
        price: 65000,
        description: 'Thịt heo quết dẻo nướng than hồng quanh củ sả thơm lừng, ăn kèm bánh hỏi lá dứa và chuối chát.',
        image_url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=80'],
        prep_time: 15,
        spice_level: 1,
        calories: 380,
        ingredients: ['Thịt nạc heo quết nhuyễn', 'Củ sả', 'Bánh hỏi', 'Khế chua', 'Chuối chát'],
        allergens: ['Đậu phộng'],
        dietary_tags: ['High-Protein', 'Đậm đà'],
        ai_description: 'Mùi khói nướng than hoa quyện sả tươi, chấm sốt tương gan đậu phộng gia truyền thơm bùi ngây ngất.',
        is_trending: false,
        is_chef_recommendation: true
    },
    {
        name: 'Salad Bơ Hạt Quinoa Sốt Chanh Dây',
        category: 'Khai vị (Starters)',
        price: 72000,
        description: 'Bơ sáp Đắk Lắk béo ngậy, hạt diêm mạch Quinoa giàu khoáng, xà lách lolo, dâu tây và sốt chanh leo tươi.',
        image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80'],
        prep_time: 8,
        spice_level: 0,
        calories: 230,
        ingredients: ['Bơ sáp', 'Hạt Quinoa', 'Xà lách Romaine', 'Dâu tây', 'Chanh dây'],
        allergens: [],
        dietary_tags: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Healthy', 'Superfood'],
        ai_description: 'Món khai vị thuần chay sang trọng, vị chua ngọt từ chanh dây đánh thức vị giác hoàn toàn tự nhiên.',
        is_trending: false,
        is_chef_recommendation: false
    },

    // ==========================================
    // MÓN CHÍNH (MAIN DISH) - 18 MÓN
    // ==========================================
    {
        name: 'Phở Bò Tái Nạm Đặc Biệt Hà Nội',
        category: 'Món chính (Main Dish)',
        price: 79000,
        description: 'Nước dùng ninh từ xương bò tủy suốt 18 tiếng, bánh phở mềm mượt, bắp bò hoa tái giòn và nạm bò chín mềm.',
        image_url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80'],
        prep_time: 8,
        spice_level: 0,
        calories: 490,
        ingredients: ['Bánh phở tươi', 'Bắp bò hoa', 'Nạm bò', 'Nước hầm xương ống bò', 'Gừng nướng', 'Hoa hồi', 'Quế chi'],
        allergens: [],
        dietary_tags: ['Gluten-Free', 'Món truyền thống', 'High-Protein', 'Ấm bụng'],
        ai_description: 'Nước lèo trong vắt nhưng vị ngọt sâu thấu từ xương tủy bò thảo mộc, thơm nức mùi hoa hồi và quế thanh lịch.',
        is_trending: true,
        is_chef_recommendation: true
    },
    {
        name: 'Bún Chả Hà Nội Nướng Than Hoa',
        category: 'Món chính (Main Dish)',
        price: 69000,
        description: 'Thịt ba chỉ thái mỏng ướp mắm tiêu và chả băm viên nướng trên vỉ than hồng, ăn cùng nước chấm ấm và bún tươi.',
        image_url: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=800&q=80'],
        prep_time: 12,
        spice_level: 1,
        calories: 580,
        ingredients: ['Thịt ba chỉ heo', 'Thịt nạc vai băm', 'Bún tươi', 'Đu đủ ngâm', 'Cà rốt', 'Rau kinh giới'],
        allergens: [],
        dietary_tags: ['Món truyền thống', 'High-Protein', 'Đậm đà'],
        ai_description: 'Vị ngọt thịt đậm đà vương mùi khói than nướng mộc mạc, nước chấm chua ngọt nóng hổi kích thích mọi giác quan.',
        is_trending: true,
        is_chef_recommendation: true
    },
    {
        name: 'Cơm Tấm Sườn Bì Chả Trứng Lòng Đào',
        category: 'Món chính (Main Dish)',
        price: 68000,
        description: 'Cơm tấm dẻo hạt, sườn cốt lết dày thịt ướp mật ong nướng than xém cạnh, bì thính vàng giòn và trứng ốp la.',
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'],
        prep_time: 10,
        spice_level: 0,
        calories: 720,
        ingredients: ['Gạo tấm thơm', 'Sườn heo cốt lết', 'Bì heo trộn thính', 'Chả trứng hấp', 'Trứng gà ốp la', 'Mỡ hành'],
        allergens: ['Trứng'],
        dietary_tags: ['High-Protein', 'No lâu', 'Món truyền thống'],
        ai_description: 'Biểu tượng ẩm thực Sài Gòn với miếng sườn ngấm gia vị đẫm sốt, hạt mỡ hành béo ngậy rưới nước mắm kẹo ớt tỏi.',
        is_trending: true,
        is_chef_recommendation: true
    },
    {
        name: 'Bún Bò Huế Cố Đô Cay Nồng',
        category: 'Món chính (Main Dish)',
        price: 75000,
        description: 'Bún sợi tròn to đặc trưng, bắp bò hoa giòn, giò heo mềm rục, chả cua Huế và nước dùng mắm ruốc sả ớt đỏ au.',
        image_url: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=800&q=80'],
        prep_time: 10,
        spice_level: 3,
        calories: 640,
        ingredients: ['Bún sợi to', 'Bắp bò', 'Giò heo', 'Chả cua', 'Huyết bò', 'Mắm ruốc Huế', 'Sả ớt'],
        allergens: ['Hải sản'],
        dietary_tags: ['Cay nồng', 'Đậm đà', 'Ấm bụng'],
        ai_description: 'Vị cay nồng ấm rực người, dậy mùi thơm mộc mạc của sả cây hòa quyện với mắm ruốc chưng truyền thống xứ Huế.',
        is_trending: true,
        is_chef_recommendation: false
    },
    {
        name: 'Mì Quảng Tôm Thịt Xứ Quảng',
        category: 'Món chính (Main Dish)',
        price: 65000,
        description: 'Sợi mì nghệ vàng óng, tôm sông rim mặn ngọt, thịt ba rọi ngấm vị, nước nhưn xâm xấp thơm dầu phụng và bánh tráng mè.',
        image_url: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?auto=format&fit=crop&w=800&q=80'],
        prep_time: 12,
        spice_level: 1,
        calories: 520,
        ingredients: ['Mì Quảng sợi vàng', 'Tôm sông', 'Thịt heo rim', 'Đậu phộng rang', 'Bánh tráng nướng mè', 'Rau búp chuối'],
        allergens: ['Hải sản', 'Đậu phộng', 'Gluten'],
        dietary_tags: ['Món truyền thống', 'Đậm vị miền Trung'],
        ai_description: 'Nước nhưn sánh đậm chan vừa chạm mặt mì, cắn miếng bánh tráng giòn tan cùng búp chuối thái mỏng tạo cảm giác cuốn hút.',
        is_trending: false,
        is_chef_recommendation: false
    },
    {
        name: 'Bò Lúc Lắc Khoai Tây Chiên Pháp',
        category: 'Món chính (Main Dish)',
        price: 119000,
        description: 'Thịt bò thăn mềm xắt quân cờ xào lửa lớn sốt tiêu đen bơ tỏi, ớt chuông ba màu và khoai tây chiên giòn.',
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'],
        prep_time: 15,
        spice_level: 1,
        calories: 610,
        ingredients: ['Thịt thăn bò Úc', 'Ớt chuông đỏ vàng xanh', 'Hành tây tím', 'Bơ lạt', 'Tỏi phi', 'Khoai tây'],
        allergens: ['Sữa'],
        dietary_tags: ['High-Protein', 'Món Âu-Á'],
        ai_description: 'Thịt bò xém cạnh ngoài nhưng bên trong mềm mọng nước, quyện sốt bơ tỏi đậm đà chấm muối tiêu chanh chuẩn vị.',
        is_trending: true,
        is_chef_recommendation: true
    },
    {
        name: 'Cơm Chiên Hải Sản Hoàng Kim',
        category: 'Món chính (Main Dish)',
        price: 78000,
        description: 'Cơm hạt tơi vàng bọc lòng đỏ trứng muối bùi béo, xào cùng tôm sú giòn ngọt, mực ống tươi và đậu Hà Lan.',
        image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80'],
        prep_time: 12,
        spice_level: 0,
        calories: 650,
        ingredients: ['Cơm nguội gạo thơm', 'Tôm sú bóc nõn', 'Mực ống', 'Lòng đỏ trứng muối', 'Đậu Hà Lan', 'Hành lá'],
        allergens: ['Hải sản', 'Trứng'],
        dietary_tags: ['High-Protein', 'Đậm đà', 'Béo ngậy'],
        ai_description: 'Hạt cơm xào săn tơi từng hạt, ánh màu vàng hoàng kim từ trứng muối thơm ngậy kết hợp vị ngọt tự nhiên của tôm mực.',
        is_trending: true,
        is_chef_recommendation: false
    },
    {
        name: 'Lẩu Thái Hải Sản Tom Yum Chua Cay',
        category: 'Món chính (Main Dish)',
        price: 185000,
        description: 'Nước lẩu Tom Yum đậm vị cốt dừa, lá chanh Kaffir, riềng non và sả cây, ngập tràn tôm sú, mực nang, ngao và nấm đùi gà.',
        image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80'],
        prep_time: 20,
        spice_level: 3,
        calories: 580,
        ingredients: ['Tôm sú', 'Mực nang', 'Ngao tươi', 'Nước cốt dừa', 'Lá chanh Thái', 'Nấm rơm', 'Sả ớt riềng'],
        allergens: ['Hải sản'],
        dietary_tags: ['Cay nồng', 'Món ăn gia đình', 'Gluten-Free'],
        ai_description: 'Sự bùng nổ của vị chua thanh chanh Thái, vị béo thơm cốt dừa và hậu vị cay ấm nồng, cực kỳ kích thích vị giác.',
        is_trending: true,
        is_chef_recommendation: true
    },
    {
        name: 'Cá Hồi Áp Chảo Sốt Bơ Chanh Măng Tây',
        category: 'Món chính (Main Dish)',
        price: 165000,
        description: 'Phi-lê cá hồi Na Uy tươi áp chảo vàng da giòn rụm thịt mềm hồng, phủ sốt bơ chanh vàng Dill thơm dịu và măng tây xào bơ.',
        image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80'],
        prep_time: 15,
        spice_level: 0,
        calories: 460,
        ingredients: ['Cá hồi tươi Na Uy', 'Măng tây xanh', 'Bơ lạt Anchor', 'Nước cốt chanh vàng', 'Lá thì là Dill'],
        allergens: ['Hải sản', 'Sữa'],
        dietary_tags: ['Keto', 'High-Protein', 'Low-Carb', 'Omega-3', 'Healthy'],
        ai_description: 'Đỉnh cao dinh dưỡng với nguồn Omega-3 dồi dào, thớ cá béo mềm tan trong miệng kết hợp vị chua dịu thanh tao của sốt bơ chanh.',
        is_trending: false,
        is_chef_recommendation: true
    },
    {
        name: 'Steak Thăn Lưng Bò Mỹ Sốt Tiêu Đen Phú Quốc',
        category: 'Món chính (Main Dish)',
        price: 195000,
        description: 'Thăn lưng bò Mỹ Ribeye nướng tái vừa (Medium Rare), vân mỡ xen kẽ mọng nước, dùng kèm khoai tây nghiền và sốt tiêu đen.',
        image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80'],
        prep_time: 18,
        spice_level: 1,
        calories: 680,
        ingredients: ['Thăn lưng bò Black Angus Mỹ', 'Tiêu sọ Phú Quốc', 'Khoai tây nghiền', 'Rượu vang đỏ', 'Bơ tỏi thảo mộc'],
        allergens: ['Sữa'],
        dietary_tags: ['High-Protein', 'Keto', 'Món Âu cao cấp'],
        ai_description: 'Thịt mềm ngọt thơm bơ, sốt tiêu đen sánh đậm cay nồng nhẹ ấm áp làm nổi bật trọn vẹn vị thịt bò hảo hạng.',
        is_trending: false,
        is_chef_recommendation: true
    },
    {
        name: 'Mì Ý Sốt Bò Băm Bolognese Truyền Thống',
        category: 'Món chính (Main Dish)',
        price: 85000,
        description: 'Sợi mì Spaghetti chuẩn Al Dente nấu cùng sốt cà chua thịt bò băm hầm kỹ với lá nguyệt quế và rắc phô mai Parmesan.',
        image_url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=800&q=80'],
        prep_time: 12,
        spice_level: 0,
        calories: 540,
        ingredients: ['Mì Ý Spaghetti Semolina', 'Thịt bò băm nhuyễn', 'Cà chua San Marzano', 'Phô mai Parmesan', 'Lá Oregano', 'Húng tây'],
        allergens: ['Gluten', 'Sữa'],
        dietary_tags: ['Món Âu', 'Thân thiện với trẻ nhỏ'],
        ai_description: 'Vị chua ngọt dịu êm của cà chua Ý ninh nhừ hòa cùng thịt bò ngọt bùi, món ăn thân thiện yêu thích của mọi trẻ em.',
        is_trending: false,
        is_chef_recommendation: false
    },
    {
        name: 'Gà Nướng Cơm Lam Bản Đôn Tây Bắc',
        category: 'Món chính (Main Dish)',
        price: 155000,
        description: 'Nửa con gà đồi thả vườn tẩm ướp mắc khén, hạt dổi nướng than giòn da thơm lừng, ăn kèm ống cơm lam nếp nương dẻo quánh.',
        image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80'],
        prep_time: 25,
        spice_level: 1,
        calories: 780,
        ingredients: ['Gà đồi thả vườn', 'Hạt mắc khén', 'Hạt dổi rừng', 'Gạo nếp nương', 'Ống tre nứa', 'Muối ớt lá é'],
        allergens: [],
        dietary_tags: ['Đặc sản Tây Bắc', 'High-Protein', 'Đậm đà'],
        ai_description: 'Thịt gà săn chắc giòn da tê nhẹ đầu lưỡi từ hạt mắc khén, chấm muối ớt lá é và cắn miếng cơm lam nướng thơm mùi tre xanh.',
        is_trending: true,
        is_chef_recommendation: true
    },
    {
        name: 'Hủ Tiếu Nam Vang Sườn Tôm Cật',
        category: 'Món chính (Main Dish)',
        price: 65000,
        description: 'Hủ tiếu dai mướt trần nước sôi, nước lèo ninh tôm khô mực khô trong vắt ngọt lịm, kèm sườn heo, tôm tươi, cật heo và thịt băm.',
        image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80'],
        prep_time: 10,
        spice_level: 0,
        calories: 510,
        ingredients: ['Sợi hủ tiếu dai Sa Đéc', 'Sườn non heo', 'Tôm sú', 'Cật heo thái khía', 'Mực khô', 'Tỏi phi thơm'],
        allergens: ['Hải sản'],
        dietary_tags: ['Thanh ngọt', 'Món truyền thống'],
        ai_description: 'Nước dùng trong veo ngọt hậu từ tôm mực sấy, thoang thoảng mùi tỏi phi giòn tan béo ngậy khó cưỡng.',
        is_trending: false,
        is_chef_recommendation: false
    },
    {
        name: 'Bún Riêu Cua Đồng Ốc Lụa Giòn Sần Sật',
        category: 'Món chính (Main Dish)',
        price: 65000,
        description: 'Cua đồng giã tay đóng tảng riêu béo ngậy, ốc bươu giòn sần sật, đậu hũ chiên phồng ngấm nước lèo chua thanh cà chua và giấm bỗng.',
        image_url: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?auto=format&fit=crop&w=800&q=80'],
        prep_time: 10,
        spice_level: 1,
        calories: 470,
        ingredients: ['Cua đồng tươi', 'Ốc bươu hấp lá gừng', 'Đậu hũ non chiên', 'Cà chua chín', 'Giấm bỗng nếp'],
        allergens: ['Hải sản'],
        dietary_tags: ['Chua thanh giải nhiệt', 'Dân dã'],
        ai_description: 'Vị chua thanh mát lành của giấm bỗng truyền thống cân bằng vị béo của riêu cua đồng, ăn kèm rau muống chẻ xanh mướt.',
        is_trending: false,
        is_chef_recommendation: false
    },
    {
        name: 'Bánh Mì Thập Cẩm Xá Xíu Ba Tê Trứ Danh',
        category: 'Món chính (Main Dish)',
        price: 35000,
        description: 'Vỏ bánh mì nướng giòn rụm bên ngoài ruột xốp, phết pate gan heo béo ngậy, thịt xá xíu mềm thơm, chả lụa và đồ chua.',
        image_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80'],
        prep_time: 5,
        spice_level: 1,
        calories: 420,
        ingredients: ['Bánh mì bột mì nướng giòn', 'Pate gan heo', 'Thịt xá xíu ngũ vị', 'Chả lụa', 'Dưa leo', 'Đồ chua', 'Ngò rí'],
        allergens: ['Gluten', 'Sữa'],
        dietary_tags: ['Ăn nhanh', 'Món biểu tượng đường phố'],
        ai_description: 'Sự kết hợp hoàn hảo giữa độ giòn xốp của bánh nướng mới, vị béo của pate gan và chút cay nồng của sốt ớt rim.',
        is_trending: true,
        is_chef_recommendation: false
    },
    {
        name: 'Cơm Gà Xối Mỡ Giòn Da Thượng Hạng',
        category: 'Món chính (Main Dish)',
        price: 65000,
        description: 'Đùi gà góc tư xối mỡ lớp da giòn rụm màu cánh gián nhưng thớ thịt bên trong mọng nước, hạt cơm nấu nước luộc gà óng vàng.',
        image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80'],
        prep_time: 12,
        spice_level: 0,
        calories: 710,
        ingredients: ['Đùi gà ta góc tư', 'Gạo dẻo nấu nước cốt gà', 'Bột nghệ vàng', 'Tỏi ớt băm', 'Dưa leo chua ngọt'],
        allergens: [],
        dietary_tags: ['High-Protein', 'Giòn rụm', 'No lâu'],
        ai_description: 'Cắn miếng da gà rôm rốp giòn tan, thịt ngọt thơm đậm vị ăn kèm cơm đỏ dẻo thơm và canh thanh mát giải ngấy.',
        is_trending: false,
        is_chef_recommendation: false
    },
    {
        name: 'Phở Gà Ta Lá Chanh Nước Dùng Thanh',
        category: 'Món chính (Main Dish)',
        price: 65000,
        description: 'Gà ta thả vườn thịt chắc da giòn vàng ươm, nước phở thanh ngọt thanh lịch, thoảng mùi lá chanh tươi thái chỉ.',
        image_url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80'],
        prep_time: 8,
        spice_level: 0,
        calories: 430,
        ingredients: ['Bánh phở tươi', 'Thịt gà ta luộc', 'Lá chanh non', 'Nước dùng gà hầm gừng nướng'],
        allergens: [],
        dietary_tags: ['Gluten-Free', 'Thanh đạm', 'Low-Fat', 'Dễ tiêu hóa'],
        ai_description: 'Lựa chọn nhẹ nhàng êm bụng, nước dùng trong vắt thanh khiết, thịt gà ta dai ngọt tự nhiên thơm ngát tinh dầu lá chanh.',
        is_trending: false,
        is_chef_recommendation: false
    },
    {
        name: 'Bò Sốt Tiêu Đen Bánh Mì Nóng Giòn',
        category: 'Món chính (Main Dish)',
        price: 89000,
        description: 'Bắp bò hầm mềm mọng trong nước sốt tiêu đen sánh đậm, thơm bơ tỏi, dùng kèm bánh mì đặc ruột nướng nóng giòn.',
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'],
        prep_time: 12,
        spice_level: 2,
        calories: 590,
        ingredients: ['Bắp bò hoa', 'Tiêu đen xay', 'Hành tây', 'Bánh mì nóng giòn', 'Bơ lạt'],
        allergens: ['Gluten', 'Sữa'],
        dietary_tags: ['Ấm bụng', 'Đậm đà', 'High-Protein'],
        ai_description: 'Nước sốt tiêu đen đặc sánh cay the ấm nồng xé bánh mì chấm ngập sốt, cực kỳ thích hợp cho những buổi tối mưa se lạnh.',
        is_trending: false,
        is_chef_recommendation: false
    },

    // ==========================================
    // MÓN CHAY & HEALTHY (VEGETARIAN) - 8 MÓN
    // ==========================================
    {
        name: 'Cơm Gạo Lứt Xào Nấm Đông Cô Hạt Sen',
        category: 'Món chay & Healthy (Vegetarian)',
        price: 58000,
        description: 'Gạo lứt tím than giàu chất xơ xào tơi cùng hạt sen Huế bùi ngọt, nấm đông cô tươi, nấm đùi gà và cà rốt bi.',
        image_url: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80'],
        prep_time: 12,
        spice_level: 0,
        calories: 360,
        ingredients: ['Gạo lứt tím than hữu cơ', 'Hạt sen tươi', 'Nấm đông cô', 'Nấm đùi gà', 'Dầu mè', 'Hạt nêm nấm'],
        allergens: ['Mè'],
        dietary_tags: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Healthy', 'Giảm cân'],
        ai_description: 'Món cơm dưỡng sinh giàu khoáng chất, vị bùi béo tự nhiên của hạt sen hòa cùng hương nấm xào thơm dịu.',
        is_trending: true,
        is_chef_recommendation: true
    },
    {
        name: 'Bún Nấm Thanh Đạm Rong Biển',
        category: 'Món chay & Healthy (Vegetarian)',
        price: 55000,
        description: 'Bún tươi chan nước dùng hầm củ quả lê táo ngọt thanh, các loại nấm rơm, nấm bào ngư, nấm kim châm và rong biển Wakame.',
        image_url: 'https://images.unsplash.com/photo-1546069901-d7373f156d9a?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1546069901-d7373f156d9a?auto=format&fit=crop&w=800&q=80'],
        prep_time: 10,
        spice_level: 0,
        calories: 310,
        ingredients: ['Bún tươi', 'Nấm bào ngư', 'Nấm kim châm', 'Rong biển Wakame', 'Bắp ngọt', 'Củ cải trắng'],
        allergens: [],
        dietary_tags: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Low-Calo', 'Thanh lọc cơ thể'],
        ai_description: 'Nước dùng trong veo ngọt lành tự nhiên từ củ quả, vị giòn dai sần sật của các loại nấm tươi mang lại cảm giác nhẹ nhõm an lành.',
        is_trending: false,
        is_chef_recommendation: false
    },
    {
        name: 'Đậu Hũ Sốt Tứ Xuyên Nấm Cay Chay',
        category: 'Món chay & Healthy (Vegetarian)',
        price: 52000,
        description: 'Đậu hũ non mềm mượt sốt cùng nấm đông cô băm nhỏ, ớt khô Tứ Xuyên và hoa tiêu tạo độ cay tê nhẹ đặc trưng.',
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'],
        prep_time: 10,
        spice_level: 3,
        calories: 280,
        ingredients: ['Đậu hũ non', 'Nấm đông cô khô băm', 'Ớt Tứ Xuyên', 'Hoa tiêu Tứ Xuyên', 'Tương ớt cay'],
        allergens: ['Đậu nành'],
        dietary_tags: ['Vegan', 'Vegetarian', 'Cay tê', 'High-Protein thực vật'],
        ai_description: 'Đậu hũ trơn mềm tan ngay trong miệng, quyện vị cay tê đậm đà của hoa tiêu, ăn cùng cơm nóng rất đưa cơm.',
        is_trending: true,
        is_chef_recommendation: false
    },
    {
        name: 'Nem Chay Rong Biển Chiên Xù',
        category: 'Món chay & Healthy (Vegetarian)',
        price: 58000,
        description: 'Lá rong biển cuộn nấm tuyết, đậu xanh đồ chín, cà rốt và khoai môn, lăn bột chiên xù vàng rụm.',
        image_url: 'https://images.unsplash.com/photo-1606471191009-63994c53433b?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1606471191009-63994c53433b?auto=format&fit=crop&w=800&q=80'],
        prep_time: 12,
        spice_level: 0,
        calories: 320,
        ingredients: ['Lá rong biển Gim', 'Đậu xanh', 'Khoai môn', 'Nấm mèo', 'Bột chiên xù'],
        allergens: ['Gluten'],
        dietary_tags: ['Vegan', 'Vegetarian', 'Giòn tan'],
        ai_description: 'Hương thơm đặc trưng của rong biển nướng quyện cùng vị bùi béo ngọt của khoai môn và nhân đậu xanh mịn.',
        is_trending: false,
        is_chef_recommendation: false
    },
    {
        name: 'Salad Rau Củ Nhiệt Đới Sốt Chanh Dây',
        category: 'Món chay & Healthy (Vegetarian)',
        price: 52000,
        description: 'Bông cải xanh, cà chua bi, dưa chuột baby, ngô ngọt và ớt chuông trộn sốt chanh leo tươi chua thanh dịu mát.',
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'],
        prep_time: 8,
        spice_level: 0,
        calories: 160,
        ingredients: ['Bông cải xanh', 'Cà chua bi', 'Dưa chuột baby', 'Ngô ngọt hữu cơ', 'Sốt chanh dây'],
        allergens: [],
        dietary_tags: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Low-Calo', 'Detox'],
        ai_description: 'Đĩa salad đầy màu sắc cầu vồng giòn tươi sần sật, ít calo, bổ sung vitamin tươi dồi dào cho làn da và cơ thể.',
        is_trending: false,
        is_chef_recommendation: false
    },
    {
        name: 'Nấm Bào Ngư Hấp Gừng Sả Dầu Mè',
        category: 'Món chay & Healthy (Vegetarian)',
        price: 59000,
        description: 'Nấm bào ngư trắng tươi dai ngọt hấp cách thủy với gừng non đập dập, sả cây và vài giọt dầu mè thơm ngát.',
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'],
        prep_time: 10,
        spice_level: 1,
        calories: 180,
        ingredients: ['Nấm bào ngư tươi', 'Gừng non', 'Sả cây', 'Dầu mè đen', 'Ớt sừng'],
        allergens: ['Mè'],
        dietary_tags: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Ấm bụng', 'Thanh đạm'],
        ai_description: 'Thịt nấm giữ nguyên độ mọng nước tự nhiên, vị the ấm nhẹ của gừng giải cảm và làm ấm cơ thể rất tốt.',
        is_trending: false,
        is_chef_recommendation: false
    },
    {
        name: 'Canh Hạt Sen Củ Sen Táo Đỏ Bổ Dưỡng',
        category: 'Món chay & Healthy (Vegetarian)',
        price: 49000,
        description: 'Hạt sen tươi hầm mềm bùi cùng củ sen giòn nhẹ, táo đỏ Tân Cương ngọt thơm và nấm tuyết trong vắt thanh tao.',
        image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80'],
        prep_time: 10,
        spice_level: 0,
        calories: 190,
        ingredients: ['Hạt sen tươi Huế', 'Củ sen thái lát', 'Táo đỏ khô', 'Kỷ tử', 'Nấm tuyết'],
        allergens: [],
        dietary_tags: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dưỡng nhan', 'Ngủ ngon'],
        ai_description: 'Món canh bồi bổ khí huyết giúp an thần ngủ sâu, vị ngọt thanh tự nhiên từ táo đỏ và hạt sen chín nhừ.',
        is_trending: false,
        is_chef_recommendation: true
    },
    {
        name: 'Đậu Hũ Chiên Sả Ớt Giòn Vỏ',
        category: 'Món chay & Healthy (Vegetarian)',
        price: 45000,
        description: 'Đậu hũ mơ chiên giòn vỏ bên ngoài, bên trong mềm béo như sữa đậu nành, phủ sả ớt phi vàng thơm rực rỡ.',
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'],
        prep_time: 8,
        spice_level: 2,
        calories: 290,
        ingredients: ['Đậu hũ mơ gia truyền', 'Sả băm nhuyễn', 'Ớt sừng băm', 'Muối tiêu'],
        allergens: ['Đậu nành'],
        dietary_tags: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dân dã'],
        ai_description: 'Món ăn dân dã giòn rụm bên ngoài nhưng bên trong mịn màng béo ngậy, sả chiên vàng thơm ngát kích thích vị giác.',
        is_trending: false,
        is_chef_recommendation: false
    },

    // ==========================================
    // ĐỒ UỐNG (DRINKS) - 10 MÓN
    // ==========================================
    {
        name: 'Cà Phê Sữa Đá Sài Gòn Truyền Thống',
        category: 'Đồ uống (Drinks)',
        price: 35000,
        description: 'Cà phê Robusta Buôn Ma Thuột rang mộc pha phin truyền thống nhỏ giọt, hòa quyện sữa đặc thơm ngọt và đá viên tinh khiết.',
        image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80'],
        prep_time: 5,
        spice_level: 0,
        calories: 165,
        ingredients: ['Hạt cà phê Robusta rang mộc', 'Sữa đặc có đường', 'Nước sôi', 'Đá viên'],
        allergens: ['Sữa'],
        dietary_tags: ['Tỉnh táo', 'Đồ uống quốc dân'],
        ai_description: 'Vị đắng đậm đà lưu luyến nơi hậu vị, quyện cùng độ ngọt béo mịn của sữa đặc tạo nên thức uống đánh thức năng lượng hoàn hảo.',
        is_trending: true,
        is_chef_recommendation: true
    },
    {
        name: 'Cà Phê Muối Cố Đô Béo Mặn',
        category: 'Đồ uống (Drinks)',
        price: 42000,
        description: 'Cốt cà phê phin đậm đặc kết hợp lớp kem sữa muối mặn mặn béo ngậy phía trên, khuấy đều tạo hương vị gây nghiện.',
        image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'],
        prep_time: 5,
        spice_level: 0,
        calories: 190,
        ingredients: ['Cà phê phin', 'Kem béo thực vật', 'Muối biển tinh khiết', 'Sữa đặc'],
        allergens: ['Sữa'],
        dietary_tags: ['Trending', 'Béo mặn độc đáo'],
        ai_description: 'Sự cân bằng tinh tế giữa đắng của cà phê, ngọt của sữa và chút mặn thanh của muối biển làm dịu vị gắt, cực kỳ mượt mà.',
        is_trending: true,
        is_chef_recommendation: true
    },
    {
        name: 'Trà Đào Cam Sả Tươi Mát Lạnh',
        category: 'Đồ uống (Drinks)',
        price: 45000,
        description: 'Trà đen Ceylon hảo hạng ủ lạnh, kết hợp miếng đào giòn ngâm, cam vàng Mỹ tươi mọng nước và tinh chất sả thanh khiết.',
        image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80'],
        prep_time: 5,
        spice_level: 0,
        calories: 145,
        ingredients: ['Cốt trà đen Ceylon', 'Đào miếng giòn ngâm', 'Cam vàng tươi', 'Sả cây tươi', 'Đường mía'],
        allergens: [],
        dietary_tags: ['Giải khát', 'Thanh nhiệt mùa hè', 'Vegan'],
        ai_description: 'Vị chua ngọt thanh mát bùng nổ, hương sả phảng phất thư giãn, xua tan ngay lập tức cái nóng bức mệt mỏi.',
        is_trending: true,
        is_chef_recommendation: false
    },
    {
        name: 'Trà Vải Hoa Hồng Hạt Chia Dưỡng Nhan',
        category: 'Đồ uống (Drinks)',
        price: 48000,
        description: 'Trà lài hoa nhài thoảng hương nụ hoa hồng khô, thịt vải thiều mọng nước giòn ngọt và hạt chia organic giàu chất xơ.',
        image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80'],
        prep_time: 5,
        spice_level: 0,
        calories: 135,
        ingredients: ['Trà hoa nhài', 'Nụ hoa hồng sấy khô', 'Vải thiều ngâm giòn', 'Hạt chia hữu cơ'],
        allergens: [],
        dietary_tags: ['Dưỡng nhan', 'Healthy', 'Superfood', 'Vegan'],
        ai_description: 'Hương hoa ngọt ngào lãng mạn, vị ngọt thanh tao của vải quyện hạt chia lách tách vui miệng, vừa đẹp da vừa giải nhiệt.',
        is_trending: false,
        is_chef_recommendation: false
    },
    {
        name: 'Nước Ép Cần Tây Táo Xanh Dứa Detox',
        category: 'Đồ uống (Drinks)',
        price: 49000,
        description: 'Cần tây Đà Lạt tươi ép lạnh nguyên chất cùng táo xanh giòn chua và dứa mật thơm, không thêm đường phụ gia.',
        image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80'],
        prep_time: 6,
        spice_level: 0,
        calories: 110,
        ingredients: ['Cần tây hữu cơ Đà Lạt', 'Táo xanh Granny Smith', 'Dứa mật chín cây'],
        allergens: [],
        dietary_tags: ['Keto', 'Vegan', 'Gluten-Free', 'Detox', 'Không đường', 'Low-Calo'],
        ai_description: 'Công thức detox lý tưởng giúp thanh lọc mỡ thừa, vị ngọt dịu của táo và dứa khử hoàn toàn mùi hăng của cần tây, cực kỳ dễ uống.',
        is_trending: true,
        is_chef_recommendation: true
    },
    {
        name: 'Nước Ép Dưa Hấu Bạc Hà Tươi',
        category: 'Đồ uống (Drinks)',
        price: 40000,
        description: 'Dưa hấu Long An chín đỏ mọng ép tươi nguyên chất 100%, dầm nhẹ vài lá bạc hà tươi sảng khoái.',
        image_url: 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=800&q=80'],
        prep_time: 5,
        spice_level: 0,
        calories: 95,
        ingredients: ['Dưa hấu không hạt ruột đỏ', 'Lá bạc hà tươi'],
        allergens: [],
        dietary_tags: ['Vegan', 'Gluten-Free', 'Low-Calo', 'Giải nhiệt'],
        ai_description: 'Vị ngọt mát tự nhiên của dưa hấu kết hợp cảm giác the mát bất tận của lá bạc hà, giải khát cực đỉnh.',
        is_trending: false,
        is_chef_recommendation: false
    },
    {
        name: 'Sinh Tố Bơ Sáp Dừa Béo Ngậy',
        category: 'Đồ uống (Drinks)',
        price: 55000,
        description: 'Bơ sáp Đắk Lắk dẻo quánh xay nhuyễn cùng sữa chua, nước cốt dừa Bến Tre thơm béo và sữa đặc.',
        image_url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80'],
        prep_time: 6,
        spice_level: 0,
        calories: 330,
        ingredients: ['Bơ sáp Đắk Lắk', 'Nước cốt dừa tươi', 'Sữa tươi thanh trùng', 'Sữa đặc'],
        allergens: ['Sữa'],
        dietary_tags: ['Béo ngậy', 'Giàu chất béo tốt'],
        ai_description: 'Chất sinh tố sánh đặc mịn như nhung, ngậy bùi vị bơ chín già và nức mùi dừa tươi, cung cấp nguồn chất béo lành mạnh.',
        is_trending: true,
        is_chef_recommendation: false
    },
    {
        name: 'Sinh Tố Mãng Cầu Xiêm Chua Ngọt',
        category: 'Đồ uống (Drinks)',
        price: 50000,
        description: 'Mãng cầu xiêm tươi tách hạt dầm sữa xay đá tuyết xốp mịn, vị chua ngọt cân bằng kích thích tiêu hóa.',
        image_url: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=800&q=80'],
        prep_time: 6,
        spice_level: 0,
        calories: 220,
        ingredients: ['Mãng cầu xiêm tươi', 'Sữa đặc', 'Sữa chua không đường', 'Đá tuyết'],
        allergens: ['Sữa'],
        dietary_tags: ['Chua ngọt', 'Giàu Vitamin C'],
        ai_description: 'Hương thơm đặc trưng của trái mãng cầu, vị chua nhẹ thanh thoát hòa lẫn độ ngọt vừa phải xua tan cảm giác ngấy sau bữa ăn.',
        is_trending: false,
        is_chef_recommendation: false
    },
    {
        name: 'Cà Phê Đen Đá Buôn Ma Thuột',
        category: 'Đồ uống (Drinks)',
        price: 29000,
        description: '100% cà phê Robusta hảo hạng pha phin truyền thống, thơm đượm nồng nàn không pha tạp, vị đắng mộc mạc nguyên bản.',
        image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'],
        prep_time: 4,
        spice_level: 0,
        calories: 15,
        ingredients: ['Cà phê Robusta nguyên chất', 'Đá viên'],
        allergens: [],
        dietary_tags: ['Keto', 'Vegan', 'Không đường', 'Tỉnh táo', 'Zero-Calo'],
        ai_description: 'Đậm đặc sánh đen huyền bí, hương thơm nồng nàn lưu luyến, dành cho những ai mê vị đắng mộc tinh tế của cà phê Việt.',
        is_trending: false,
        is_chef_recommendation: false
    },
    {
        name: 'Bạc Xỉu Ba Tầng Sài Gòn Xưa',
        category: 'Đồ uống (Drinks)',
        price: 38000,
        description: 'Tầng sữa đặc ngọt ngào ở đáy, lớp sữa tươi béo mịn ở giữa và phủ lớp cà phê phin đánh bọt nâu bồng bềnh bên trên.',
        image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80'],
        prep_time: 5,
        spice_level: 0,
        calories: 180,
        ingredients: ['Sữa tươi thanh trùng', 'Sữa đặc', 'Cà phê phin'],
        allergens: ['Sữa'],
        dietary_tags: ['Ngọt ngào', 'Nhẹ nhàng'],
        ai_description: 'Lượng cà phê chỉ vừa đủ thoảng hương, phù hợp với phái đẹp hoặc những ai không quen uống cà phê đắng gắt.',
        is_trending: false,
        is_chef_recommendation: false
    },

    // ==========================================
    // TRÁNG MIỆNG (DESSERTS) - 6 MÓN
    // ==========================================
    {
        name: 'Panna Cotta Dâu Tây Đà Lạt Mềm Tan',
        category: 'Tráng miệng (Desserts)',
        price: 45000,
        description: 'Kem sữa nấu vani Madagascar núng nính mềm mịn tan ngay trên đầu lưỡi, phủ sốt dâu tây tươi chua ngọt rạng rỡ.',
        image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80'],
        prep_time: 5,
        spice_level: 0,
        calories: 210,
        ingredients: ['Kem whipping cream Anchor', 'Sữa tươi', 'Dâu tây Đà Lạt tươi', 'Vani Madagascar', 'Gelatin'],
        allergens: ['Sữa'],
        dietary_tags: ['Món Âu', 'Ngọt thanh', 'Tráng miệng'],
        ai_description: 'Kết cấu núng nính mượt mà, vị béo ngậy của kem sữa hòa hảo hoàn hảo với vị chua thanh rực rỡ của dâu tây tươi.',
        is_trending: true,
        is_chef_recommendation: true
    },
    {
        name: 'Bánh Flan Caramel Hạt Cafe Truyền Thống',
        category: 'Tráng miệng (Desserts)',
        price: 32000,
        description: 'Bánh flan mềm mượt không rỗ mặt làm từ trứng gà ta tươi và sữa đặc, chan sốt caramel đường thốt nốt và chút cốt cà phê đắng nhẹ.',
        image_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80'],
        prep_time: 4,
        spice_level: 0,
        calories: 185,
        ingredients: ['Lòng đỏ trứng gà ta', 'Sữa đặc', 'Sữa tươi', 'Đường caramel', 'Cốt cà phê phin'],
        allergens: ['Trứng', 'Sữa'],
        dietary_tags: ['Tráng miệng', 'Dễ ăn'],
        ai_description: 'Vị béo ngậy ngọt ngào của trứng sữa được cân bằng hoàn hảo nhờ vị đắng nhẹ thơm lừng của cà phê và caramel hổ phách.',
        is_trending: true,
        is_chef_recommendation: false
    },
    {
        name: 'Chè Khúc Bạch Hạnh Nhân Thanh Mát',
        category: 'Tráng miệng (Desserts)',
        price: 45000,
        description: 'Những viên khúc bạch phô mai sữa dẻo dai béo ngậy, quả vải thiều mọng nước, chan nước đường phèn hoa nhài và hạnh nhân lát rang vàng.',
        image_url: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80'],
        prep_time: 5,
        spice_level: 0,
        calories: 240,
        ingredients: ['Sữa tươi', 'Whipping cream', 'Phô mai tươi', 'Vải thiều', 'Hạnh nhân lát', 'Nước đường phèn lá dứa'],
        allergens: ['Sữa', 'Hạt hạnh nhân'],
        dietary_tags: ['Thanh nhiệt', 'Tráng miệng giải nhiệt'],
        ai_description: 'Nước chè trong vắt thơm hương hoa nhài nhẹ nhàng, viên khúc bạch béo ngậy sực sực kết hợp hạnh nhân lát bùi rụm khó quên.',
        is_trending: true,
        is_chef_recommendation: true
    },
    {
        name: 'Kem Xôi Dừa Thái Lan Thơm Bùi',
        category: 'Tráng miệng (Desserts)',
        price: 49000,
        description: 'Viên kem dừa non mát lạnh phục vụ trong gáo dừa tươi, lót xôi nếp lá dứa dẻo thơm, rắc dừa nạo và đậu phộng rang giòn.',
        image_url: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=800&q=80'],
        prep_time: 6,
        spice_level: 0,
        calories: 320,
        ingredients: ['Kem dừa nguyên chất', 'Gạo nếp nương lá dứa', 'Cơm dừa non thái sợi', 'Đậu phộng rang', 'Bắp hạt'],
        allergens: ['Đậu phộng', 'Sữa'],
        dietary_tags: ['Đặc sản', 'Ngọt ngào'],
        ai_description: 'Sự hòa quyện tuyệt đỉnh giữa cái mát lạnh tê lưỡi của kem dừa và độ dẻo ấm mềm của xôi nếp thơm mùi lá dứa.',
        is_trending: false,
        is_chef_recommendation: false
    },
    {
        name: 'Bánh Mousse Chanh Dây Phủ Gương Vàng',
        category: 'Tráng miệng (Desserts)',
        price: 48000,
        description: 'Đế bánh bông lan xốp nhẹ, lớp kem mousse phô mai mịn mượt phủ thạch chanh leo tráng gương chua dịu lấp lánh.',
        image_url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80'],
        prep_time: 5,
        spice_level: 0,
        calories: 235,
        ingredients: ['Cream cheese', 'Whipping cream', 'Nước cốt chanh dây tươi', 'Bột mì', 'Trứng gà', 'Bơ lạt'],
        allergens: ['Gluten', 'Sữa', 'Trứng'],
        dietary_tags: ['Bánh Âu', 'Chua ngọt thanh tao'],
        ai_description: 'Vị chua rực rỡ đặc trưng của chanh dây làm bừng tỉnh vị giác, lớp kem mousse bông mịn xốp tan ngay nơi đầu lưỡi.',
        is_trending: false,
        is_chef_recommendation: false
    },
    {
        name: 'Chè Thái Trái Cây Sầu Riêng Sốt Dừa',
        category: 'Tráng miệng (Desserts)',
        price: 42000,
        description: 'Mít chín thái sợi, thạch dừa giòn sần sật, hạt đác rim đường, nhãn xuồng và cơm sầu riêng Ri6 thơm lừng chan cốt dừa béo.',
        image_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80'],
        prep_time: 5,
        spice_level: 0,
        calories: 290,
        ingredients: ['Thịt sầu riêng Ri6', 'Mít nghệ', 'Thạch củ năng', 'Hạt đác rim', 'Nước cốt dừa tươi'],
        allergens: ['Sữa'],
        dietary_tags: ['Đặc sản', 'Trái cây nhiệt đới'],
        ai_description: 'Hương sầu riêng ngào ngạt lan tỏa, vị ngọt đậm đà phong phú của các loại quả nhiệt đới quyện trong làn cốt dừa béo ngậy.',
        is_trending: false,
        is_chef_recommendation: false
    },

    // ==========================================
    // ĐẶC BIỆT (SPECIAL) - 2 MÓN ĐẠI TIỆC
    // ==========================================
    {
        name: 'Lẩu Thả Phan Thiết Cung Đình',
        category: 'Đặc biệt (Special)',
        price: 365000,
        description: 'Mâm tiệc hải sản bày trên cánh hoa chuối đỏ rực: cá mai tươi chần tái mè, thịt ba chỉ luộc, trứng chiên sợi, bánh tráng nướng và nước lèo tôm thịt đậm đà.',
        image_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80'],
        prep_time: 25,
        spice_level: 1,
        calories: 850,
        ingredients: ['Cá mai phi lê', 'Thịt ba chỉ luộc', 'Trứng gà sợi', 'Hoa chuối đỏ', 'Nước hầm tôm tươi', 'Đậu phộng rang', 'Bánh tráng nướng'],
        allergens: ['Hải sản', 'Đậu phộng', 'Trứng'],
        dietary_tags: ['Món tiệc cao cấp', 'Món ăn gia đình', 'Đặc sản biển'],
        ai_description: 'Một bản hòa tấu màu sắc và hương vị tinh hoa biển cả Phan Thiết, chan nước lèo nóng hổi dậy mùi đậu phộng thơm béo.',
        is_trending: true,
        is_chef_recommendation: true
    },
    {
        name: 'Gà Hấp Lá Sen Xôi Hạt Sen Đại Bổ',
        category: 'Đặc biệt (Special)',
        price: 295000,
        description: 'Nguyên con gà ta hấp cách thủy trong bọc lá sen tươi cùng nấm đông cô, kỷ tử, táo đỏ và xôi hạt sen dẻo thơm ngấm trọn nước cốt gà.',
        image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80'],
        prep_time: 30,
        spice_level: 0,
        calories: 920,
        ingredients: ['Gà ta nguyên con', 'Lá sen tươi', 'Hạt sen Huế', 'Nếp cái hoa vàng', 'Kỷ tử', 'Nấm đông cô'],
        allergens: [],
        dietary_tags: ['Món tiệc sang trọng', 'Bổ dưỡng dưỡng sinh', 'High-Protein'],
        ai_description: 'Mở gói lá sen là hương thơm thanh khiết ùa ra ngào ngạt, thịt gà mềm ngọt lịm ngấm đều vào từng hạt xôi nếp dẻo thơm.',
        is_trending: false,
        is_chef_recommendation: true
    }
];

// --- CORE SEEDING LOGIC ---

async function checkColumnsSupport() {
    const { error } = await supabase.from('menu_items').select('ingredients').limit(1);
    if (error && error.message.includes('column menu_items.ingredients does not exist')) {
        return false;
    }
    return true;
}

async function runSeed() {
    console.log('🚀 [START] BẮT ĐẦU SEED BỘ THỰC ĐƠN 52 MÓN ĂN CHẤT LƯỢNG CAO...');

    const hasRichColumns = await checkColumnsSupport();
    if (!hasRichColumns) {
        console.warn('\n⚠️ CẢNH BÁO QUAN TRỌNG:');
        console.warn('Cơ sở dữ liệu Supabase của bạn CHƯA chạy Migration 27 (thiếu cột ingredients, allergens, calories, spice_level, ai_description).');
        console.warn('👉 Hãy mở Supabase Dashboard -> SQL Editor và chạy câu lệnh sau:');
        console.warn(`
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS ingredients    TEXT[]    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS allergens      TEXT[]    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS spice_level    INTEGER   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS calories       INTEGER   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_description TEXT      DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_trending    BOOLEAN   DEFAULT FALSE;
        `);
    } else {
        console.log('✅ Xác nhận: Các cột AI chuyên sâu (Migration 27) đã sẵn sàng trong cơ sở dữ liệu!');
    }

    // 1. Seed Categories (Dùng Upsert theo name)
    console.log('📦 1. Đang đồng bộ danh mục món ăn (Categories)...');
    for (const cat of CATEGORIES) {
        const { data: existing } = await supabase.from('categories').select('id').eq('name', cat.name).maybeSingle();
        if (existing) {
            await supabase.from('categories').update({ image_url: cat.image_url, sort_order: cat.sort_order }).eq('id', existing.id);
        } else {
            await supabase.from('categories').insert([cat]);
        }
    }
    const { data: allCategories } = await supabase.from('categories').select('id, name');
    const catMap = Object.fromEntries(allCategories.map(c => [c.name, c.id]));
    console.log(`✅ Hoàn tất danh mục: Có ${allCategories.length} danh mục khả dụng.`);

    // 2. Modifiers
    console.log('🎛️  2. Đồng bộ các nhóm tuỳ chọn (Modifiers)...');
    const modifierGroupMap = {};
    for (const group of MODIFIER_GROUPS) {
        let groupId;
        const { data: existingGroup } = await supabase.from('modifier_groups').select('id').eq('name', group.name).maybeSingle();
        if (existingGroup) {
            groupId = existingGroup.id;
        } else {
            const { data: newGroup, error: grpErr } = await supabase.from('modifier_groups').insert({
                name: group.name,
                min_selection: group.min_selection,
                max_selection: group.max_selection
            }).select().single();
            if (grpErr) throw grpErr;
            groupId = newGroup.id;
        }

        // Modifiers bên trong
        for (const m of group.modifiers) {
            const { data: existingMod } = await supabase.from('modifiers').select('id').eq('name', m.name).eq('group_id', groupId).maybeSingle();
            if (!existingMod) {
                await supabase.from('modifiers').insert({ ...m, group_id: groupId });
            }
        }
        modifierGroupMap[group.name] = groupId;
    }
    console.log('✅ Hoàn tất đồng bộ các nhóm Modifier.');

    // 3. Xử lý menu_items
    console.log(`🍲 3. Đang nạp danh sách ${RICH_MENU_ITEMS.length} món ăn chi tiết...`);

    let insertedCount = 0;
    let updatedCount = 0;
    const seededItemIds = [];

    for (const item of RICH_MENU_ITEMS) {
        const categoryId = catMap[item.category];
        if (!categoryId) {
            console.warn(`⚠️ Bỏ qua món "${item.name}" vì không tìm thấy category "${item.category}"`);
            continue;
        }

        // Chuẩn bị payload
        const basePayload = {
            name: item.name,
            category_id: categoryId,
            price: item.price,
            description: item.description,
            image_url: item.image_url,
            images: item.images,
            prep_time: item.prep_time,
            dietary_tags: item.dietary_tags,
            is_available: true,
            status: 'available',
            is_chef_recommendation: item.is_chef_recommendation
        };

        const fullPayload = hasRichColumns ? {
            ...basePayload,
            ingredients: item.ingredients,
            allergens: item.allergens,
            spice_level: item.spice_level,
            calories: item.calories,
            ai_description: item.ai_description,
            is_trending: item.is_trending
        } : basePayload;

        // Kiểm tra xem món này đã có chưa
        const { data: existingItem } = await supabase.from('menu_items').select('id').eq('name', item.name).maybeSingle();

        if (existingItem) {
            await supabase.from('menu_items').update(fullPayload).eq('id', existingItem.id);
            updatedCount++;
            seededItemIds.push({ id: existingItem.id, category: item.category, name: item.name });
        } else {
            const { data: newItem, error: insErr } = await supabase.from('menu_items').insert([fullPayload]).select('id').single();
            if (insErr) {
                console.error(`❌ Lỗi thêm món "${item.name}":`, insErr.message);
            } else {
                insertedCount++;
                seededItemIds.push({ id: newItem.id, category: item.category, name: item.name });
            }
        }
    }

    console.log(`✅ Kết quả thêm món ăn: Thêm mới ${insertedCount} món, Cập nhật ${updatedCount} món.`);

    // 4. Liên kết Modifiers với Menu Items
    console.log('🔗 4. Liên kết các tùy chọn phù hợp cho từng món ăn...');
    for (const item of seededItemIds) {
        const linksToInsert = [];
        if (item.category.includes('Drinks')) {
            if (modifierGroupMap['Lượng đá']) linksToInsert.push({ menu_item_id: item.id, modifier_group_id: modifierGroupMap['Lượng đá'] });
            if (modifierGroupMap['Lượng đường']) linksToInsert.push({ menu_item_id: item.id, modifier_group_id: modifierGroupMap['Lượng đường'] });
            if (modifierGroupMap['Topping đồ uống']) linksToInsert.push({ menu_item_id: item.id, modifier_group_id: modifierGroupMap['Topping đồ uống'] });
        } else if (item.category.includes('Main Dish') || item.category.includes('Special')) {
            if (modifierGroupMap['Mức độ cay']) linksToInsert.push({ menu_item_id: item.id, modifier_group_id: modifierGroupMap['Mức độ cay'] });
            if (item.name.includes('Cơm') && modifierGroupMap['Món ăn kèm']) {
                linksToInsert.push({ menu_item_id: item.id, modifier_group_id: modifierGroupMap['Món ăn kèm'] });
            }
        }

        for (const link of linksToInsert) {
            const { data: existingLink } = await supabase
                .from('menu_item_modifier_groups')
                .select('menu_item_id')
                .eq('menu_item_id', link.menu_item_id)
                .eq('modifier_group_id', link.modifier_group_id)
                .maybeSingle();

            if (!existingLink) {
                await supabase.from('menu_item_modifier_groups').insert(link);
            }
        }
    }
    console.log('✅ Đã hoàn tất liên kết tùy chọn cho món ăn.');

    console.log('\n======================================================');
    console.log(`🎉 [SUCCESS] ĐÃ SEED THÀNH CÔNG ${seededItemIds.length} MÓN ĂN VÀO HỆ THỐNG!`);
    console.log('======================================================');
}

runSeed().catch(err => {
    console.error('❌ Lỗi Seeding nghiêm trọng:', err);
    process.exit(1);
});
