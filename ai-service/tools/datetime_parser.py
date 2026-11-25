"""
datetime_parser.py
Module parse và chuẩn hoá ngày giờ tự nhiên tiếng Việt cho trợ lý Aria.
Múi giờ mặc định: Asia/Ho_Chi_Minh
"""

import re
from datetime import datetime, timedelta, date as date_cls
from typing import Optional, Tuple, Dict, Any, List
import pytz

VN_TZ = pytz.timezone("Asia/Ho_Chi_Minh")

# Giờ mở cửa nhà hàng đón khách: 10:00 - 22:30 hàng ngày
VALID_HOURS = [
    (10, 0, 22, 30),
]

WORD_TO_NUM: Dict[str, int] = {
    "một": 1, "hai": 2, "ba": 3, "bốn": 4, "tư": 4, "năm": 5, "sáu": 6,
    "bảy": 7, "bẩy": 7, "tám": 8, "chín": 9, "mười": 10,
    "mười một": 11, "mười hai": 12, "mười ba": 13, "mười bốn": 14,
    "mười lăm": 15, "mười sáu": 16, "mười bảy": 17, "mười tám": 18,
    "mười chín": 19, "hai mươi": 20, "hai mươi lăm": 25, "hai lăm": 25,
    "ba mươi": 30, "bốn mươi": 40, "bốn lăm": 45, "năm mươi": 50,
}


def _to_num(val_str: Optional[str]) -> Optional[int]:
    """Chuyển chuỗi số hoặc chữ số tiếng Việt sang int."""
    if not val_str:
        return None
    s = val_str.strip().lower()
    if s.isdigit():
        return int(s)
    return WORD_TO_NUM.get(s)


def now_vn() -> datetime:
    """Trả về thời gian hiện tại theo múi giờ Việt Nam."""
    return datetime.now(VN_TZ)


