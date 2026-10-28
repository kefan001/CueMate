#!/usr/bin/env python3
"""
CueMate Local Persistent Commercial Server (SQLite + HTTP + File Uploads)
Listens on http://127.0.0.1:4000 by default.
Provides full REST API for WeChat Mini Program (miniapp/) and Web (web/).
"""
import datetime
import hashlib
import http.server
import json
import mimetypes
import os
import pathlib
import random
import re
import sqlite3
import threading
import urllib.parse
import uuid

ROOT_DIR = pathlib.Path(__file__).resolve().parent
DATA_DIR = ROOT_DIR / "data"
UPLOADS_DIR = ROOT_DIR / "uploads"
DB_PATH = DATA_DIR / "cuemate.sqlite"

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

DB_LOCK = threading.Lock()

SENSITIVE_WORDS = [
    "赌球", "赌博", "外围", "盘口", "博彩", "洗钱", "刷单", "裸聊", "色情", "援交", "毒品"
]

ACTIVE_LOCK_STATUSES = {
    "pending_payment",
    "paid",
    "in_progress",
    "awaiting_confirmation",
}

INITIAL_COMPANIONS = [
    {
        "id": "c1",
        "name": "李教练 (Mike)",
        "avatar": "https://picsum.photos/seed/mike/200/200",
        "level": "职业斯诺克选手",
        "hourlyRate": 298,
        "rating": 4.9,
        "reviewCount": 342,
        "tags": ["斯诺克", "耐心教学", "单杆破百"],
        "bio": "前职业斯诺克选手，拥有10年教龄。擅长纠正发力动作，走位思路教学。无论你是新手还是想突破瓶颈的进阶玩家，我都能帮你提升。",
        "distance": "1.2km",
        "venueName": "CueMate 台球俱乐部（望京店）",
        "venueAddress": "北京市朝阳区望京SOHO 3号楼 B1层",
        "venueLat": 39.9968,
        "venueLng": 116.4808,
        "onlineStatus": "online",
        "images": [
            "https://picsum.photos/seed/mike1/600/400",
            "https://picsum.photos/seed/mike2/600/400",
        ],
    },
    {
        "id": "c2",
        "name": "小雅 (Yaya)",
        "avatar": "https://picsum.photos/seed/yaya/200/200",
        "level": "中式八球达人",
        "hourlyRate": 158,
        "rating": 4.8,
        "reviewCount": 128,
        "tags": ["中式八球", "氛围担当", "高颜值"],
        "bio": "热爱中式八球，球风稳健。性格开朗，擅长带动气氛，不仅能陪练，还能让你在轻松愉快的氛围中享受台球的乐趣。",
        "distance": "2.5km",
        "venueName": "CueMate 台球俱乐部（望京店）",
        "venueAddress": "北京市朝阳区望京SOHO 3号楼 B1层",
        "venueLat": 39.9968,
        "venueLng": 116.4808,
        "onlineStatus": "online",
        "images": [
            "https://picsum.photos/seed/yaya1/600/400",
            "https://picsum.photos/seed/yaya2/600/400",
        ],
    },
    {
        "id": "c3",
        "name": "张达人 (Alex)",
        "avatar": "https://picsum.photos/seed/alex/200/200",
        "level": "美式九球高手",
        "hourlyRate": 198,
        "rating": 4.7,
        "reviewCount": 89,
        "tags": ["美式九球", "跳球绝技", "实战对抗"],
        "bio": "美式九球狂热爱好者，精通各种跳球、加塞技巧。喜欢实战对抗，如果你想体验高强度的比赛节奏，找我准没错。",
        "distance": "3.8km",
        "venueName": "CueMate 台球俱乐部（国贸店）",
        "venueAddress": "北京市朝阳区建国路88号 SOHO现代城",
        "venueLat": 39.9072,
        "venueLng": 116.4712,
        "onlineStatus": "online",
        "images": ["https://picsum.photos/seed/alex1/600/400"],
    },
]

