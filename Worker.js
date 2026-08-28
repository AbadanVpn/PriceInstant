```javascript
/**
 * PriceInstant
 * Telegram Market Price Bot
 *
 * Cloudflare Worker
 *
 * Features:
 * - Gold prices
 * - Currency prices
 * - Cryptocurrency prices
 * - Automatic Telegram publishing
 * - Cloudflare Cron support
 *
 * Required Secrets:
 * - BRS_API_KEY
 * - TELEGRAM_BOT_TOKEN
 *
 * Optional Secret:
 * - SEND_SECRET
 *
 * Cron:
 * - Every 5 minutes
 */

const CONFIG = {
  CHANNEL: "@PriceInstant",
  CHANNEL_URL: "https://t.me/PriceInstant",

  API_URL:
    "https://api.brsapi.ir/Market/Gold_Currency.php",

  SCHEDULE: "Every 5 minutes",

  REQUEST_TIMEOUT: 15000,
};


// ============================================================
// WORKER
// ============================================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ========================================================
    // HEALTH
    // ========================================================

    if (url.pathname === "/health") {
      return json({
        ok: true,
        service: "PriceInstant",
        channel: CONFIG.CHANNEL,
        schedule: CONFIG.SCHEDULE,
        time: new Date().toISOString(),
      });
    }


    // ========================================================
    // PRICES
    // ========================================================

    if (url.pathname === "/prices") {
      try {
        const data = await getMarketData(env);

        return json({
          ok: true,
          gold: data.gold,
          currency: data.currency,
          cryptocurrency: data.cryptocurrency,
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error: safeErrorMessage(error),
          },
          500
        );
      }
    }


    // ========================================================
    // SEND
    // ========================================================

    if (url.pathname === "/send") {
      if (!isAuthorizedSendRequest(request, env)) {
        return json(
          {
            ok: false,
            error: "Unauthorized.",
          },
          401
        );
      }

      try {
        const result = await publishPrices(env);

        return json({
          ok: true,
          ...result,
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error: safeErrorMessage(error),
          },
          500
        );
      }
    }


    // ========================================================
    // DEFAULT
    // ========================================================

    return new Response(
      "PriceInstant Worker is running.",
      {
        status: 200,
        headers: {
          "content-type":
            "text/plain; charset=UTF-8",
        },
      }
    );
  },


  // ==========================================================
  // CRON
  // ==========================================================

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      publishPrices(env)
        .then((result) => {
          console.log(
            "PriceInstant sent:",
            JSON.stringify(result)
          );
        })
        .catch((error) => {
          console.error(
            "PriceInstant error:",
            safeErrorMessage(error)
          );
        })
    );
  },
};


// ============================================================
// AUTHORIZATION
// ============================================================

function isAuthorizedSendRequest(request, env) {
  /*
   * If SEND_SECRET is not configured, /send remains available.
   *
   * For a public deployment it is strongly recommended
   * to configure SEND_SECRET.
   *
   * Supported:
   *
   * Authorization: Bearer YOUR_SEND_SECRET
   *
   * OR:
   *
   * ?secret=YOUR_SEND_SECRET
   */

  if (!env.SEND_SECRET) {
    return true;
  }

  const authorization =
    request.headers.get("Authorization");

  if (authorization) {
    const prefix = "Bearer ";

    if (authorization.startsWith(prefix)) {
      const token =
        authorization.slice(prefix.length).trim();

      if (token === env.SEND_SECRET) {
        return true;
      }
    }
  }

  const url = new URL(request.url);

  const querySecret =
    url.searchParams.get("secret");

  return querySecret === env.SEND_SECRET;
}


// ============================================================
// BRS API
// ============================================================

async function getMarketData(env) {
  if (!env.BRS_API_KEY) {
    throw new Error(
      "BRS_API_KEY is not configured."
    );
  }

  const apiUrl =
    `${CONFIG.API_URL}?key=${encodeURIComponent(
      env.BRS_API_KEY
    )}`;

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      CONFIG.REQUEST_TIMEOUT
    );

  let response;

  try {
    response = await fetch(apiUrl, {
      method: "GET",

      headers: {
        Accept: "application/json",
        "User-Agent":
          "PriceInstant-Worker/3.0",
      },

      signal: controller.signal,

      cf: {
        cacheTtl: 0,
        cacheEverything: false,
      },
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        "BRS API request timed out."
      );
    }

    throw new Error(
      `BRS API request failed: ${
        error?.message || "Unknown error"
      }`
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(
      `BRS API HTTP ${response.status}`
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "BRS API returned invalid JSON."
    );
  }

  if (
    !data ||
    !Array.isArray(data.gold) ||
    !Array.isArray(data.currency) ||
    !Array.isArray(
      data.cryptocurrency
    )
  ) {
    throw new Error(
      "Invalid BRS API response."
    );
  }

  return data;
}


// ============================================================
// PUBLISH
// ============================================================

async function publishPrices(env) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is not configured."
    );
  }

  const data =
    await getMarketData(env);

  const message =
    buildMessage(data);

  const telegram =
    await sendTelegram(
      env.TELEGRAM_BOT_TOKEN,
      CONFIG.CHANNEL,
      message
    );

  return {
    channel: CONFIG.CHANNEL,
    message_id:
      telegram.result?.message_id || null,
  };
}


// ============================================================
// BUILD MESSAGE
// ============================================================

function buildMessage(data) {
  const gold =
    bySymbol(data.gold);

  const currency =
    bySymbol(data.currency);

  const crypto =
    bySymbol(data.cryptocurrency);

  const lines = [];


  // ========================================================
  // HEADER
  // ========================================================

  lines.push(
    "📊 <b>قیمت لحظه‌ای بازار</b>"
  );

  lines.push(
    "━━━━━━━━━━━━━━━━"
  );


  // ========================================================
  // CURRENCY
  // ========================================================

  lines.push("");
  lines.push("💵 <b>ارز</b>");
  lines.push("");

  addToman(
    lines,
    "🇺🇸 دلار",
    currency.USD
  );

  addToman(
    lines,
    "🇪🇺 یورو",
    currency.EUR
  );

  addToman(
    lines,
    "🇦🇪 درهم امارات",
    currency.AED
  );

  addToman(
    lines,
    "🇬🇧 پوند",
    currency.GBP
  );

  addToman(
    lines,
    "🇮🇶 دینار عراق",
    currency.IQD
  );

  addToman(
    lines,
    "🇹🇷 لیر ترکیه",
    currency.TRY
  );

  addToman(
    lines,
    "🇨🇳 یوان چین",
    currency.CNY
  );

  addToman(
    lines,
    "💵 تتر",
    currency.USDT_IRT
  );


  // ========================================================
  // GOLD
  // ========================================================

  lines.push("");
  lines.push(
    "━━━━━━━━━━━━━━━━"
  );

  lines.push(
    "🥇 <b>طلا و سکه</b>"
  );

  lines.push("");

  addToman(
    lines,
    "🥇 طلای ۱۸ عیار",
    gold.IR_GOLD_18K
  );

  addToman(
    lines,
    "🥇 طلای ۲۴ عیار",
    gold.IR_GOLD_24K
  );

  addToman(
    lines,
    "🥇 طلای آب‌شده",
    gold.IR_GOLD_MELTED
  );

  addDollar(
    lines,
    "🌍 انس طلا",
    gold.XAUUSD
  );

  addToman(
    lines,
    "🪙 سکه امامی",
    gold.IR_COIN_EMAMI
  );

  addToman(
    lines,
    "🪙 سکه بهار آزادی",
    gold.IR_COIN_BAHAR
  );

  addToman(
    lines,
    "🪙 نیم‌سکه",
    gold.IR_COIN_HALF
  );

  addToman(
    lines,
    "🪙 ربع‌سکه",
    gold.IR_COIN_QUARTER
  );

  addToman(
    lines,
    "🪙 سکه یک گرمی",
    gold.IR_COIN_1G
  );


  // ========================================================
  // CRYPTOCURRENCY
  // ========================================================

  lines.push("");
  lines.push(
    "━━━━━━━━━━━━━━━━"
  );

  lines.push(
    "₿ <b>ارزهای دیجیتال</b>"
  );

  lines.push("");

  addDollar(
    lines,
    "₿ Bitcoin",
    crypto.BTC
  );

  addDollar(
    lines,
    "♦️ Ethereum",
    crypto.ETH
  );

  addDollar(
    lines,
    "🟡 BNB",
    crypto.BNB
  );

  addDollar(
    lines,
    "🟣 Solana",
    crypto.SOL
  );

  addDollar(
    lines,
    "💧 XRP",
    crypto.XRP
  );

  addDollar(
    lines,
    "🔵 USDC",
    crypto.USDC
  );

  addDollar(
    lines,
    "🔺 TRON",
    crypto.TRX
  );

  addDollar(
    lines,
    "🐕 Dogecoin",
    crypto.DOGE
  );

  addDollar(
    lines,
    "🔷 Cardano",
    crypto.ADA
  );

  addDollar(
    lines,
    "🔗 Chainlink",
    crypto.LINK
  );


  // ========================================================
  // FOOTER
  // ========================================================

  lines.push("");
  lines.push(
    "━━━━━━━━━━━━━━━━"
  );

  lines.push(
    `🕐 <b>آخرین بروزرسانی:</b> ${iranTime()}`
  );

  lines.push("");

  lines.push(
    `📈 <a href="${CONFIG.CHANNEL_URL}">PriceInstant</a>`
  );

  return lines.join("\n");
}


// ============================================================
// INDEX BY SYMBOL
// ============================================================

function bySymbol(items) {
  const result = {};

  for (const item of items || []) {
    if (!item || !item.symbol) {
      continue;
    }

    const symbol =
      String(item.symbol)
        .trim()
        .toUpperCase();

    result[symbol] = item;
  }

  return result;
}


// ============================================================
// TOMAN PRICE
// ============================================================

function addToman(
  lines,
  title,
  item
) {
  if (!item) {
    return;
  }

  const price =
    Number(item.price);

  if (!Number.isFinite(price)) {
    return;
  }

  lines.push(
    `${title}: <b>${formatNumber(
      price
    )}</b> تومان ${change(item)}`
  );
}


// ============================================================
// DOLLAR PRICE
// ============================================================

function addDollar(
  lines,
  title,
  item
) {
  if (!item) {
    return;
  }

  const price =
    Number(item.price);

  if (!Number.isFinite(price)) {
    return;
  }

  lines.push(
    `${title}: <b>$${formatUSD(
      price
    )}</b> ${change(item)}`
  );
}


// ============================================================
// CHANGE
// ============================================================

function change(item) {
  const value =
    Number(
      item?.change_percent
    );

  if (!Number.isFinite(value)) {
    return "";
  }

  if (value > 0) {
    return `🟢 +${value.toFixed(2)}%`;
  }

  if (value < 0) {
    return `🔴 ${value.toFixed(2)}%`;
  }

  return "⚪ 0.00%";
}


// ============================================================
// NUMBER FORMAT
// ============================================================

function formatNumber(value) {
  return new Intl.NumberFormat(
    "fa-IR",
    {
      maximumFractionDigits: 0,
    }
  ).format(value);
}


// ============================================================
// USD FORMAT
// ============================================================

function formatUSD(value) {
  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 8,
    }
  ).format(value);
}


// ============================================================
// IRAN TIME
// ============================================================

function iranTime() {
  return new Intl.DateTimeFormat(
    "fa-IR",
    {
      timeZone:
        "Asia/Tehran",

      year: "numeric",
      month: "2-digit",
      day: "2-digit",

      hour: "2-digit",
      minute: "2-digit",

      hour12: false,
    }
  ).format(new Date());
}


// ============================================================
// TELEGRAM
// ============================================================

async function sendTelegram(
  token,
  channel,
  text
) {
  const url =
    `https://api.telegram.org/bot${token}/sendMessage`;

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      CONFIG.REQUEST_TIMEOUT
    );

  let response;

  try {
    response = await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        chat_id: channel,
        text,

        parse_mode: "HTML",

        disable_web_page_preview:
          true,
      }),

      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        "Telegram request timed out."
      );
    }

    throw new Error(
      `Telegram request failed: ${
        error?.message || "Unknown error"
      }`
    );
  } finally {
    clearTimeout(timeout);
  }

  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      `Telegram returned invalid JSON (HTTP ${response.status})`
    );
  }

  if (
    !response.ok ||
    !data.ok
  ) {
    throw new Error(
      data.description ||
      `Telegram HTTP ${response.status}`
    );
  }

  return data;
}


// ============================================================
// ERROR MESSAGE
// ============================================================

function safeErrorMessage(error) {
  if (!error) {
    return "Unknown error.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}


// ============================================================
// JSON RESPONSE
// ============================================================

function json(
  data,
  status = 200
) {
  return new Response(
    JSON.stringify(
      data,
      null,
      2
    ),
    {
      status,

      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",

        "Cache-Control":
          "no-store",
      },
    }
  );
}
```