def parse_date(text: str) -> Tuple[Optional[str], bool]:
    """
    Parse chuỗi tiếng Việt tìm ngày đặt bàn.
    
    Returns:
        (date_str: "YYYY-MM-DD" hoặc None, is_ambiguous: bool)
    """
    text = text.lower().strip()
    today = now_vn().date()

    # 0. Năm sau / Sang năm
    if any(k in text for k in ["ngày này sang năm", "ngày này năm sau", "hôm nay sang năm", "hôm nay năm sau", "sang năm", "năm sau", "năm tới"]):
        try:
            return (date_cls(today.year + 1, today.month, today.day)).strftime("%Y-%m-%d"), False
        except ValueError:
            return (date_cls(today.year + 1, today.month, today.day - 1)).strftime("%Y-%m-%d"), False

    # 1. Các từ chỉ ngày tương đối
    if any(k in text for k in ["hôm nay", "tối nay", "trưa nay", "sáng nay", "chiều nay"]):
        return today.strftime("%Y-%m-%d"), False

    if any(k in text for k in ["ngày mai", "tối mai", "sáng mai", "trưa mai", "chiều mai", "ngày mai"]) or re.search(r'\bmai\b', text):
        return (today + timedelta(days=1)).strftime("%Y-%m-%d"), False

    if any(k in text for k in ["ngày kia", "ngày mốt", "mốt"]):
        return (today + timedelta(days=2)).strftime("%Y-%m-%d"), False

    # 2. Thứ trong tuần
    weekday_map = {
        "thứ hai": 0, "thứ 2": 0,
        "thứ ba": 1, "thứ 3": 1,
        "thứ tư": 2, "thứ 4": 2,
        "thứ năm": 3, "thứ 5": 3,
        "thứ sáu": 4, "thứ 6": 4,
        "thứ bảy": 5, "thứ 7": 5,
        "chủ nhật": 6, "chủ nhựt": 6, "cn": 6
    }

    is_next_week = any(k in text for k in ["tuần sau", "tuần tới", "kế tiếp"])

    for vn_name, wd in weekday_map.items():
        # Match nguyên cụm từ hoặc regex ranh giới từ
        pattern = rf'\b{re.escape(vn_name)}\b'
        if re.search(pattern, text):
            days_ahead = wd - today.weekday()
            if days_ahead <= 0:
                # Nếu thứ trong tuần đã qua hoặc là hôm nay -> tính sang tuần sau
                days_ahead += 7
            if is_next_week:
                # Nếu người dùng nói rõ "tuần sau", đảm bảo cộng thêm 7 ngày
                # nếu days_ahead chưa vượt qua tuần này
                if (today.weekday() + days_ahead) < 7 or not (days_ahead >= 7):
                    days_ahead += 7
            target = today + timedelta(days=days_ahead)
            return target.strftime("%Y-%m-%d"), False

    # 3. Ngày cụ thể dạng số: "2026-10-15", "ngày 5/11", "5/11/2026", "ngày 20 tháng 10", "5-11"
    # 3a. Định dạng ISO: YYYY-MM-DD hoặc YYYY/MM/DD
    iso_match = re.search(r'\b(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})\b', text)
    if iso_match:
        year = int(iso_match.group(1))
        month = int(iso_match.group(2))
        day = int(iso_match.group(3))
        try:
            return date_cls(year, month, day).strftime("%Y-%m-%d"), False
        except ValueError:
            pass

    # 3b. Định dạng thông thường: DD/MM/YYYY, DD-MM-YYYY, ngày DD tháng MM
    specific_patterns = [
        r'ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})(?:\s*năm\s*(\d{4}))?',
        r'ngày\s*(\d{1,2})[/\-\.](\d{1,2})(?:[/\-\.](\d{4}))?',
        r'\b(\d{1,2})[/\-\.](\d{1,2})(?:[/\-\.](\d{4}))?\b',
    ]

    for pat in specific_patterns:
        m = re.search(pat, text)
        if m:
            day = int(m.group(1))
            month = int(m.group(2))
            year = int(m.group(3)) if m.group(3) else today.year
            try:
                target_date = date_cls(year, month, day)
                # Nếu không truyền năm và ngày đó đã qua trong năm nay -> sang năm sau
                if not m.group(3) and target_date < today:
                    target_date = date_cls(year + 1, month, day)
                return target_date.strftime("%Y-%m-%d"), False
            except ValueError:
                pass

    # 3c. Ngày trong tháng: "ngày 15", "15 tây", "ngày 20", "cuối tuần"
    if "cuối tuần" in text:
        days_ahead = (5 - today.weekday()) % 7
        if days_ahead == 0:
            days_ahead = 7
        return (today + timedelta(days=days_ahead)).strftime("%Y-%m-%d"), False

    day_match = re.search(r'(?:ngày\s*)?(\d{1,2})\s*(?:tây|\b)', text)
    if day_match and ("ngày" in text or "tây" in text):
        day = int(day_match.group(1))
        if 1 <= day <= 31:
            try:
                target_date = date_cls(today.year, today.month, day)
                if target_date < today:
                    next_month = today.month + 1 if today.month < 12 else 1
                    next_year = today.year if today.month < 12 else today.year + 1
                    target_date = date_cls(next_year, next_month, day)
                return target_date.strftime("%Y-%m-%d"), False
            except ValueError:
                pass

    return None, False