INITIAL_ORDERS = [
    {
        "id": "ord_001",
        "companionId": "c2",
        "companionName": "小雅 (Yaya)",
        "companionAvatar": "https://picsum.photos/seed/yaya/200/200",
        "customerId": "u_123",
        "customerName": "台球爱好者_007",
        "customerAvatar": "https://picsum.photos/seed/user/200/200",
        "date": "2023-11-01",
        "timeSlots": ["14:00", "15:00"],
        "totalPrice": 316,
        "venueName": "CueMate 台球俱乐部（望京店）",
        "venueAddress": "北京市朝阳区望京SOHO 3号楼",
        "note": "想练中袋准度，顺便热热身。",
        "createdAt": "2023-10-30T09:00:00.000Z",
        "status": "paid",
    },
    {
        "id": "ord_002",
        "companionId": "c1",
        "companionName": "李教练 (Mike)",
        "companionAvatar": "https://picsum.photos/seed/mike/200/200",
        "customerId": "u_123",
        "customerName": "台球爱好者_007",
        "customerAvatar": "https://picsum.photos/seed/user/200/200",
        "date": "2023-10-28",
        "timeSlots": ["19:00"],
        "totalPrice": 298,
        "venueName": "CueMate 台球俱乐部（望京店）",
        "venueAddress": "北京市朝阳区望京SOHO 3号楼",
        "note": "主要想修正发力。",
        "createdAt": "2023-10-26T13:30:00.000Z",
        "status": "completed",
        "serviceStartedAt": "2023-10-28T11:00:00.000Z",
        "serviceEndedAt": "2023-10-28T12:05:00.000Z",
        "customerConfirmedAt": "2023-10-28T12:08:00.000Z",
        "customerReview": {
            "rating": 5,
            "content": "讲得很细，发力问题一下就找到了，打完还会复盘。",
            "createdAt": "2023-10-28T12:12:00.000Z",
            "tags": ["讲解细致", "很专业", "沟通顺畅"],
            "anonymous": False,
            "followUp": {
                "content": "第二天复练时明显更稳了，建议新手也可以直接约。",
                "createdAt": "2023-10-29T09:20:00.000Z",
            },
        },
    },
    {
        "id": "ord_003",
        "companionId": "c3",
        "companionName": "张达人 (Alex)",
        "companionAvatar": "https://picsum.photos/seed/alex/200/200",
        "customerId": "u_123",
        "customerName": "台球爱好者_007",
        "customerAvatar": "https://picsum.photos/seed/user/200/200",
        "date": "2023-11-05",
        "timeSlots": ["20:00", "21:00"],
        "totalPrice": 396,
        "venueName": "CueMate 台球俱乐部（国贸店）",
        "venueAddress": "北京市朝阳区建国路88号",
        "note": "想来一场实战对抗。",
        "createdAt": "2023-11-03T11:20:00.000Z",
        "status": "pending_payment",
    },
]

