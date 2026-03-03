const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- SEED DATA DEFINITIONS ---

const CATEGORIES = [
    { name: 'Khai vị (Starters)', image_url: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=800&q=80', sort_order: 1 },
    { name: 'Món chính (Main Dish)', image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', sort_order: 2 },
    { name: 'Đồ uống (Drinks)', image_url: 'https://images.unsplash.com/photo-1544145945-f904253db0ad?auto=format&fit=crop&w=800&q=80', sort_order: 3 },
    { name: 'Tráng miệng (Desserts)', image_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80', sort_order: 4 },
    { name: 'Đặc biệt (Special)', image_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80', sort_order: 5 }
];

const MENU_ITEMS = [
    // Starters
    { name: 'Gỏi cuốn Tôm Thịt', category: 'Khai vị (Starters)', price: 45000, description: 'Tôm tươi, thịt luộc, bún và rau sống cuốn trong bánh tráng.' },
    { name: 'Chả giò Hải sản', category: 'Khai vị (Starters)', price: 65000, description: 'Chả giò chiên giòn với nhân hải sản, nấm mèo và cà rốt.' },
    { name: 'Súp Bắp Cua', category: 'Khai vị (Starters)', price: 55000, description: 'Súp sệt với thịt cua tươi, bắp hạt và trứng cút.' },

    // Main Dish
    { name: 'Phở Bò Tái Nạm', category: 'Món chính (Main Dish)', price: 75000, description: 'Phở bò truyền thống với thịt bò tái và nạm.' },
    { name: 'Bún Chả Hà Nội', category: 'Món chính (Main Dish)', price: 65000, description: 'Thịt nướng và chả viên nướng than hồng.' },
    { name: 'Cơm Tấm Sườn Bì Chả', category: 'Món chính (Main Dish)', price: 60000, description: 'Cơm tấm dẻo, sườn nướng mật ong, bì thính, chả trứng.' },
    { name: 'Bún Bò Huế', category: 'Món chính (Main Dish)', price: 70000, description: 'Bún bò cay nồng đặc trưng Huế với bắp bò, giò heo.' },
    { name: 'Mì Quảng Tôm Thịt', category: 'Món chính (Main Dish)', price: 65000, description: 'Mì Quảng sợi vàng, tôm tươi, thịt heo rim.' },

    // Drinks
    { name: 'Cà phê Sữa Đá', category: 'Đồ uống (Drinks)', price: 35000, description: 'Cà phê pha phin truyền thống hòa quyện cùng sữa đặc.' },
    { name: 'Trà Đào Cam Sả', category: 'Đồ uống (Drinks)', price: 45000, description: 'Trà đen hương đào, kết hợp cùng cam tươi và sả cây.' },
    { name: 'Nước Ép Dưa Hấu', category: 'Đồ uống (Drinks)', price: 40000, description: 'Dưa hấu tươi ép nguyên chất.' },
    { name: 'Sinh Tố Bơ', category: 'Đồ uống (Drinks)', price: 55000, description: 'Bơ sáp xay nhuyễn cùng sữa đặc và sữa tươi.' },

    // Desserts
    { name: 'Chè Thái', category: 'Tráng miệng (Desserts)', price: 35000, description: 'Các loại trái cây, thạch và nước cốt dừa thơm béo.' },
    { name: 'Bánh Flan', category: 'Tráng miệng (Desserts)', price: 25000, description: 'Bánh flan mềm mịn, thơm mùi trứng và caramel.' },
    { name: 'Kem Trái Dừa', category: 'Tráng miệng (Desserts)', price: 45000, description: 'Kem dừa mát lạnh phục vụ trong trái dừa tươi.' },

    // Special
    { name: 'Lẩu Thả Phan Thiết', category: 'Đặc biệt (Special)', price: 350000, description: 'Lẩu đặc sản với nhiều loại nguyên liệu bày trí đẹp mắt.' },
    { name: 'Gà Nướng Cơm Lam', category: 'Đặc biệt (Special)', price: 280000, description: 'Gà đồi nướng mọi vàng giòn, ăn kèm cơm lam.' }
];

const TABLES = Array.from({ length: 15 }, (_, i) => ({
    table_number: `${String.fromCharCode(65 + Math.floor(i / 5))}${(i % 5) + 1}`,
    capacity: i < 10 ? 4 : (i < 13 ? 6 : 10)
}));

const MODIFIER_GROUPS = [
    {
        name: 'Mức độ cay', min_selection: 1, max_selection: 1, modifiers: [
            { name: 'Không cay', price_modifier: 0 },
            { name: 'Cay vừa', price_modifier: 0 },
            { name: 'Cay nhiều', price_modifier: 0 }
        ]
    },
    {
        name: 'Lượng đá', min_selection: 1, max_selection: 1, modifiers: [
            { name: 'Đá bình thường', price_modifier: 0 },
            { name: 'Ít đá', price_modifier: 0 },
            { name: 'Không đá', price_modifier: 0 }
        ]
    },
    {
        name: 'Lượng đường', min_selection: 1, max_selection: 1, modifiers: [
            { name: 'Đường bình thường', price_modifier: 0 },
            { name: 'Ít đường (50%)', price_modifier: 0 },
            { name: 'Rất ít đường (30%)', price_modifier: 0 },
            { name: 'Không đường', price_modifier: 0 }
        ]
    },
    {
        name: 'Thêm Topping', min_selection: 0, max_selection: 3, modifiers: [
            { name: 'Trân châu trắng', price_modifier: 10000 },
            { name: 'Thạch trái cây', price_modifier: 8000 },
            { name: 'Kem cheese', price_modifier: 15000 }
        ]
    },
    {
        name: 'Thêm món ăn kèm', min_selection: 0, max_selection: 2, modifiers: [
            { name: 'Thêm trứng ốp la', price_modifier: 10000 },
            { name: 'Thêm chả', price_modifier: 15000 },
            { name: 'Thêm sườn', price_modifier: 25000 }
        ]
    }
];

// --- UTILS ---
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function isTableBusy(tableHistory, newTime) {
    if (!tableHistory || tableHistory.length === 0) return false;
    const THIRTY_MINUTES = 30 * 60 * 1000;
    return tableHistory.some(existingTime => {
        const diff = Math.abs(existingTime - newTime.getTime());
        return diff < THIRTY_MINUTES;
    });
}

// --- CORE FUNCTIONS ---

async function cleanup() {
    console.log('🗑️  BẮT ĐẦU DỌN DẸP DỮ LIỆU...');
    try {
        await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('order_item_modifiers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        await supabase.from('menu_item_modifier_groups').delete().neq('modifier_group_id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('modifiers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('modifier_groups').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('tables').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        console.log('✨ Database đã được xóa sạch.');
    } catch (error) {
        console.error('❌ Lỗi dọn dẹp:', error.message);
    }
}

async function seed() {
    console.log('🌱 BẮT ĐẦU SEEDING DỮ LIỆU...');

    // 1. Categories
    console.log('  - Seeding categories...');
    const { data: seededCats, error: catError } = await supabase.from('categories').insert(CATEGORIES).select();
    if (catError) throw catError;
    const catMap = Object.fromEntries(seededCats.map(c => [c.name, c.id]));

    // 2. Modifiers
    console.log('  - Seeding modifier groups and modifiers...');
    const modifierGroupMap = {}; // name -> { id, modifiers: [] }
    for (const group of MODIFIER_GROUPS) {
        const { data: mgData, error: mgError } = await supabase.from('modifier_groups').insert({
            name: group.name,
            min_selection: group.min_selection,
            max_selection: group.max_selection
        }).select().single();
        if (mgError) throw mgError;

        const modsToInsert = group.modifiers.map(m => ({ ...m, group_id: mgData.id }));
        const { data: modsData, error: mError } = await supabase.from('modifiers').insert(modsToInsert).select();
        if (mError) throw mError;

        modifierGroupMap[group.name] = { id: mgData.id, modifiers: modsData };
    }

    // 3. Menu Items
    console.log('  - Seeding menu items and links to modifiers...');
    const menuItemsToInsert = MENU_ITEMS.map(item => ({
        name: item.name,
        category_id: catMap[item.category],
        price: item.price,
        description: item.description,
        status: 'available',
        is_available: true
    }));
    const { data: seededMenuItems, error: menuError } = await supabase.from('menu_items').insert(menuItemsToInsert).select();
    if (menuError) throw menuError;

    // Link Modifiers to Menu Items
    const itemModifierLinks = [];
    for (const item of seededMenuItems) {
        const catName = Object.keys(catMap).find(key => catMap[key] === item.category_id);

        if (catName === 'Drinks' || catName === 'Đồ uống (Drinks)') {
            itemModifierLinks.push({ menu_item_id: item.id, modifier_group_id: modifierGroupMap['Lượng đá'].id });
            itemModifierLinks.push({ menu_item_id: item.id, modifier_group_id: modifierGroupMap['Lượng đường'].id });
            itemModifierLinks.push({ menu_item_id: item.id, modifier_group_id: modifierGroupMap['Thêm Topping'].id });
        } else if (catName === 'Main Dish' || catName === 'Món chính (Main Dish)') {
            itemModifierLinks.push({ menu_item_id: item.id, modifier_group_id: modifierGroupMap['Mức độ cay'].id });
            if (item.name.includes('Cơm')) {
                itemModifierLinks.push({ menu_item_id: item.id, modifier_group_id: modifierGroupMap['Thêm món ăn kèm'].id });
            }
        }
    }
    if (itemModifierLinks.length > 0) {
        const { error: linkError } = await supabase.from('menu_item_modifier_groups').insert(itemModifierLinks);
        if (linkError) throw linkError;
    }

    // 4. Tables
    console.log('  - Seeding tables...');
    const { data: seededTables, error: tableError } = await supabase.from('tables').insert(TABLES).select();
    if (tableError) throw tableError;

    // 5. Mock Operational Data
    console.log('🔄 Đang tạo dữ liệu Operational (Active & History) với Customizations...');

    // Preparation for random modifiers
    const getAvailableModifiersForItem = (itemId) => {
        const links = itemModifierLinks.filter(l => l.menu_item_id === itemId);
        const groups = links.map(l => Object.values(modifierGroupMap).find(g => g.id === l.modifier_group_id));
        return groups;
    };

    const tableUsageMap = {};
    const activeTables = seededTables.slice(0, 3);
    for (const table of activeTables) {
        await supabase.from('tables').update({ status: 'occupied' }).eq('id', table.id);
        const now = new Date();
        now.setMinutes(now.getMinutes() - getRandomInt(5, 45));
        tableUsageMap[table.id] = [now.getTime()];

        const { data: newOrder } = await supabase.from('orders').insert({
            table_id: table.id,
            status: 'processing',
            total_amount: 0,
            created_at: now.toISOString(),
        }).select().single();

        if (newOrder) await createRandomItems(newOrder.id, seededMenuItems, now, 'preparing', modifierGroupMap, itemModifierLinks);
    }

    const historyCount = 40;
    let createdCount = 0;
    let attempts = 0;
    while (createdCount < historyCount && attempts < 400) {
        attempts++;
        const date = new Date();
        date.setDate(date.getDate() - getRandomInt(0, 10));
        const rand = Math.random();
        if (rand < 0.4) date.setHours(getRandomInt(11, 13));
        else if (rand < 0.8) date.setHours(getRandomInt(18, 20));
        else date.setHours(getRandomInt(9, 21));
        date.setMinutes(getRandomInt(0, 59));

        const availableTable = seededTables.find(t => !isTableBusy(tableUsageMap[t.id], date));
        if (availableTable) {
            if (!tableUsageMap[availableTable.id]) tableUsageMap[availableTable.id] = [];
            tableUsageMap[availableTable.id].push(date.getTime());

            const { data: newOrder } = await supabase.from('orders').insert({
                table_id: availableTable.id,
                status: 'completed',
                total_amount: 0,
                created_at: date.toISOString(),
            }).select().single();

            if (newOrder) {
                await createRandomItems(newOrder.id, seededMenuItems, date, 'served', modifierGroupMap, itemModifierLinks);

                const paymentTime = new Date(date.getTime() + getRandomInt(30, 50) * 60000);
                await supabase.from('payments').insert({
                    order_id: newOrder.id,
                    amount: 0, // Will be updated later
                    transaction_code: `TXN_${paymentTime.getTime()}_${getRandomInt(1000, 9999)}`,
                    gateway: getRandomItem(['Momo', 'ZaloPay', 'Cash']),
                    status: 'completed',
                    created_at: paymentTime.toISOString()
                });

                if (Math.random() > 0.6) {
                    await supabase.from('reviews').insert({
                        order_id: newOrder.id,
                        rating: getRandomInt(4, 5),
                        comment: getRandomItem(['Ngon quá!', 'Phục vụ tốt', 'Sẽ quay lại', 'Đồ ăn tươi', 'Không gian đẹp']),
                        created_at: paymentTime.toISOString()
                    });
                }
                createdCount++;
            }
        }
    }

    console.log(`✅ Thành công: Cấy ${seededCats.length} Categories, ${seededMenuItems.length} Món ăn, ${seededTables.length} Bàn.`);
    console.log(`✅ Đã tạo các nhóm tùy chỉnh (Modifiers) và liên kết với món ăn.`);
    console.log(`✅ Đã tạo ${createdCount} đơn hàng lịch sử.`);
}

async function createRandomItems(orderId, menuItems, createdAt, itemStatus, modifierGroupMap, itemModifierLinks) {
    const numItems = getRandomInt(2, 5);
    let orderTotal = 0;

    for (let j = 0; j < numItems; j++) {
        const item = getRandomItem(menuItems);
        const quantity = getRandomInt(1, 2);
        const unitPrice = item.price;

        const { data: newOrderItem, error: itemError } = await supabase.from('order_items').insert({
            order_id: orderId,
            menu_item_id: item.id,
            quantity: quantity,
            unit_price: unitPrice,
            total_price: unitPrice * quantity, // Initial
            status: itemStatus,
            created_at: createdAt.toISOString()
        }).select().single();

        if (itemError) continue;

        // Add Random Modifiers
        let itemModifiersPrice = 0;
        const availableGroupIds = itemModifierLinks
            .filter(link => link.menu_item_id === item.id)
            .map(link => link.modifier_group_id);

        const selectedModifiers = [];
        for (const groupId of availableGroupIds) {
            const group = Object.values(modifierGroupMap).find(g => g.id === groupId);
            if (!group) continue;

            const numToSelect = getRandomInt(group.min_selection, group.max_selection);
            if (numToSelect > 0) {
                const shuffled = [...group.modifiers].sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, numToSelect);

                for (const mod of selected) {
                    selectedModifiers.push({
                        order_item_id: newOrderItem.id,
                        modifier_id: mod.id,
                        modifier_name: mod.name,
                        price_modifier: mod.price_modifier
                    });
                    itemModifiersPrice += parseFloat(mod.price_modifier);
                }
            }
        }

        if (selectedModifiers.length > 0) {
            await supabase.from('order_item_modifiers').insert(selectedModifiers);
        }

        const finalItemTotalPrice = (unitPrice + itemModifiersPrice) * quantity;
        await supabase.from('order_items').update({ total_price: finalItemTotalPrice }).eq('id', newOrderItem.id);
        orderTotal += finalItemTotalPrice;
    }

    await supabase.from('orders').update({ total_amount: orderTotal }).eq('id', orderId);
    await supabase.from('payments').update({ amount: orderTotal }).eq('order_id', orderId);
}

// --- MAIN ---

const args = process.argv.slice(2);
const isUndo = args.includes('--undo');
const isSeed = args.includes('--seed');

(async () => {
    try {
        if (isUndo) {
            await cleanup();
        } else if (isSeed) {
            await cleanup();
            await seed();
        } else {
            console.log('Hướng dẫn sử dụng:');
            console.log('  node src/scripts/seeding.js --seed  : Xóa và tạo lại dữ liệu mẫu (Kèm tùy chỉnh)');
            console.log('  node src/scripts/seeding.js --undo  : Chỉ dọn dẹp (xóa sạch) dữ liệu');
        }
    } catch (err) {
        console.error('❌ Thất bại:', err.message);
    } finally {
        process.exit();
    }
})();