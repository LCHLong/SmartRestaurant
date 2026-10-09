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

# Giờ mở cửa nhà hàng đón khách: 10:00 - 14:00 và 17:00 - 21:30
VALID_HOURS = [
    (10, 0, 14, 0),   # Ca trưa: 10:00 - 14:00
    (17, 0, 21, 30),  # Ca tối: 17:00 - 21:30
]


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

    return None, False


def parse_time(text: str) -> Tuple[Optional[str], bool]:
    """
    Parse chuỗi tiếng Việt tìm giờ đặt bàn.
    
    Returns:
        (time_str: "HH:MM" hoặc None, is_ambiguous: bool)
    """
    text = text.lower().strip()

    is_morning = any(k in text for k in ["sáng", "buổi sáng", "am"])
    is_noon = any(k in text for k in ["trưa", "buổi trưa", "đứng bóng"])
    is_afternoon = any(k in text for k in ["chiều", "buổi chiều", "pm"])
    is_evening = any(k in text for k in ["tối", "buổi tối", "đêm", "khuya"])

    # Regex bắt các kiểu giờ: 7h30, 7:30, 19h, 19:00, 7 giờ 30, 7 giờ
    time_patterns = [
        r'(\d{1,2})[h:giờ]\s*(\d{2})',
        r'(\d{1,2})\s*h(?!\d)',
        r'(\d{1,2})\s*giờ(?!\s*\d)',
        r'\b(\d{1,2}):(\d{2})\b',
    ]

    hour: Optional[int] = None
    minute = 0

    for pat in time_patterns:
        m = re.search(pat, text)
        if m:
            hour = int(m.group(1))
            if len(m.groups()) >= 2 and m.group(2):
                minute = int(m.group(2))
            break

    if hour is None:
        return None, False

    # Trường hợp người dùng nhập giờ 24h: 13h..23h
    if 13 <= hour <= 23:
        if 0 <= minute <= 59:
            return f"{hour:02d}:{minute:02d}", False
        return None, True

    # Trường hợp 12h: trưa hoặc đêm
    if hour == 12:
        if is_evening or "đêm" in text:
            return "00:00", False
        return f"12:{minute:02d}", False

    # Trường hợp 0h:
    if hour == 0:
        return f"00:{minute:02d}", False

    # Với các giờ từ 1 đến 11:
    if is_evening:
        hour += 12
        return f"{hour:02d}:{minute:02d}", False

    if is_afternoon:
        if hour < 12:
            hour += 12
        return f"{hour:02d}:{minute:02d}", False

    if is_noon:
        # 11h trưa -> 11:00, 12h trưa -> 12:00
        return f"{hour:02d}:{minute:02d}", False

    if is_morning:
        return f"{hour:02d}:{minute:02d}", False

    # Không có từ chỉ buổi:
    # Nếu là 1h..11h -> Không rõ sáng hay tối!
    return None, True


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

    # 1. Kiểm tra ngày/giờ quá khứ
    if dt_requested <= now:
        return (
            False,
            "PAST_TIME",
            f"Thời gian {date_str} lúc {time_str} đã qua rồi. Bạn vui lòng chọn một mốc thời gian trong tương lai nhé!"
        )

    # 2. Giới hạn tối đa 30 ngày (Proposal T19)
    days_diff = (dt_requested.date() - now.date()).days
    if days_diff > 30:
        return (
            False,
            "POLICY_MAX_DAYS",
            f"Nhà hàng chỉ nhận đặt bàn trước tối đa trong vòng 30 ngày (đến ngày {(now.date() + timedelta(days=30)).strftime('%d/%m/%Y')}) ạ."
        )

    # 3. Kiểm tra giờ đón khách theo cấu hình động
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
            return (
                False,
                "OUTSIDE_OPERATING_HOURS",
                f"Nhà hàng phục vụ đón khách từ **{open_str}** đến **{last_seating_str}** (đóng cửa lúc {close_str}). "
                f"Bạn vui lòng chọn giờ trong khung giờ này giúp Aria nhé!"
            )
    except Exception:
        # Fallback an toàn nếu format giờ bị lỗi
        if not (8 * 60 <= req_time_mins <= 21 * 60 + 30):
            return (
                False,
                "OUTSIDE_OPERATING_HOURS",
                f"Nhà hàng phục vụ đón khách từ **08:00** đến **21:30** (đóng cửa lúc 22:00). "
                f"Bạn vui lòng chọn giờ trong khung giờ này giúp Aria nhé!"
            )

    return True, "", ""