INITIAL_THREADS = [
    {
        "id": "thread_c1_u_123",
        "companionId": "c1",
        "companionName": "李教练 (Mike)",
        "companionAvatar": "https://picsum.photos/seed/mike/200/200",
        "customerId": "u_123",
        "customerName": "台球爱好者_007",
        "customerAvatar": "https://picsum.photos/seed/user/200/200",
        "orderId": "ord_002",
        "appointmentDate": "2023-10-28",
        "appointmentSlots": ["19:00"],
        "venueName": "CueMate 台球俱乐部（望京店）",
        "lastReadAtUser": "2023-10-27T11:06:00.000Z",
        "lastReadAtCompanion": "2023-10-27T11:06:00.000Z",
        "messages": [
            {
                "id": "msg_c1_1",
                "sender": "companion",
                "type": "text",
                "text": "你好，我看了你的备注，这次我会重点帮你看出杆和发力节奏。",
                "createdAt": "2023-10-27T10:58:00.000Z",
            },
            {
                "id": "msg_c1_2",
                "sender": "user",
                "type": "text",
                "text": "太好了，我最近中杆老飘，辛苦你到时帮我多盯一下.",
                "createdAt": "2023-10-27T11:02:00.000Z",
            },
            {
                "id": "msg_c1_3",
                "sender": "companion",
                "type": "text",
                "text": "没问题，建议你提前10分钟到店，先热手两杆。",
                "createdAt": "2023-10-27T11:06:00.000Z",
            },
        ],
    },
    {
        "id": "thread_c2_u_123",
        "companionId": "c2",
        "companionName": "小雅 (Yaya)",
        "companionAvatar": "https://picsum.photos/seed/yaya/200/200",
        "customerId": "u_123",
        "customerName": "台球爱好者_007",
        "customerAvatar": "https://picsum.photos/seed/user/200/200",
        "orderId": "ord_001",
        "appointmentDate": "2023-11-01",
        "appointmentSlots": ["14:00", "15:00"],
        "venueName": "CueMate 台球俱乐部（望京店）",
        "lastReadAtUser": "2023-10-31T09:40:00.000Z",
        "lastReadAtCompanion": "2023-10-31T09:33:00.000Z",
        "messages": [
            {
                "id": "msg_c2_1",
                "sender": "user",
                "type": "text",
                "text": "我下单啦，明天下午想先练一下翻袋和防守。",
                "createdAt": "2023-10-31T09:25:00.000Z",
            },
            {
                "id": "msg_c2_2",
                "sender": "companion",
                "type": "text",
                "text": "收到～我给你留了靠窗那张台，氛围比较安静。",
                "createdAt": "2023-10-31T09:33:00.000Z",
            },
            {
                "id": "msg_c2_3",
                "sender": "companion",
                "type": "text",
                "text": "如果你方便的话，穿运动鞋来会更好发力哦。",
                "createdAt": "2023-10-31T09:40:00.000Z",
            },
        ],
    },
]

DEFAULT_ACCOUNT = {
    "id": "u_123",
    "name": "台球爱好者_007",
    "phone": "13800138000",
    "password": "123456",
    "avatar": "https://picsum.photos/seed/user/200/200",
    "bio": "正在寻找会讲走位、也会带气氛的台球搭子。",
    "gender": "other",
    "balance": 1500.0,
    "coupons": 3,
    "createdAt": "2023-10-20T08:00:00.000Z",
}


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")


def check_security(text: str):
    raw = str(text or "").strip()
    if not raw:
        return {"ok": True}
    for word in SENSITIVE_WORDS:
        if word in raw:
            return {
                "ok": False,
                "word": word,
                "message": f"内容包含违规敏感词「{word}」，已被微信内容安全接口（msgSecCheck）拦截",
            }
    return {"ok": True}


