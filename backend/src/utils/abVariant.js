/**
 * utils/abVariant.js
 * Hàm phân luồng A/B Testing dùng chung cho toàn hệ thống
 *
 * Thuật toán: FNV-1a 32-bit hash trên sessionId
 * → Đảm bảo cùng sessionId luôn cho cùng variant (deterministic)
 * → Phân bố đồng đều ~50/50 theo tham số ratio
 */

/**
 * Xác định nhánh A/B dựa trên sessionId
 * @param {string} sessionId
 * @param {number} ratio - Tỉ lệ phân bổ nhánh A (mặc định 0.5 = 50%)
 * @returns {'variant_a_advanced' | 'variant_b_baseline'}
 */
function getAbVariant(sessionId, ratio = 0.5) {
  if (!sessionId || typeof sessionId !== 'string') return 'variant_a_advanced';
  let hash = 2166136261;
  for (let i = 0; i < sessionId.length; i++) {
    hash ^= sessionId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const score = (hash >>> 0) / 4294967296;
  return score < ratio ? 'variant_a_advanced' : 'variant_b_baseline';
}

module.exports = { getAbVariant };
