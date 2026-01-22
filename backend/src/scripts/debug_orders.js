const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugOrders() {
    console.log('🔍 Fetching orders...');

    // Mimic the query in orderController.js
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            id,
            status,
            created_at,
            table_id,
            tables(id, table_number, status)
        `)
        .order('created_at', { ascending: false })
        // Filter for the specific order ID prefix seen in screenshot
        .ilike('id', '8a9414%')
        .limit(1);

    if (error) {
        console.error('❌ Error fetching orders:', error);
        return;
    }

    console.log('✅ Fetched', orders.length, 'orders.');

    orders.forEach((order, index) => {
        console.log(`\n--- Order #${index + 1} [ID: ${order.id}] ---`);
        console.log('Table ID:', order.table_id);
        console.log('Tables Relation Raw:', JSON.stringify(order.tables, null, 2));
        console.log('Tables Type:', Array.isArray(order.tables) ? 'Array' : typeof order.tables);
    });
}

debugOrders();
