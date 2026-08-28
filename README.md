# 📊 PriceInstant — Telegram Market Price Bot

یک **Cloudflare Worker** سبک و بدون نیاز به سرور برای دریافت قیمت لحظه‌ای **طلا، ارز، سکه و ارزهای دیجیتال** از BRS API و انتشار خودکار آن در کانال تلگرام.

این پروژه به‌گونه‌ای طراحی شده که برای راه‌اندازی آن **نیازی به Node.js، npm، Python، Docker یا اجرای کد روی سیستم شخصی ندارید.**

کافی است کد `worker.js` را در Cloudflare Workers قرار دهید، Secretهای موردنیاز را تنظیم کنید و Cron Trigger را فعال کنید.

---

## ✨ امکانات

* 📊 دریافت قیمت لحظه‌ای بازار
* 💵 قیمت ارزهای رایج
* 🥇 قیمت طلا
* 🪙 قیمت سکه
* ₿ قیمت ارزهای دیجیتال
* 📈 نمایش درصد تغییر قیمت
* 🇮🇷 نمایش قیمت‌های داخلی به تومان
* 💲 نمایش قیمت‌های دلاری با USD
* 🕐 نمایش زمان آخرین بروزرسانی به وقت ایران
* 📢 ارسال خودکار قیمت‌ها به Telegram
* ⏱️ اجرای خودکار هر ۵ دقیقه
* ⚡ اجرا روی Cloudflare Workers
* 🚫 بدون نیاز به VPS
* 🚫 بدون نیاز به Node.js
* 🚫 بدون نیاز به npm
* 🚫 بدون نیاز به Docker
* 🚫 بدون نیاز به Database
* 🔐 استفاده از Cloudflare Secrets
* 🔒 محافظت اختیاری از Endpoint ارسال دستی با `SEND_SECRET`

---

# 🏗️ معماری

ساختار پروژه عمداً بسیار ساده است:

```text
PriceInstant/
└── worker.js
```

تمام منطق برنامه در فایل `worker.js` قرار دارد.

جریان کار:

```text
BRS API
   │
   ▼
Cloudflare Worker
   │
   ├── دریافت قیمت‌ها
   ├── پردازش اطلاعات
   ├── ساخت پیام
   │
   ▼
Telegram Bot API
   │
   ▼
Telegram Channel
```

---

# 📋 موارد موردنیاز

برای راه‌اندازی پروژه حداقل به این دو مورد نیاز دارید:

### 1. BRS API Key

پروژه قیمت‌ها را از BRS API دریافت می‌کند:

```text
https://api.brsapi.ir/Market/Gold_Currency.php
```

برای استفاده از API باید یک API Key معتبر داشته باشید.

---

### 2. Telegram Bot Token

یک Telegram Bot ایجاد کنید و Bot Token آن را دریافت کنید.

Bot باید در کانال موردنظر شما عضو باشد و اجازه ارسال پیام داشته باشد.

---

# ☁️ راه‌اندازی روی Cloudflare Workers

## مرحله 1 — ساخت Worker

وارد Cloudflare Dashboard شوید.

به بخش:

```text
Workers & Pages
```

بروید.

یک Worker جدید ایجاد کنید.

برای مثال:

```text
priceinstant
```

---

## مرحله 2 — قرار دادن کد

فایل:

```text
worker.js
```

موجود در این Repository را باز کنید.

کل کد را Copy کنید.

سپس آن را داخل Code Editor مربوط به Cloudflare Worker قرار دهید.

در نهایت Worker را Deploy کنید.

### نکته

برای این پروژه هیچ نیازی به:

```text
Node.js
npm
Python
Docker
Wrangler
```

روی سیستم شخصی ندارید.

---

# 🔐 تنظیم Secrets

پروژه از سه Secret استفاده می‌کند.

دو مورد **اجباری** و یک مورد **اختیاری ولی توصیه‌شده** است.

---

## 1. BRS_API_KEY

در Cloudflare Worker به:

```text
Settings
→ Variables and Secrets
```

بروید.

یک Secret ایجاد کنید:

```text
BRS_API_KEY
```

مقدار آن باید API Key دریافتی از BRS API باشد.

مثال:

```text
BRS_API_KEY = YOUR_BRS_API_KEY
```

---

## 2. TELEGRAM_BOT_TOKEN

یک Secret دیگر ایجاد کنید:

```text
TELEGRAM_BOT_TOKEN
```

مقدار آن Bot Token مربوط به Telegram Bot شما است.

مثال:

```text
TELEGRAM_BOT_TOKEN = YOUR_TELEGRAM_BOT_TOKEN
```

---

# 🔒 3. SEND_SECRET

