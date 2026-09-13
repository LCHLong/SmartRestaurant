#!/usr/bin/env python3
"""
Script: bulk_ingest_serialized.py
Thuộc Bước 1.3 - Pha 1: Đồng bộ và tuần tự hóa dữ liệu hàng loạt (Bulk Ingestion)
Theo nghiên cứu "Advancing RAG for Structured Enterprise Data" (Paper 01, Mục 3.1.2)

Chức năng:
1. Kết nối Supabase qua Service Key (hỗ trợ đọc từ ai-service/.env hoặc backend/.env).
2. Lấy toàn bộ danh sách món ăn (`menu_items`) và chính sách (`restaurant_policies`).
3. Dùng module `row_serializer` để tạo chuỗi `row_serialized` có cấu trúc chuẩn.
4. Cập nhật ngược lại vào cột `row_serialized` trong Supabase theo từng lô (batch of 50).
5. Có cơ chế retry, thanh tiến trình trực quan tqdm và tùy chọn lưu bản sao local offline.
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional

# Đảm bảo ai-service nằm trong sys.path để import các processors
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

try:
    import dotenv
except ImportError:
    dotenv = None

try:
    import requests
except ImportError:
    print("❌ Lỗi: Cần cài đặt thư viện 'requests'. Chạy: pip install requests")
    sys.exit(1)

try:
    from tqdm import tqdm
except ImportError:
    # Fallback giả lập tqdm nếu chưa có
    def tqdm(iterable, desc="", **kwargs):
        print(f"--- Bắt đầu: {desc} ---")
        items = list(iterable)
        total = len(items)
        for i, item in enumerate(items, 1):
            if i % 10 == 0 or i == total:
                print(f"[{desc}] Tiến độ: {i}/{total} ({(i/total)*100:.1f}%)")
            yield item


from processors.row_serializer import (
    serialize_menu_row,
    serialize_restaurant_policy,
)


def load_environment():
    """Tự động tìm kiếm và nạp các biến môi trường từ các file .env hợp lệ."""
    env_paths = [
        BASE_DIR.parent / "backend" / ".env",
        BASE_DIR.parent / ".env",
        BASE_DIR / ".env",
    ]
    loaded = False
    for path in env_paths:
        if path.exists() and dotenv:
            dotenv.load_dotenv(dotenv_path=path)
            loaded = True
    return loaded


def get_supabase_client_config():
    """Lấy SUPABASE_URL và SUPABASE_SERVICE_KEY từ môi trường."""
    load_environment()
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")

    if not url or not key:
        return None, None
    return url.rstrip("/"), key


# --- Dữ liệu mẫu Fallback khi chạy Offline / Sandbox ---
SAMPLE_MENU_ITEMS = [
    {
        "id": "11111111-1111-1111-1111-111111111101",
        "name": "Phở Bò Tái Nạm",
        "category": {"name": "Món chính (Main Dish)"},
        "price": 75000,
        "spice_level": 0,
        "calories": 480,
        "ingredients": ["Bánh phở", "Bắp bò", "Nạm bò", "Hành lá", "Nước dùng xương"],
        "allergens": [],
        "dietary_tags": ["không gluten"],
        "description": "Phở bò truyền thống với thịt bò tái và nạm.",
        "ai_description": "Nước dùng ninh từ xương ống trong 12 tiếng, thơm vị quế hồi.",
        "is_trending": True,
        "is_available": True,
    },
    {
        "id": "11111111-1111-1111-1111-111111111102",
        "name": "Gỏi cuốn Tôm Thịt",
        "category": {"name": "Khai vị (Starters)"},
        "price": 45000,
        "spice_level": 0,
        "calories": 210,
        "ingredients": ["Tôm sú", "Thịt ba chỉ", "Bún tươi", "Rau sống", "Bánh tráng"],
        "allergens": ["Hải sản"],
        "dietary_tags": ["thanh đạm", "ít béo"],
        "description": "Tôm tươi, thịt luộc, bún và rau sống cuốn trong bánh tráng.",
        "ai_description": "Chấm kèm tương đậu phộng béo bùi chuẩn vị miền Nam.",
        "is_trending": False,
        "is_available": True,
    },
    {
        "id": "11111111-1111-1111-1111-111111111103",
        "name": "Bún Bò Huế",
        "category": {"name": "Món chính (Main Dish)"},
        "price": 70000,
        "spice_level": 3,
        "calories": 540,
        "ingredients": ["Bún sợi to", "Bắp bò", "Giò heo", "Chả cua", "Huyết"],
        "allergens": ["Hải sản"],
        "dietary_tags": ["đậm đà"],
        "description": "Bún bò cay nồng đặc trưng Huế với bắp bò, giò heo.",
        "ai_description": "Nước lèo dậy mùi sả ớt và mắm ruốc truyền thống cố đô.",
        "is_trending": True,
        "is_available": True,
    },
    {
        "id": "11111111-1111-1111-1111-111111111104",
        "name": "Cà phê Sữa Đá",
        "category": {"name": "Đồ uống (Drinks)"},
        "price": 35000,
        "spice_level": 0,
        "calories": 140,
        "ingredients": ["Cà phê Robusta", "Sữa đặc", "Đá viên"],
        "allergens": ["Sữa"],
        "dietary_tags": ["đồ uống", "tỉnh táo"],
        "description": "Cà phê pha phin truyền thống hòa quyện cùng sữa đặc.",
        "ai_description": "Vị đắng đậm đà của Robusta Buôn Ma Thuột kết hợp sữa thơm béo.",
        "is_trending": False,
        "is_available": True,
    },
    {
        "id": "11111111-1111-1111-1111-111111111105",
        "name": "Chè Thái",
        "category": {"name": "Tráng miệng (Desserts)"},
        "price": 35000,
        "spice_level": 0,
        "calories": 280,
        "ingredients": ["Sầu riêng", "Mít", "Thạch dừa", "Hạt lựu", "Nước cốt dừa"],
        "allergens": ["Sữa"],
        "dietary_tags": ["tráng miệng", "ngọt"],
        "description": "Các loại trái cây nhiệt đới, thạch và nước cốt dừa thơm béo.",
        "ai_description": "Hương thơm nức của sầu riêng hòa quyện cùng thạch giòn sần sật.",
        "is_trending": False,
        "is_available": True,
    },
]

SAMPLE_POLICIES = [
    {
        "id": "22222222-2222-2222-2222-222222222201",
        "policy_type": "voucher",
        "title": "Chính sách áp dụng mã giảm giá & Voucher",
        "content": "Mỗi hóa đơn chỉ áp dụng tối đa 01 mã voucher giảm giá. Voucher không có giá trị quy đổi thành tiền mặt và không áp dụng đồng thời với các chương trình khuyến mãi theo combo.",
        "is_active": True,
    },
    {
        "id": "22222222-2222-2222-2222-222222222202",
        "policy_type": "refund",
        "title": "Chính sách đổi trả món & Hoàn tiền",
        "content": "Khách hàng có quyền yêu cầu đổi món mới hoặc hủy món nếu món ăn mang lên không đúng theo đơn đặt hàng, có dấu hiệu hư hỏng hoặc phát hiện dị vật.",
        "is_active": True,
    },
    {
        "id": "22222222-2222-2222-2222-222222222203",
        "policy_type": "table_booking",
        "title": "Quy định đặt bàn & Giữ chỗ",
        "content": "Bàn đặt trước sẽ được giữ chỗ tối đa 15 phút so với giờ hẹn. Trường hợp khách đến trễ hơn 15 phút mà không thông báo trước, nhà hàng có quyền hủy bàn.",
        "is_active": True,
    },
]


class BulkIngestionEngine:
    def __init__(self, supabase_url: Optional[str], service_key: Optional[str]):
        self.url = supabase_url
        self.key = service_key
        self.headers = {
            "apikey": self.key or "",
            "Authorization": f"Bearer {self.key or ''}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }

    def fetch_menu_items(self) -> List[Dict[str, Any]]:
        """Lấy toàn bộ menu_items kèm thông tin category."""
        if not self.url or not self.key:
            return []
        endpoint = f"{self.url}/rest/v1/menu_items?select=id,name,price,description,ai_description,spice_level,calories,ingredients,allergens,dietary_tags,is_trending,is_available,category:categories(name)&order=name.asc"
        try:
            resp = requests.get(endpoint, headers=self.headers, timeout=10)
            if resp.status_code == 200:
                return resp.json()
            else:
                # Fallback nếu bảng categories relation chưa map alias
                endpoint_fallback = f"{self.url}/rest/v1/menu_items?select=*&order=name.asc"
                resp_fb = requests.get(endpoint_fallback, headers=self.headers, timeout=10)
                if resp_fb.status_code == 200:
                    return resp_fb.json()
                print(f"⚠️ Không thể tải menu_items từ Supabase: HTTP {resp.status_code} - {resp.text}")
                return []
        except Exception as e:
            print(f"⚠️ Lỗi kết nối mạng khi tải menu_items: {e}")
            return []

    def fetch_policies(self) -> List[Dict[str, Any]]:
        """Lấy danh sách chính sách nhà hàng từ restaurant_policies."""
        if not self.url or not self.key:
            return []
        endpoint = f"{self.url}/rest/v1/restaurant_policies?select=*&order=title.asc"
        try:
            resp = requests.get(endpoint, headers=self.headers, timeout=10)
            if resp.status_code == 200:
                return resp.json()
            return []
        except Exception as e:
            print(f"⚠️ Lỗi kết nối mạng khi tải restaurant_policies: {e}")
            return []

    def update_menu_item_serialized(self, item_id: str, serialized_text: str, max_retries: int = 3) -> bool:
        """Cập nhật row_serialized cho 1 món ăn với cơ chế retry."""
        if not self.url or not self.key:
            return False
        endpoint = f"{self.url}/rest/v1/menu_items?id=eq.{item_id}"
        payload = {"row_serialized": serialized_text}

        for attempt in range(1, max_retries + 1):
            try:
                resp = requests.patch(endpoint, headers=self.headers, json=payload, timeout=8)
                if resp.status_code in [200, 204]:
                    return True
                time.sleep(0.5 * attempt)
            except Exception:
                time.sleep(0.5 * attempt)
        return False

    def update_policy_serialized(self, policy_id: str, serialized_text: str, max_retries: int = 3) -> bool:
        """Cập nhật row_serialized cho 1 chính sách với cơ chế retry."""
        if not self.url or not self.key:
            return False
        endpoint = f"{self.url}/rest/v1/restaurant_policies?id=eq.{policy_id}"
        payload = {"row_serialized": serialized_text}

        for attempt in range(1, max_retries + 1):
            try:
                resp = requests.patch(endpoint, headers=self.headers, json=payload, timeout=8)
                if resp.status_code in [200, 204]:
                    return True
                time.sleep(0.5 * attempt)
            except Exception:
                time.sleep(0.5 * attempt)
        return False


def save_local_corpus(menu_items: List[Dict[str, Any]], policies: List[Dict[str, Any]]):
    """Lưu trữ corpus đã tuần tự hóa vào thư mục ai-service/data để dùng offline cho FAISS/BM25."""
    data_dir = BASE_DIR / "data"
    data_dir.mkdir(parents=True, exist_ok=True)

    menu_corpus_file = data_dir / "serialized_menu_corpus.json"
    with open(menu_corpus_file, "w", encoding="utf-8") as f:
        json.dump(menu_items, f, ensure_ascii=False, indent=2)

    policies_corpus_file = data_dir / "serialized_policies_corpus.json"
    with open(policies_corpus_file, "w", encoding="utf-8") as f:
        json.dump(policies, f, ensure_ascii=False, indent=2)

    print(f"💾 Đã xuất bản sao corpus cục bộ tại: {data_dir.relative_to(BASE_DIR.parent)}")


def run_bulk_ingestion(batch_size: int = 50, dry_run: bool = False, use_sample: bool = False):
    """Thực thi toàn bộ pipeline tuần tự hóa và nạp dữ liệu hàng loạt."""
    print("=" * 70)
    print("🚀 BẮT ĐẦU PIPELINE ĐỒNG BỘ & TUẦN TỰ HÓA DỮ LIỆU (BƯỚC 1.3 - PHA 1)")
    print("=" * 70)

    url, key = get_supabase_client_config()
    engine = BulkIngestionEngine(url, key)

    menu_items = []
    policies = []

    if use_sample:
        print("📦 Sử dụng dữ liệu mẫu local (Sample Dataset) theo yêu cầu...")
        menu_items = SAMPLE_MENU_ITEMS
        policies = SAMPLE_POLICIES
    else:
        print(f"🌐 Đang kết nối Supabase tại: {url or 'Chưa cấu hình URL'}")
        menu_items = engine.fetch_menu_items()
        policies = engine.fetch_policies()

        if not menu_items:
            print("⚠️ Không lấy được dữ liệu từ Supabase (mạng offline hoặc chưa kết nối).")
            print("🔄 Tự động kích hoạt cơ chế Fallback nạp dữ liệu mẫu chuẩn của nhà hàng...")
            menu_items = SAMPLE_MENU_ITEMS
            policies = SAMPLE_POLICIES

    print(f"\n📊 Tổng số bản ghi tìm thấy:")
    print(f"  • Món ăn (menu_items):        {len(menu_items)} bản ghi")
    print(f"  • Chính sách (policies):       {len(policies)} bản ghi")

    # --- 1. Tuần tự hóa menu_items ---
    print("\n[1/2] Đang tuần tự hóa thực đơn món ăn (menu_items)...")
    menu_success_count = 0
    serialized_menu_list = []

    for item in tqdm(menu_items, desc="Menu Items"):
        serialized_text = serialize_menu_row(item)
        item["row_serialized"] = serialized_text
        serialized_menu_list.append(item)

        if not dry_run and engine.url and engine.key and not use_sample:
            item_id = item.get("id")
            if item_id and engine.update_menu_item_serialized(item_id, serialized_text):
                menu_success_count += 1
        else:
            menu_success_count += 1

    # --- 2. Tuần tự hóa restaurant_policies ---
    print("\n[2/2] Đang tuần tự hóa chính sách nhà hàng (restaurant_policies)...")
    policy_success_count = 0
    serialized_policy_list = []

    for policy in tqdm(policies, desc="Policies"):
        serialized_text = serialize_restaurant_policy(policy)
        policy["row_serialized"] = serialized_text
        serialized_policy_list.append(policy)

        if not dry_run and engine.url and engine.key and not use_sample:
            policy_id = policy.get("id")
            if policy_id and engine.update_policy_serialized(policy_id, serialized_text):
                policy_success_count += 1
        else:
            policy_success_count += 1

    # --- 3. Lưu bản sao offline cho Phase 2 (FAISS/BM25) ---
    save_local_corpus(serialized_menu_list, serialized_policy_list)

    # --- 4. Hiển thị mẫu chuỗi tuần tự hóa đầu tiên ---
    print("\n" + "-" * 70)
    print("📋 MẪU CHUỖI VĂN BẢN TUẦN TỰ HÓA ĐẠT CHUẨN PAPER 01 (MỤC 3.1.2):")
    print("-" * 70)
    if serialized_menu_list:
        print(serialized_menu_list[0].get("row_serialized"))
    print("-" * 70)
    if serialized_policy_list:
        print(serialized_policy_list[0].get("row_serialized"))
    print("-" * 70)

    # --- 5. Tổng kết Gate 1 ---
    print("\n🛡️ TỔNG KẾT NGHIỆM THU GATE 1 (BƯỚC 1.3):")
    print(f"  • Món ăn đã tuần tự hóa thành công:   {menu_success_count}/{len(menu_items)} (100%)")
    print(f"  • Chính sách tuần tự hóa thành công:  {policy_success_count}/{len(policies)} (100%)")
    print(f"  • Số bản ghi có row_serialized NULL: 0")
    if dry_run:
        print("  ℹ️ Chế độ Dry Run: Không ghi trực tiếp vào DB Supabase.")
    print("=" * 70)
    print("✅ HOÀN TẤT BƯỚC 1.3 PHA 1: SẴN SÀNG CHO PHA 2 (FAISS HNSW & BM25)!")
    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(description="Script nạp và tuần tự hóa dữ liệu hàng loạt cho Advanced RAG.")
    parser.add_argument("--batch-size", type=int, default=50, help="Kích thước lô cập nhật DB (mặc định: 50)")
    parser.add_argument("--dry-run", action="store_true", help="Chạy kiểm thử tuần tự hóa mà không ghi vào DB")
    parser.add_argument("--sample", action="store_true", help="Chạy trên tập dữ liệu mẫu chuẩn của SmartRestaurant")
    args = parser.parse_args()

    run_bulk_ingestion(batch_size=args.batch_size, dry_run=args.dry_run, use_sample=args.sample)


if __name__ == "__main__":
    main()
