#!/usr/bin/env python3
"""
Interactive Terminal Chat with AI Assistant Aria
SmartRestaurant - Advanced Hybrid RAG (IIT Roorkee 2025)
"""

import sys
import json
import requests

API_URL = "http://localhost:5001/chat"
SESSION_ID = "cli-session-001"
TABLE_ID = "table-1"

CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"


def print_banner():
    print(f"\n{CYAN}{BOLD}==============================================================={RESET}")
    print(f"{CYAN}{BOLD}   🍽️  SMART RESTAURANT - TRỢ LÝ ẢO AI ARIA (HYBRID RAG)   {RESET}")
    print(f"{DIM}   Paper 01: Advancing RAG for Structured Enterprise Data (2025){RESET}")
    print(f"{CYAN}{BOLD}==============================================================={RESET}")
    print(f"{YELLOW}💡 Gợi ý câu hỏi thử nghiệm:{RESET}")
    print(f"  1. Quán có món phở bò không?")
    print(f"  2. Tôi bị dị ứng hải sản và thịt bò, quán có món gì giải nhiệt?")
    print(f"  3. Gợi ý cho tôi món nước thanh đạm mát lạnh")
    print(f"  4. Quán mở cửa mấy giờ và chính sách hủy bàn thế nào?")
    print(f"  5. Gõ {BOLD}'exit'{RESET}{YELLOW} hoặc {BOLD}'quit'{RESET}{YELLOW} để kết thúc.{RESET}")
    print(f"{CYAN}---------------------------------------------------------------{RESET}\n")


def chat_turn(message: str, history: list) -> list:
    payload = {
        "message": message,
        "sessionId": SESSION_ID,
        "tableId": TABLE_ID,
        "enableRerank": True,
        "topK": 3,
        "history": history[-6:]
    }

    try:
        response = requests.post(API_URL, json=payload, stream=True, timeout=30)
    except requests.exceptions.ConnectionError:
        print(f"\n{YELLOW}⚠️ Không thể kết nối tới server AI tại {API_URL}! Vui lòng đảm bảo server đang chạy trên cổng 5001.{RESET}\n")
        return history

    if response.status_code != 200:
        print(f"\n{YELLOW}❌ Lỗi HTTP {response.status_code}: {response.text}{RESET}\n")
        return history

    print(f"\n{GREEN}{BOLD}Aria:{RESET} ", end="", flush=True)

    assistant_reply = ""
    grounded_items = []
    metrics = {}

    for line in response.iter_lines(decode_unicode=True):
        if not line or not line.startswith("data: "):
            continue
        raw_data = line[6:].strip()
        try:
            event = json.loads(raw_data)
        except json.JSONDecodeError:
            continue

        event_type = event.get("type")
        if event_type == "token":
            content = event.get("content", "")
            print(content, end="", flush=True)
            assistant_reply += content
        elif event_type == "done":
            grounded_items = event.get("groundedItems", [])
            metrics = event.get("metrics", {})

    print("\n")

    if grounded_items or metrics:
        ttft = metrics.get("ttft_ms", 0)
        total_time = metrics.get("total_time_ms", 0)
        engine = metrics.get("rerank_engine", "standard")
        print(f"{DIM}┌─────────────────────────────────────────────────────────────{RESET}")
        print(f"{DIM}│ ⏱️  TTFT: {BOLD}{ttft:.1f}ms{RESET}{DIM} | Tổng thời gian: {BOLD}{total_time:.1f}ms{RESET}{DIM} | Rerank Engine: {BOLD}{engine}{RESET}")
        if grounded_items:
            print(f"{DIM}│ 🎯 Món kiểm chứng (Top-K Grounded):{RESET}")
            for item in grounded_items:
                name = item.get("name", "")
                price = item.get("price", 0)
                score = item.get("combined_score", 0)
                price_fmt = f"{int(price):,}đ" if price else "N/A"
                print(f"{DIM}│    • {BOLD}{name}{RESET}{DIM} ({price_fmt}) — Score: {score:.3f}{RESET}")
        print(f"{DIM}└─────────────────────────────────────────────────────────────{RESET}\n")

    history.append({"role": "user", "content": message})
    if assistant_reply:
        history.append({"role": "assistant", "content": assistant_reply})

    return history


def main():
    print_banner()
    history = []
    while True:
        try:
            user_input = input(f"{BLUE}{BOLD}Bạn: {RESET}").strip()
        except (KeyboardInterrupt, EOFError):
            print(f"\n{CYAN}Tạm biệt quý khách!{RESET}")
            break

        if not user_input:
            continue
        if user_input.lower() in ("exit", "quit", "q"):
            print(f"\n{CYAN}Cảm ơn bạn đã thử nghiệm trợ lý AI Aria! Hẹn gặp lại.{RESET}")
            break

        history = chat_turn(user_input, history)


if __name__ == "__main__":
    main()