`SEND_SECRET` برای محافظت از Endpoint زیر استفاده می‌شود:

```text
/send
```

این Endpoint برای ارسال دستی قیمت‌ها به کانال استفاده می‌شود.

اگر Worker عمومی باشد، توصیه می‌شود `SEND_SECRET` را حتماً تنظیم کنید.

در Cloudflare یک Secret جدید ایجاد کنید:

```text
SEND_SECRET
```

مثال:

```text
SEND_SECRET = YOUR_RANDOM_SECRET
```

از یک مقدار تصادفی و طولانی استفاده کنید.

مثلاً:

```text
SEND_SECRET = 8fK9xP2mQ7vL4nR6sT1zW5
```

**این مقدار نمونه است و نباید دقیقاً از آن استفاده کنید.**

---

# 🛡️ نحوه کار SEND_SECRET

اگر `SEND_SECRET` تنظیم نشده باشد:

```text
/send
```

بدون احراز هویت در دسترس خواهد بود.

اگر `SEND_SECRET` تنظیم شده باشد، درخواست `/send` فقط در صورت ارائه Secret صحیح پذیرفته می‌شود.

روش پیشنهادی:

```text
Authorization: Bearer YOUR_SEND_SECRET
```

مثال:

```bash
curl \
  -H "Authorization: Bearer YOUR_SEND_SECRET" \
  https://YOUR-WORKER.workers.dev/send
```

همچنین Worker از Query Parameter نیز پشتیبانی می‌کند:

```text
/send?secret=YOUR_SEND_SECRET
```

### توصیه امنیتی

استفاده از Header به شکل زیر توصیه می‌شود:

```text
Authorization: Bearer YOUR_SEND_SECRET
```

زیرا Secret در URL قرار نمی‌گیرد.

---

# 🔐 نکات امنیتی مهم

هرگز اطلاعات حساس را داخل `worker.js` قرار ندهید.

❌ اشتباه:

```js
const API_KEY = "123456789";
```

❌ اشتباه:

```js
const BOT_TOKEN = "123456:ABCDEF";
```

❌ اشتباه:

```js
const SEND_SECRET = "my-secret";
```

روش صحیح:

```js
env.BRS_API_KEY
env.TELEGRAM_BOT_TOKEN
env.SEND_SECRET
```

اطلاعات حساس باید فقط در Cloudflare Secrets ذخیره شوند.

---

# 🤖 تنظیم Telegram Bot

برای ارسال پیام به کانال:

1. یک Bot در Telegram ایجاد کنید.
2. Bot Token را دریافت کنید.
3. Bot را به کانال اضافه کنید.
4. به Bot اجازه ارسال پیام بدهید.
5. مقدار `TELEGRAM_BOT_TOKEN` را در Cloudflare تنظیم کنید.
6. مقدار `CHANNEL` را در `worker.js` به کانال خود تغییر دهید.

---

# 📢 کانال Telegram

در نسخه فعلی پروژه، کانال به‌صورت زیر تعریف شده است:

```
CHANNEL: "@PriceInstant"
```

و لینک کانال:

```
https://t.me/PriceInstant
```

اگر می‌خواهید پروژه را برای کانال دیگری استفاده کنید، مقدار زیر را تغییر دهید:

```
CHANNEL: "@YourChannel"
```

همچنین در صورت نیاز لینک کانال را تغییر دهید:

```
CHANNEL_URL: "https://t.me/YourChannel"
```

---

# ⏱️ تنظیم Cron

برای ارسال خودکار قیمت‌ها، Cron Trigger را در Cloudflare Worker فعال کنید.

تنظیم پیشنهادی:

```text
*/5 * * * *
```

یعنی Worker هر **۵ دقیقه** اجرا می‌شود.

جریان اجرای خودکار:

```text
Every 5 minutes
       │
       ▼
Cloudflare Cron
       │
       ▼
scheduled()
       │
       ▼
publishPrices()
       │
       ├── BRS API
       │
       ▼
Telegram
```

### مهم

Cron Trigger از طریق تنظیمات Cloudflare فعال می‌شود و صرفاً قرار داشتن تابع `scheduled()` در کد به‌تنهایی Cron را فعال نمی‌کند.

---

# 🌐 API Endpoints

Worker دارای سه Endpoint اصلی است.

---

## `/health`

برای بررسی وضعیت Worker:

```text
https://YOUR-WORKER.workers.dev/health
```

نمونه پاسخ:

```json
{
  "ok": true,
  "service": "PriceInstant",
  "channel": "@PriceInstant",
  "schedule": "Every 5 minutes",
  "time": "2026-08-28T00:00:00.000Z"
}
```

---

## `/prices`

برای دریافت اطلاعات بازار:

```text
https://YOUR-WORKER.workers.dev/prices
```

ساختار کلی پاسخ:

```json
{
  "ok": true,
  "gold": [],
  "currency": [],
  "cryptocurrency": []
}
```

---

## `/send`

برای ارسال دستی قیمت‌ها:

```text
https://YOUR-WORKER.workers.dev/send
```

اگر `SEND_SECRET` تنظیم شده باشد، باید احراز هویت انجام شود.

روش پیشنهادی:

```text
Authorization: Bearer YOUR_SEND_SECRET
```

نمونه پاسخ موفق:

```json
{
  "ok": true,
  "channel": "@PriceInstant",
  "message_id": 123
}
```

---

# 💰 ارزها

نسخه فعلی موارد زیر را نمایش می‌دهد:

| ارز              | Symbol   |
| ---------------- | -------- |
| 🇺🇸 دلار        | USD      |
| 🇪🇺 یورو        | EUR      |
| 🇦🇪 درهم امارات | AED      |
| 🇬🇧 پوند        | GBP      |
| 🇮🇶 دینار عراق  | IQD      |
| 🇹🇷 لیر ترکیه   | TRY      |
| 🇨🇳 یوان چین    | CNY      |
| 💵 تتر           | USDT_IRT |

قیمت این ارزها به تومان نمایش داده می‌شود.

---

# 🥇 طلا و سکه

| دارایی            | Symbol          |
| ----------------- | --------------- |
| 🥇 طلای ۱۸ عیار   | IR_GOLD_18K     |
| 🥇 طلای ۲۴ عیار   | IR_GOLD_24K     |
| 🥇 طلای آب‌شده    | IR_GOLD_MELTED  |
| 🌍 انس طلا        | XAUUSD          |
| 🪙 سکه امامی      | IR_COIN_EMAMI   |
| 🪙 سکه بهار آزادی | IR_COIN_BAHAR   |
| 🪙 نیم‌سکه        | IR_COIN_HALF    |
| 🪙 ربع‌سکه        | IR_COIN_QUARTER |
| 🪙 سکه یک گرمی    | IR_COIN_1G      |

قیمت طلا و سکه‌های داخلی به تومان نمایش داده می‌شود.

انس طلا با USD نمایش داده می‌شود.

---

# ₿ ارزهای دیجیتال

نسخه فعلی شامل:

| Cryptocurrency | Symbol |
| -------------- | ------ |
| Bitcoin        | BTC    |
| Ethereum       | ETH    |
| BNB            | BNB    |
| Solana         | SOL    |
| XRP            | XRP    |
| USDC           | USDC   |
| TRON           | TRX    |
| Dogecoin       | DOGE   |
| Cardano        | ADA    |
| Chainlink      | LINK   |

نام ارزهای دیجیتال به انگلیسی نمایش داده می‌شود تا ترتیب و ظاهر قیمت‌ها حفظ شود.

---

# 📈 درصد تغییر قیمت

در صورت وجود مقدار `change_percent` در API، درصد تغییر قیمت نیز نمایش داده می‌شود.

افزایش:

```text
🟢 +1.25%
```

کاهش:

```text
🔴 -1.25%
```

بدون تغییر:

```text
⚪ 0.00%
```

---

# 🕐 زمان ایران

زمان آخرین بروزرسانی با Timezone زیر نمایش داده می‌شود:

```text
Asia/Tehran
```

نمونه:

```text
🕐 آخرین بروزرسانی: ۱۴۰۵/۰۶/۰۶، ۰۳:۳۰
```

---

# 🧪 تست راه‌اندازی

بعد از Deploy، ابتدا:

```text
/health
```

را باز کنید.

اگر Worker درست اجرا شده باشد، باید پاسخ:

```json
{
  "ok": true
}
```

دریافت کنید.

سپس:

```text
/prices
```

را تست کنید.

اگر `BRS_API_KEY` صحیح باشد، اطلاعات بازار نمایش داده می‌شود.

در نهایت `/send` را تست کنید.

اگر `SEND_SECRET` تنظیم کرده‌اید:

```text
Authorization: Bearer YOUR_SEND_SECRET
```

را ارسال کنید.

---

# ❗ خطاهای متداول

## BRS_API_KEY is not configured

Secret زیر تنظیم نشده است:

```text
BRS_API_KEY
```

---

## TELEGRAM_BOT_TOKEN is not configured

Secret زیر تنظیم نشده است:

```text
TELEGRAM_BOT_TOKEN
```

---

## Unauthorized

اگر `/send` خطای:

```text
Unauthorized
```

می‌دهد، مقدار `SEND_SECRET` اشتباه است یا Header صحیح ارسال نشده است.