def parse_time(text: str, pending_ambiguous_hour: Optional[int] = None) -> Tuple[Optional[str], bool, Optional[int]]:
    """
    Parse chuỗi tiếng Việt tìm giờ đặt bàn.
    
    Returns:
        (time_str: "HH:MM" hoặc None, is_ambiguous: bool, ambiguous_hour: int hoặc None)
    """
    text = text.lower().strip()

    is_morning = any(k in text for k in ["sáng", "buổi sáng", "am"])
    is_noon = any(k in text for k in ["trưa", "buổi trưa", "đứng bóng"])
    is_afternoon = any(k in text for k in ["chiều", "buổi chiều", "pm"])
    is_evening = any(k in text for k in ["tối", "buổi tối", "đêm", "khuya"])

    # Regex bắt các kiểu giờ: 7h30, 7:30, 19h, 19:00, 7 giờ 30, 7 giờ, 7h rưỡi, lúc 18...
    # 1. Mẫu giờ kém: "bảy giờ kém mười lăm", "7h kém 15", "8 giờ kém 20", "7 giờ kém mười lăm"
    hour: Optional[int] = None
    minute = 0

    kem_pattern = r'(\d{1,2}|một|hai|ba|bốn|tư|năm|sáu|bảy|bẩy|tám|chín|mười|mười một|mười hai)\s*(?:giờ|h|g)?\s*kém\s*(\d{1,2}|mười lăm|hai mươi lăm|hai mươi|mười|năm)'
    m_kem = re.search(kem_pattern, text)
    if m_kem:
        h_val = _to_num(m_kem.group(1))
        min_kem = _to_num(m_kem.group(2))
        if h_val is not None and min_kem is not None:
            hour = h_val - 1 if h_val > 0 else 23
            minute = 60 - min_kem

    # 2. Mẫu rưỡi: "7 rưỡi", "7h rưỡi", "bảy rưỡi"
    if hour is None:
        ruoi_pattern = r'(\d{1,2}|một|hai|ba|bốn|tư|năm|sáu|bảy|bẩy|tám|chín|mười|mười một|mười hai)\s*(?:h|g|\s*giờ)?\s*(?:rưỡi|ruoi)'
        m_ruoi = re.search(ruoi_pattern, text)
        if m_ruoi:
            h_val = _to_num(m_ruoi.group(1))
            if h_val is not None:
                hour = h_val
                minute = 30

    # 3. Các mẫu giờ thông thường (số hoặc chữ)
    if hour is None:
        time_patterns = [
            r'(\d{1,2})\s*(?:h|g|:|\s*giờ\s*)\s*(\d{2})',
            r'(\d{1,2})\s*(?:h|g|\s*giờ)(?!\d)',
            r'\b(\d{1,2}):(\d{2})\b',
            r'\b(một|hai|ba|bốn|tư|năm|sáu|bảy|bẩy|tám|chín|mười|mười một|mười hai)\s*(?:h|g|\s*giờ)(?!\d)',
            r'^(?:lúc|vào|tầm|khoảng)?\s*([1-9]|1\d|2[0-3])\s*(?:h|g|giờ)?$',
        ]
        for pat in time_patterns:
            m = re.search(pat, text)
            if m:
                h_val = _to_num(m.group(1))
                if h_val is not None:
                    hour = h_val
                    if len(m.groups()) >= 2 and m.group(2) and m.group(2).isdigit():
                        minute = int(m.group(2))
                    break

    # Nếu không tìm thấy số giờ trong câu, nhưng có pending_ambiguous_hour từ turn trước
    # và câu này chỉ là câu trả lời buổi (VD: "tối", "buổi tối", "tối nha", "sáng", "chiều")
    if hour is None:
        if pending_ambiguous_hour is not None:
            if is_evening:
                h = pending_ambiguous_hour + 12 if pending_ambiguous_hour < 12 else pending_ambiguous_hour
                return f"{h:02d}:00", False, None
            if is_afternoon:
                h = pending_ambiguous_hour + 12 if pending_ambiguous_hour < 12 else pending_ambiguous_hour
                return f"{h:02d}:00", False, None
            if is_morning or is_noon:
                return f"{pending_ambiguous_hour:02d}:00", False, None
        return None, False, None

    # Trường hợp người dùng nhập giờ 24h: 13h..23h
    if 13 <= hour <= 23:
        if 0 <= minute <= 59:
            return f"{hour:02d}:{minute:02d}", False, None
        return None, True, hour

    # Trường hợp 12h: trưa hoặc đêm
    if hour == 12:
        if is_evening or "đêm" in text:
            return "00:00", False, None
        return f"12:{minute:02d}", False, None

    # Trường hợp 0h:
    if hour == 0:
        return f"00:{minute:02d}", False, None

    # Với các giờ từ 1 đến 11:
    is_explicit_morning = bool(re.search(r'(\d{1,2}|một|hai|ba|bốn|tư|năm|sáu|bảy|bẩy|tám|chín|mười|mười một)\s*(?:h|g|:|\s*giờ)?\s*sáng\b', text)) or ("sáng" in text and "tối" not in text and "chiều" not in text and "đêm" not in text and "khuya" not in text)
    if is_explicit_morning:
        return f"{hour:02d}:{minute:02d}", False, None

    if is_evening:
        # 1h..5h đêm/khuya là rạng sáng (01:00..05:00)
        if 1 <= hour <= 5:
            return f"{hour:02d}:{minute:02d}", False, None
        else:
            if hour < 12:
                hour += 12
            return f"{hour:02d}:{minute:02d}", False, None

    if is_afternoon:
        if hour < 12:
            hour += 12
        return f"{hour:02d}:{minute:02d}", False, None

    if is_noon:
        # 11h trưa -> 11:00, 12h trưa -> 12:00
        return f"{hour:02d}:{minute:02d}", False, None

    if is_morning:
        return f"{hour:02d}:{minute:02d}", False, None

    # Không có từ chỉ buổi:
    # Nếu là 1h..11h -> Không rõ sáng hay tối!
    return None, True, hour