def init_db():
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS kv_store (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.commit()
        conn.close()
    ensure_seed_data()


def get_kv(key: str, default_val):
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT value FROM kv_store WHERE key = ?", (key,))
        row = cur.fetchone()
        conn.close()
        if not row:
            return default_val
        try:
            return json.loads(row[0])
        except Exception:
            return default_val


def set_kv(key: str, val):
    with DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO kv_store (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
            """,
            (key, json.dumps(val, ensure_ascii=False), now_iso()),
        )
        conn.commit()
        conn.close()


def ensure_seed_data(force=False):
    if force or get_kv("companions", None) is None:
        set_kv("companions", INITIAL_COMPANIONS)
    if force or get_kv("orders", None) is None:
        set_kv("orders", INITIAL_ORDERS)
    if force or get_kv("threads", None) is None:
        set_kv("threads", INITIAL_THREADS)
    if force or get_kv("accounts", None) is None:
        set_kv("accounts", [DEFAULT_ACCOUNT])
    if force or get_kv("verifications", None) is None:
        set_kv("verifications", {})
    if force or get_kv("applications", None) is None:
        set_kv("applications", [])
    if force or get_kv("withdrawals", None) is None:
        set_kv("withdrawals", [])
    if force or get_kv("custom_schedules", None) is None:
        set_kv("custom_schedules", {})
    if force or get_kv("subscriptions", None) is None:
        set_kv("subscriptions", [])


def build_bootstrap():
    return {
        "ok": True,
        "serverTime": now_iso(),
        "companions": get_kv("companions", INITIAL_COMPANIONS),
        "orders": get_kv("orders", INITIAL_ORDERS),
        "threads": get_kv("threads", INITIAL_THREADS),
        "accounts": get_kv("accounts", [DEFAULT_ACCOUNT]),
        "applications": get_kv("applications", []),
        "withdrawals": get_kv("withdrawals", []),
        "customSchedules": get_kv("custom_schedules", {}),
        "subscriptions": get_kv("subscriptions", []),
    }


def parse_multipart_upload(headers, body: bytes):
    content_type = headers.get("Content-Type", "")
    if "multipart/form-data" in content_type and "boundary=" in content_type:
        boundary = content_type.split("boundary=")[1].split(";")[0].strip().encode("utf-8")
        parts = body.split(b"--" + boundary)
        for part in parts:
            if b"Content-Disposition" in part and b"filename=" in part:
                header_end = part.find(b"\r\n\r\n")
                if header_end != -1:
                    header_bytes = part[:header_end].decode("utf-8", errors="ignore")
                    file_bytes = part[header_end + 4 :]
                    if file_bytes.endswith(b"\r\n"):
                        file_bytes = file_bytes[:-2]
                    fn_match = re.search(r'filename="([^"]+)"', header_bytes)
                    ext = ".bin"
                    if fn_match:
                        ext = pathlib.Path(fn_match.group(1)).suffix or ".jpg"
                    return file_bytes, ext
    return body, ".jpg"


class CueMateRequestHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[CueMate-Server] {self.address_string()} - {fmt % args}")

    def _send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Client-Mode")

    def _send_json(self, data: dict, status: int = 200):
        raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self._send_cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:
            return {}

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/":
            state = build_bootstrap()
            html = f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>CueMate 后端服务控制台</title>
  <style>
    body {{ background:#09090b; color:#f4f4f5; font-family:-apple-system,BlinkMacSystemFont,sans-serif; padding:40px 24px; max-width:760px; margin:0 auto; }}
    .badge {{ display:inline-block; background:rgba(16,185,129,0.14); color:#34d399; border:1px solid rgba(16,185,129,0.3); border-radius:999px; padding:4px 14px; font-size:13px; font-weight:600; }}
    h1 {{ margin:14px 0 6px; font-size:28px; }}
    p {{ color:#a1a1aa; font-size:14px; margin:0 0 24px; }}
    .grid {{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }}
    .card {{ background:#18181b; border:1px solid #27272a; border-radius:16px; padding:18px; }}
    .num {{ font-size:28px; font-weight:700; color:#10b981; margin-top:6px; }}
    .label {{ font-size:12px; color:#a1a1aa; }}
    a {{ color:#34d399; text-decoration:none; margin-right:16px; font-size:14px; }}
    a:hover {{ text-decoration:underline; }}
    code {{ background:#27272a; padding:2px 6px; border-radius:6px; font-size:13px; color:#e4e4e7; }}
  </style>
</head>
<body>
  <span class="badge">● SQLite 持久化服务运行中</span>
  <h1>CueMate 本地商业版后端 API</h1>
  <p>此端口仅供微信小程序（微信开发者工具）与 Web 端调用 API 接口，小程序界面请在「微信开发者工具」中查看。</p>
  <div class="grid">
    <div class="card"><div class="label">认证陪玩/助教</div><div class="num">{len(state["companions"])}</div></div>
    <div class="card"><div class="label">总预约订单</div><div class="num">{len(state["orders"])}</div></div>
    <div class="card"><div class="label">聊天会话</div><div class="num">{len(state["threads"])}</div></div>
    <div class="card"><div class="label">注册账号</div><div class="num">{len(state["accounts"])}</div></div>
  </div>
  <div class="card">
    <div style="font-weight:600;margin-bottom:10px;">常用调试接口（点击查看实时 JSON）：</div>
    <div style="line-height:2;">
      <a href="/health" target="_blank">GET /health（健康检查）</a>
      <a href="/api/bootstrap" target="_blank">GET /api/bootstrap（全量数据库状态）</a>
      <a href="/api/companions" target="_blank">GET /api/companions（陪玩列表）</a>
      <a href="/api/orders" target="_blank">GET /api/orders（订单列表）</a>
    </div>
    <div style="margin-top:12px;font-size:12px;color:#71717a;">数据库路径：<code>{DB_PATH}</code></div>
  </div>
</body>
</html>""".encode("utf-8")
            self.send_response(200)
            self._send_cors()
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(html)))
            self.end_headers()
            self.wfile.write(html)
            return

        if path == "/health":
            state = build_bootstrap()
            self._send_json(
                {
                    "ok": True,
                    "service": "cuemate-server",
                    "mode": "local-sqlite",
                    "dbPath": str(DB_PATH),
                    "stats": {
                        "companions": len(state["companions"]),
                        "orders": len(state["orders"]),
                        "threads": len(state["threads"]),
                        "accounts": len(state["accounts"]),
                    },
                }
            )
            return

        if path == "/api/bootstrap":
            self._send_json(build_bootstrap())
            return

        if path == "/api/companions":
            self._send_json(
                {
                    "ok": True,
                    "companions": get_kv("companions", INITIAL_COMPANIONS),
                    "customSchedules": get_kv("custom_schedules", {}),
                }
            )
            return

        if path == "/api/orders":
            self._send_json({"ok": True, "orders": get_kv("orders", INITIAL_ORDERS)})
            return

        if path == "/api/chats":
            self._send_json({"ok": True, "threads": get_kv("threads", INITIAL_THREADS)})
            return

        if path.startswith("/uploads/"):
            fname = pathlib.Path(path).name
            fpath = UPLOADS_DIR / fname
            if not fpath.exists() or not fpath.is_file():
                self._send_json({"ok": False, "message": "File not found"}, 404)
                return
            mime, _ = mimetypes.guess_type(str(fpath))
            data = fpath.read_bytes()
            self.send_response(200)
            self._send_cors()
            self.send_header("Content-Type", mime or "application/octet-stream")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        self._send_json({"ok": False, "message": f"Route not found: {path}"}, 404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/upload":
            length = int(self.headers.get("Content-Length", "0") or "0")
            body = self.rfile.read(length) if length > 0 else b""
            file_bytes, ext = parse_multipart_upload(self.headers, body)
            fname = f"media_{int(datetime.datetime.now().timestamp() * 1000)}_{uuid.uuid4().hex[:6]}{ext}"
            fpath = UPLOADS_DIR / fname
            fpath.write_bytes(file_bytes)
            host = self.headers.get("Host", "127.0.0.1:4000")
            url = f"http://{host}/uploads/{fname}"
            self._send_json(
                {
                    "ok": True,
                    "url": url,
                    "fileName": fname,
                    "size": len(file_bytes),
                    "securityCheck": "passed",
                }
            )
            return

        body = self._read_json()

        if path == "/api/reset":
            ensure_seed_data(force=True)
            self._send_json(build_bootstrap())
            return

        if path == "/api/security/check":
            res = check_security(body.get("text", ""))
            self._send_json(res, 200 if res["ok"] else 400)
            return

        if path == "/api/sync":
            if "accounts" in body:
                set_kv("accounts", body["accounts"])
            if "orders" in body:
                set_kv("orders", body["orders"])
            if "threads" in body:
                set_kv("threads", body["threads"])
            if "companions" in body:
                set_kv("companions", body["companions"])
            if "applications" in body:
                set_kv("applications", body["applications"])
            if "withdrawals" in body:
                set_kv("withdrawals", body["withdrawals"])
            if "customSchedules" in body:
                set_kv("custom_schedules", body["customSchedules"])
            if "subscriptions" in body:
                set_kv("subscriptions", body["subscriptions"])
            self._send_json(build_bootstrap())
            return

        if path == "/api/auth/wx-login":
            code = str(body.get("code") or "wx_dev_code")
            phone = str(body.get("phone") or "13800138000")
            openid = "wx_openid_" + hashlib.sha256(code.encode("utf-8")).hexdigest()[:12]
            accounts = get_kv("accounts", [DEFAULT_ACCOUNT])
            acc = next((a for a in accounts if a.get("phone") == phone), None)
            if not acc:
                acc = {
                    "id": f"u_{int(datetime.datetime.now().timestamp())}",
                    "name": body.get("name") or f"微信球友_{phone[-4:]}",
                    "phone": phone,
                    "password": "123456",
                    "avatar": body.get("avatar") or f"https://picsum.photos/seed/{phone}/200/200",
                    "bio": "通过微信一键登录的台球爱好者",
                    "gender": "other",
                    "openid": openid,
                    "createdAt": now_iso(),
                }
                accounts.insert(0, acc)
                set_kv("accounts", accounts)
            self._send_json(
                {
                    "ok": True,
                    "openid": openid,
                    "account": acc,
                    "token": f"tk_{openid}",
                    "mode": "wx-jscode2session",
                }
            )
            return

        if path == "/api/auth/wx-phone":
            code = str(body.get("code") or "")
            phone = str(body.get("phone") or "13800138000")
            self._send_json(
                {
                    "ok": True,
                    "phone": phone,
                    "countryCode": "86",
                    "watermark": {"appid": "wxe138bd0afb001d35", "timestamp": int(datetime.datetime.now().timestamp())},
                    "codeUsed": code,
                }
            )
            return

        if path == "/api/orders":
            order = body.get("order") or body
            sec = check_security(order.get("note", ""))
            if not sec["ok"]:
                self._send_json(sec, 400)
                return

            orders = get_kv("orders", INITIAL_ORDERS)
            comp_id = order.get("companionId")
            date_str = order.get("date")
            req_slots = set(order.get("timeSlots") or [])

            for existing in orders:
                if (
                    existing.get("companionId") == comp_id
                    and existing.get("date") == date_str
                    and existing.get("status") in ACTIVE_LOCK_STATUSES
                ):
                    overlap = req_slots.intersection(set(existing.get("timeSlots") or []))
                    if overlap:
                        self._send_json(
                            {
                                "ok": False,
                                "reason": "slot_conflict",
                                "message": f"时段 {', '.join(sorted(overlap))} 刚刚已被其他球友预约锁定，请选择其他时段",
                            },
                            409,
                        )
                        return

            orders.insert(0, order)
            set_kv("orders", orders)
            self._send_json({"ok": True, "order": order, "orders": orders})
            return

        if path == "/api/pay/prepay":
            order_id = body.get("orderId") or f"ord_{int(datetime.datetime.now().timestamp())}"
            amount = float(body.get("amount") or 0)
            nonce_str = uuid.uuid4().hex[:16]
            time_stamp = str(int(datetime.datetime.now().timestamp()))
            pkg = f"prepay_id=wx_{order_id}_{nonce_str[:8]}"
            pay_sign = hashlib.sha256(f"{time_stamp}:{nonce_str}:{pkg}".encode("utf-8")).hexdigest()
            self._send_json(
                {
                    "ok": True,
                    "sandbox": True,
                    "orderId": order_id,
                    "amount": amount,
                    "paymentParams": {
                        "timeStamp": time_stamp,
                        "nonceStr": nonce_str,
                        "package": pkg,
                        "signType": "RSA",
                        "paySign": pay_sign,
                    },
                }
            )
            return

        if path == "/api/companions/apply":
            app_data = body.get("application") or body
            sec = check_security(f"{app_data.get('name', '')} {app_data.get('bio', '')}")
            if not sec["ok"]:
                self._send_json(sec, 400)
                return

            applications = get_kv("applications", [])
            companions_list = get_kv("companions", INITIAL_COMPANIONS)
            new_comp_id = app_data.get("companionId") or f"c_{len(companions_list) + 1}_{uuid.uuid4().hex[:4]}"
            new_comp = {
                "id": new_comp_id,
                "name": app_data.get("name") or "新入驻助教",
                "avatar": app_data.get("avatar") or f"https://picsum.photos/seed/{new_comp_id}/200/200",
                "level": app_data.get("level") or "认证台球助教",
                "hourlyRate": int(app_data.get("hourlyRate") or 168),
                "rating": 5.0,
                "reviewCount": 1,
                "tags": app_data.get("tags") or ["中式八球", "认证助教", "守时靠谱"],
                "bio": app_data.get("bio") or "通过小程序实名认证入驻的台球助教，欢迎约球切磋！",
                "distance": "0.8km",
                "venueName": app_data.get("venueName") or "CueMate 台球俱乐部（望京店）",
                "venueAddress": app_data.get("venueAddress") or "北京市朝阳区望京SOHO 3号楼 B1层",
                "venueLat": 39.9968,
                "venueLng": 116.4808,
                "onlineStatus": "online",
                "images": app_data.get("images") or [
                    f"https://picsum.photos/seed/{new_comp_id}_1/600/400"
                ],
                "verifiedAt": now_iso(),
            }
            record = {
                "id": f"app_{int(datetime.datetime.now().timestamp())}",
                "companionId": new_comp_id,
                "status": "approved",
                "createdAt": now_iso(),
                **app_data,
            }
            applications.insert(0, record)
            companions_list.insert(0, new_comp)
            set_kv("applications", applications)
            set_kv("companions", companions_list)
            self._send_json(
                {
                    "ok": True,
                    "application": record,
                    "companion": new_comp,
                    "companions": companions_list,
                }
            )
            return

        if path == "/api/wallet/withdraw":
            withdrawals = get_kv("withdrawals", [])
            item = {
                "id": f"wd_{int(datetime.datetime.now().timestamp())}",
                "companionId": body.get("companionId") or "c1",
                "amount": float(body.get("amount") or 0),
                "channel": body.get("channel") or "微信零钱（实时到账）",
                "status": "已到账",
                "createdAt": now_iso(),
            }
            withdrawals.insert(0, item)
            set_kv("withdrawals", withdrawals)
            self._send_json({"ok": True, "withdrawal": item, "withdrawals": withdrawals})
            return

        if path == "/api/subscribe/record":
            subs = get_kv("subscriptions", [])
            entry = {
                "id": f"sub_{int(datetime.datetime.now().timestamp())}",
                "templates": body.get("templates") or [],
                "scene": body.get("scene") or "order",
                "createdAt": now_iso(),
            }
            subs.insert(0, entry)
            set_kv("subscriptions", subs[:50])
            self._send_json({"ok": True, "subscription": entry})
            return

        self._send_json({"ok": False, "message": f"Unknown POST endpoint: {path}"}, 404)


def run_server(port: int = 4000):
    init_db()
    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), CueMateRequestHandler)
    print(f"CueMate local commercial server listening on http://127.0.0.1:{port}")
    print(f"SQLite persistence: {DB_PATH}")
    print(f"Media uploads dir : {UPLOADS_DIR}")
    server.serve_forever()


if __name__ == "__main__":
    port_num = int(os.environ.get("PORT", "4000"))
    run_server(port_num)
