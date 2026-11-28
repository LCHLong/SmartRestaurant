const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(ROOT_DIR, 'backend', '.env');
require(path.join(ROOT_DIR, 'backend', 'node_modules', 'dotenv')).config({ path: ENV_PATH });
const { createClient } = require(path.join(ROOT_DIR, 'backend', 'node_modules', '@supabase', 'supabase-js'));

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in backend/.env');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function createCleanupRegistry(supabase) {
  const orderIds = new Set();
  const reservationIds = new Set();
  const couponIds = new Set();
  const touchedTableIds = new Set();
  const couponSnapshots = new Map();
  const userIds = new Set();
  const aiSessionIds = new Set();

  return {
    trackOrder(id) {
      if (id) orderIds.add(id);
    },
    trackReservation(id) {
      if (id) reservationIds.add(id);
    },
    trackCoupon(id) {
      if (id) couponIds.add(id);
    },
    trackTable(id) {
      if (id) touchedTableIds.add(id);
    },
    trackUser(id) {
      if (id) userIds.add(id);
    },
    trackAiSession(id) {
      if (id) aiSessionIds.add(id);
    },
    async snapshotCoupon(couponId) {
      if (!couponId || couponSnapshots.has(couponId)) return;
      const { data } = await supabase
        .from('coupons')
        .select('id, used_count')
        .eq('id', couponId)
        .single();
      if (data) {
        couponSnapshots.set(couponId, data.used_count);
      }
    },
    async flush() {
      const errors = [];

      if (orderIds.size > 0) {
        const ids = [...orderIds];
        try {
          const { data: items } = await supabase
            .from('order_items')
            .select('id')
            .in('order_id', ids);
          const itemIds = (items || []).map((i) => i.id);
          if (itemIds.length > 0) {
            await supabase.from('order_item_modifiers').delete().in('order_item_id', itemIds);
          }
          await supabase.from('payments').delete().in('order_id', ids);
          await supabase.from('coupon_usage').delete().in('order_id', ids);
          await supabase.from('reviews').delete().in('order_id', ids);
          await supabase.from('order_items').delete().in('order_id', ids);
          await supabase.from('orders').delete().in('id', ids);
        } catch (err) {
          errors.push(`orders cleanup: ${err.message}`);
        }
        orderIds.clear();
      }

      if (reservationIds.size > 0) {
        const ids = [...reservationIds];
        try {
          await supabase.from('reservations').delete().in('id', ids);
        } catch (err) {
          errors.push(`reservations cleanup: ${err.message}`);
        }
        reservationIds.clear();
      }

      if (couponIds.size > 0) {
        const ids = [...couponIds];
        try {
          await supabase.from('coupon_usage').delete().in('coupon_id', ids);
          await supabase.from('coupons').delete().in('id', ids);
        } catch (err) {
          errors.push(`coupons cleanup: ${err.message}`);
        }
        couponIds.clear();
      }

      for (const [id, usedCount] of couponSnapshots.entries()) {
        try {
          await supabase.from('coupons').update({ used_count: usedCount }).eq('id', id);
        } catch (err) {
          errors.push(`coupon snapshot restore ${id}: ${err.message}`);
        }
      }
      couponSnapshots.clear();

      if (touchedTableIds.size > 0) {
        const ids = [...touchedTableIds];
        try {
          await supabase.from('tables').update({ status: 'available' }).in('id', ids);
        } catch (err) {
          errors.push(`tables restore: ${err.message}`);
        }
        touchedTableIds.clear();
      }

      if (userIds.size > 0) {
        const ids = [...userIds];
        try {
          await supabase.from('users').delete().in('id', ids);
        } catch (err) {
          errors.push(`users cleanup: ${err.message}`);
        }
        userIds.clear();
      }

      if (aiSessionIds.size > 0) {
        aiSessionIds.clear();
      }

      if (errors.length > 0) {
        console.warn('[audit cleanup warnings]', errors.join('; '));
      }
    },
  };
}

module.exports = {
  getSupabaseAdmin,
  createCleanupRegistry,
};