def validate_reservation_time(
    date_str: str,
    time_str: str,
    open_time: Optional[str] = "08:00",
    close_time: Optional[str] = "22:00",
    operating_shifts: Optional[List[Tuple[int, int, int, int]]] = None
) -> Tuple[bool, str, str]:
    """
    Kiểm tra thời gian đặt bàn:
    - Không được trong quá khứ
    - Không được vượt quá 30 ngày trong tương lai
    - Phải trong khung giờ đón khách của nhà hàng (lấy động từ open_time, close_time hoặc operating_shifts)
    
    Returns:
        (is_valid: bool, error_code: str, error_message: str)
    """
    try:
        dt_requested = VN_TZ.localize(
            datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        )
    except Exception as e:
        return False, "INVALID_FORMAT", f"Định dạng ngày giờ không hợp lệ: {str(e)}"

    now = now_vn()

    # 1. Tính toán khung giờ mở cửa / đón khách để dùng cho thông báo lỗi
    open_str = open_time or "08:00"
    close_str = close_time or "22:00"
    try:
        o_h, o_m = map(int, open_str.split(":"))
        c_h, c_m = map(int, close_str.split(":"))
        open_mins = o_h * 60 + o_m
        close_mins = c_h * 60 + c_m
        last_seating_mins = max(open_mins, close_mins - 30)
        last_seating_str = f"{last_seating_mins // 60:02d}:{last_seating_mins % 60:02d}"
    except Exception:
        last_seating_str = "21:30"

    # 2. Kiểm tra ngày/giờ quá khứ
    is_past = False
    is_same_day_past = False

    if dt_requested <= now:
        is_past = True
        if dt_requested.date() == now.date():
            is_same_day_past = True
    elif now.hour < 6 and dt_requested.date() == now.date() and dt_requested.hour >= 6:
        # Trường hợp nửa đêm (00:00 - 05:59): theo góc nhìn ngày kinh doanh / sinh hoạt,
        # các mốc giờ ban ngày (VD: 08:00 sáng hôm nay) là mốc đã trôi qua 16+ tiếng trước (TC-LV6-01).
        is_past = True
        is_same_day_past = True

    if is_past:
        if is_same_day_past:
            req_h = dt_requested.hour
            if 1 <= req_h < 11:
                session_name = "sáng"
            elif 11 <= req_h < 13:
                session_name = "trưa"
            elif 13 <= req_h < 18:
                session_name = "chiều"
            else:
                session_name = "tối"
            time_display = f"{time_str} {session_name}".strip()

            return (
                False,
                "PAST_TIME",
                f"Dạ, mốc thời gian {time_display} hôm nay đã trôi qua rồi ạ. "
                f"Quý khách vui lòng chọn một khung giờ sắp tới trong ngày (từ {open_str} đến {last_seating_str}) "
                f"hoặc đặt cho ngày mai giúp Aria nhé!"
            )
        return (
            False,
            "PAST_TIME",
            f"Thời gian {date_str} lúc {time_str} đã qua rồi. Bạn vui lòng chọn một mốc thời gian trong tương lai nhé!"
        )

    # 3. Giới hạn tối đa 30 ngày (Proposal T19)
    days_diff = (dt_requested.date() - now.date()).days
    if days_diff > 30:
        return (
            False,
            "POLICY_MAX_DAYS",
            f"Nhà hàng chỉ nhận đặt bàn trước tối đa trong vòng 30 ngày (đến ngày {(now.date() + timedelta(days=30)).strftime('%d/%m/%Y')}) ạ."
        )

    # 4. Kiểm tra giờ đón khách theo cấu hình động
    req_time_mins = dt_requested.hour * 60 + dt_requested.minute

    # Nếu có cấu hình theo ca cụ thể (operating_shifts)
    if operating_shifts:
        in_any_shift = any(
            (s_h * 60 + s_m) <= req_time_mins <= (e_h * 60 + e_m)
            for s_h, s_m, e_h, e_m in operating_shifts
        )
        if not in_any_shift:
            shifts_desc = " hoặc ".join(
                f"{s_h:02d}:{s_m:02d} – {e_h:02d}:{e_m:02d}"
                for s_h, s_m, e_h, e_m in operating_shifts
            )
            return (
                False,
                "OUTSIDE_OPERATING_HOURS",
                f"Nhà hàng chỉ nhận đặt bàn trong các khung giờ: **{shifts_desc}**. "
                f"Bạn vui lòng chọn lại giờ trong khung giờ này giúp Aria nhé!"
            )
        return True, "", ""

    # Kiểm tra theo open_time và close_time động của nhà hàng
    open_str = open_time or "08:00"
    close_str = close_time or "22:00"

    try:
        o_h, o_m = map(int, open_str.split(":"))
        c_h, c_m = map(int, close_str.split(":"))
        open_mins = o_h * 60 + o_m
        close_mins = c_h * 60 + c_m

        # Nhận khách muộn nhất 30 phút trước giờ đóng cửa để khách kịp dùng bữa
        last_seating_mins = max(open_mins, close_mins - 30)
        last_seating_str = f"{last_seating_mins // 60:02d}:{last_seating_mins % 60:02d}"

        if not (open_mins <= req_time_mins <= last_seating_mins):
            h_int = dt_requested.hour
            h_desc = f"{h_int}h ({time_str})"
            return (
                False,
                "OUTSIDE_OPERATING_HOURS",
                f"Dạ, SmartRestaurant phục vụ đón khách trong giờ mở cửa từ 10:00 sáng đến 22:30 tối (đóng cửa lúc 22:30, đón khách muộn nhất 22:00) hàng ngày ạ. "
                f"Khung giờ {h_desc} nhà hàng không phục vụ / đã đóng cửa nghỉ ngơi. "
                f"Quý khách vui lòng chọn lại khung giờ hoạt động hợp lệ từ 10:00 sáng mai nhé!"
            )
    except Exception:
        # Fallback an toàn nếu format giờ bị lỗi
        if not (10 * 60 <= req_time_mins <= 22 * 60):
            h_int = dt_requested.hour
            h_desc = f"{h_int}h ({time_str})"
            return (
                False,
                "OUTSIDE_OPERATING_HOURS",
                f"Dạ, SmartRestaurant phục vụ đón khách trong giờ mở cửa từ 10:00 sáng đến 22:30 tối (đóng cửa lúc 22:30, đón khách muộn nhất 22:00) hàng ngày ạ. "
                f"Khung giờ {h_desc} nhà hàng không phục vụ / đã đóng cửa nghỉ ngơi. "
                f"Quý khách vui lòng chọn lại khung giờ hoạt động hợp lệ từ 10:00 sáng mai nhé!"
            )

    return True, "", ""