فرمت صحیح:

```text
Authorization: Bearer YOUR_SEND_SECRET
```

---

## BRS API HTTP Error

ممکن است:

* API Key نامعتبر باشد.
* API موقتاً در دسترس نباشد.
* محدودیت API اعمال شده باشد.
* Endpoint API تغییر کرده باشد.

---

## Telegram Forbidden / Bad Request

موارد زیر را بررسی کنید:

* Bot عضو کانال باشد.
* Bot اجازه ارسال پیام داشته باشد.
* `CHANNEL` صحیح باشد.
* Telegram Bot Token صحیح باشد.

---

# 🔧 شخصی‌سازی

تمام تنظیمات اصلی در ابتدای `worker.js` قرار دارند:

```js
const CONFIG = {
  CHANNEL: "@PriceInstant",
  CHANNEL_URL: "https://t.me/PriceInstant",
  API_URL:
    "https://api.brsapi.ir/Market/Gold_Currency.php",
  SCHEDULE: "Every 5 minutes",
  REQUEST_TIMEOUT: 15000,
};
```

می‌توانید:

* کانال را تغییر دهید.
* لینک کانال را تغییر دهید.
* متن پیام را تغییر دهید.
* ارزهای بیشتری اضافه کنید.
* رمزارزهای بیشتری اضافه کنید.
* دارایی‌های جدید اضافه کنید.
* ظاهر پیام Telegram را تغییر دهید.
* Timeout درخواست‌ها را تغییر دهید.

---

# 📁 Repository Structure

```text
PriceInstant/
└── worker.js
```

این Repository عمداً فقط شامل Worker است.

هیچ فایل زیر برای اجرای پروژه لازم نیست:

```text
package.json
node_modules/
Dockerfile
docker-compose.yml
requirements.txt
```

---

# ⚡ چرا Cloudflare Workers؟

Cloudflare Workers برای این پروژه مناسب است زیرا:

* بدون VPS اجرا می‌شود.
* نیاز به مدیریت سرور ندارد.
* Cron Trigger دارد.
* HTTP Request را مدیریت می‌کند.
* Secrets را می‌توان به‌صورت امن ذخیره کرد.
* برای یک Bot سبک معماری ساده‌ای دارد.
* نیاز به نصب نرم‌افزار روی سیستم کاربر ندارد.

---

# 🔒 توصیه امنیتی برای Deployment عمومی

اگر Worker شما روی اینترنت عمومی قرار دارد:

### توصیه می‌شود:

```text
BRS_API_KEY        → Required Secret
TELEGRAM_BOT_TOKEN → Required Secret
SEND_SECRET        → Recommended Secret
```

هیچ‌کدام را داخل GitHub Commit نکنید.

همچنین اگر `SEND_SECRET` تنظیم کرده‌اید، برای ارسال دستی از Header استفاده کنید:

```text
Authorization: Bearer YOUR_SEND_SECRET
```

و Secret را در URL قرار ندهید.

---

# 📌 خلاصه راه‌اندازی

برای راه‌اندازی سریع:

```text
1. Fork / Copy Repository
        ↓
2. Create Cloudflare Worker
        ↓
3. Copy worker.js
        ↓
4. Deploy
        ↓
5. Add BRS_API_KEY
        ↓
6. Add TELEGRAM_BOT_TOKEN
        ↓
7. Add SEND_SECRET
        ↓
8. Add Telegram Bot to Channel
        ↓
9. Configure CHANNEL
        ↓
10. Enable Cron: */5 * * * *
        ↓
11. Test /health
        ↓
12. Test /prices
        ↓
13. Test /send
        ↓
14. Done ✅
```

---

# ⚠️ Disclaimer

این پروژه صرفاً یک ابزار فنی برای دریافت و انتشار اطلاعات قیمت است.

اطلاعات قیمت از یک API شخص ثالث دریافت می‌شود و ممکن است با تأخیر، خطا یا قطعی مواجه شود.

قیمت‌های نمایش داده‌شده را قبل از استفاده برای تصمیمات مالی یا معاملاتی با منابع معتبر دیگر بررسی کنید.

توسعه‌دهنده این پروژه مسئولیتی در قبال صحت داده‌های ارائه‌شده توسط سرویس شخص ثالث یا تصمیمات مالی کاربران ندارد.

---

# ⭐ Support

اگر این پروژه برای شما مفید بود، می‌توانید Repository را ⭐ **Star** کنید.

Pull Request و پیشنهادهای بهبود نیز مورد استقبال هستند.

---

## 📊 PriceInstant

**Telegram:** `@PriceInstant`

**Cloudflare Worker + BRS API + Telegram Bot**

Made for simple, serverless market price publishing.
