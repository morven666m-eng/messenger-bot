"use strict";

const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const fs     = require("fs");
const os     = require("os");
const path   = require("path");
const config = require("../config.json");

try {
  GlobalFonts.registerFromPath(
    path.join(__dirname, "../assets/JetBrainsMono-Bold.ttf"), "JBMono"
  );
} catch {}

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:        "#080b10",
  surface:   "#0d1117",
  card:      "#111622",
  border:    "#1c2333",
  borderAcc: "#e8263c",
  red:       "#e8263c",
  redDim:    "#7a0f1a",
  redGlow:   "rgba(232,38,60,0.18)",
  cyan:      "#38bdf8",
  green:     "#22d3a4",
  amber:     "#fbbf24",
  purple:    "#a78bfa",
  text:      "#e2e8f0",
  textDim:   "#4b5a72",
  textMid:   "#8899aa",
  white:     "#ffffff",
};

// ── Font helpers ──────────────────────────────────────────────────────────────
const F = {
  bold:  (sz) => `bold ${sz}px JBMono, monospace`,
  reg:   (sz) => `${sz}px JBMono, monospace`,
};

function pad(n) { return String(n).padStart(2, "0"); }

// ── Rounded rect ─────────────────────────────────────────────────────────────
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function drawBar(ctx, x, y, w, h, pct, color, bg) {
  ctx.fillStyle = bg || "#0a0e14";
  rrect(ctx, x, y, w, h, h / 2); ctx.fill();
  if (pct > 0) {
    ctx.fillStyle = color;
    rrect(ctx, x, y, Math.max(h, w * Math.min(pct, 1)), h, h / 2); ctx.fill();
  }
}

// ── Glowing dot ──────────────────────────────────────────────────────────────
function drawDot(ctx, cx, cy, r, color) {
  ctx.shadowColor = color; ctx.shadowBlur = 14;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

// ── Time segment panel ────────────────────────────────────────────────────────
function drawTimePanel(ctx, x, y, w, h, value, label) {
  // card bg
  ctx.fillStyle = C.card;
  rrect(ctx, x, y, w, h, 10); ctx.fill();

  // top accent line
  ctx.fillStyle = C.red;
  rrect(ctx, x + 10, y, w - 20, 3, 1.5); ctx.fill();

  // border
  ctx.strokeStyle = C.border; ctx.lineWidth = 1;
  rrect(ctx, x, y, w, h, 10); ctx.stroke();

  // value
  ctx.shadowColor = C.red; ctx.shadowBlur = 20;
  ctx.fillStyle = C.text;
  ctx.font = F.bold(48);
  ctx.textAlign = "center";
  ctx.fillText(value, x + w / 2, y + h / 2 + 14);
  ctx.shadowBlur = 0;

  // label
  ctx.fillStyle = C.textDim;
  ctx.font = F.reg(10);
  ctx.fillText(label, x + w / 2, y + h - 12);
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function drawStatCard(ctx, x, y, w, h, label, value, color, barPct) {
  // bg
  ctx.fillStyle = C.card;
  rrect(ctx, x, y, w, h, 8); ctx.fill();
  ctx.strokeStyle = C.border; ctx.lineWidth = 1;
  rrect(ctx, x, y, w, h, 8); ctx.stroke();

  // left color bar
  ctx.fillStyle = color;
  rrect(ctx, x, y + 10, 3, h - 20, 1.5); ctx.fill();

  // label
  ctx.fillStyle = C.textDim;
  ctx.font = F.reg(9);
  ctx.textAlign = "left";
  ctx.fillText(label.toUpperCase(), x + 14, y + 20);

  // value
  ctx.fillStyle = value === "—" ? C.textDim : color;
  ctx.font = F.bold(20);
  ctx.fillText(value, x + 14, y + 46);

  // optional mini bar
  if (barPct !== undefined) {
    drawBar(ctx, x + 14, y + h - 18, w - 28, 5, barPct, color);
  }
}

// ── Main card builder ─────────────────────────────────────────────────────────
async function buildCard(info) {
  const W = 860, H = 480;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext("2d");

  // ── Background ─────────────────────────────────────────────────────────────
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle red radial accent (top-left)
  const grd = ctx.createRadialGradient(0, 0, 10, 0, 0, 340);
  grd.addColorStop(0, "rgba(232,38,60,0.09)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

  // Outer border
  ctx.strokeStyle = C.border; ctx.lineWidth = 1.5;
  rrect(ctx, 1, 1, W - 2, H - 2, 14); ctx.stroke();

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER  (y: 0 → 60)
  // ═══════════════════════════════════════════════════════════════════════════
  ctx.fillStyle = C.surface;
  rrect(ctx, 1, 1, W - 2, 60, 14); ctx.fill();
  // bottom separator
  ctx.strokeStyle = C.border; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(1, 61); ctx.lineTo(W - 1, 61); ctx.stroke();

  // Online dot
  drawDot(ctx, 28, 30, 6, C.red);

  // Bot name
  ctx.fillStyle = C.text;
  ctx.font = F.bold(15);
  ctx.textAlign = "left";
  ctx.fillText((info.botName || "TESLA").toUpperCase(), 46, 36);

  // Status chip — center
  const chipW = 90, chipH = 26, chipX = (W - chipW) / 2, chipY = 17;
  ctx.fillStyle = C.redGlow;
  rrect(ctx, chipX, chipY, chipW, chipH, 13); ctx.fill();
  ctx.strokeStyle = C.redDim; ctx.lineWidth = 1;
  rrect(ctx, chipX, chipY, chipW, chipH, 13); ctx.stroke();
  ctx.fillStyle = C.red;
  ctx.font = F.bold(11);
  ctx.textAlign = "center";
  ctx.fillText("● ONLINE", chipX + chipW / 2, chipY + chipH / 2 + 4);

  // Right: version + lock icon
  ctx.fillStyle = C.textDim;
  ctx.font = F.reg(11);
  ctx.textAlign = "right";
  ctx.fillText("v" + info.version, W - 20, 36);

  // Lock indicator
  const lockCol = info.locked > 0 ? C.red : C.textDim;
  ctx.fillStyle = lockCol;
  ctx.font = F.reg(14);
  ctx.textAlign = "right";
  ctx.fillText(info.locked > 0 ? "🔒" : "🔓", W - 72, 38);

  // ═══════════════════════════════════════════════════════════════════════════
  // UPTIME PANELS  (y: 75 → 210)
  // ═══════════════════════════════════════════════════════════════════════════
  const panW = 138, panH = 100, panGap = 18;
  const totalW = 4 * panW + 3 * panGap;
  const upX0   = (W - totalW) / 2;
  const upY    = 76;

  // Section label
  ctx.fillStyle = C.textDim;
  ctx.font = F.reg(9);
  ctx.textAlign = "left";
  ctx.fillText("UPTIME", 24, 72);
  // thin rule
  ctx.strokeStyle = C.border; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(70, 68); ctx.lineTo(W - 24, 68); ctx.stroke();

  const segs = [
    { v: pad(info.days),  l: "DAYS"    },
    { v: pad(info.hours), l: "HOURS"   },
    { v: pad(info.mins),  l: "MINUTES" },
    { v: pad(info.secs),  l: "SECONDS" },
  ];

  segs.forEach(({ v, l }, i) => {
    const px = upX0 + i * (panW + panGap);
    drawTimePanel(ctx, px, upY, panW, panH, v, l);

    // colon separator
    if (i < 3) {
      ctx.fillStyle = C.border;
      ctx.font = F.bold(28);
      ctx.textAlign = "center";
      ctx.fillText(":", px + panW + panGap / 2, upY + panH / 2 + 10);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // STATS GRID  (y: 198 → 440)
  // ═══════════════════════════════════════════════════════════════════════════
  const gridY   = 196;
  const cardH   = 80;
  const cols    = 4;
  const cardGap = 10;
  const cardW   = (W - 48 - cardGap * (cols - 1)) / cols;

  // Section label
  ctx.fillStyle = C.textDim;
  ctx.font = F.reg(9);
  ctx.textAlign = "left";
  ctx.fillText("SYSTEM", 24, gridY - 6);
  ctx.strokeStyle = C.border; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(68, gridY - 10); ctx.lineTo(W - 24, gridY - 10); ctx.stroke();

  // Row 1 cards
  const r1 = [
    { label: "RAM Usage",      value: info.memMB + " MB",     color: C.amber,  barPct: info.memMB / 512 },
    { label: "Active Groups",  value: String(info.groups),    color: C.cyan,   barPct: undefined },
    { label: "Commands",       value: String(info.commands),  color: C.purple, barPct: undefined },
    { label: "Locked Groups",  value: String(info.locked),    color: info.locked > 0 ? C.red : C.textDim, barPct: undefined },
  ];

  r1.forEach(({ label, value, color, barPct }, i) => {
    const cx = 24 + i * (cardW + cardGap);
    drawStatCard(ctx, cx, gridY, cardW, cardH, label, value, color, barPct);
  });

  // Row 2 cards
  const gridY2 = gridY + cardH + cardGap;
  const r2 = [
    { label: "Prefix",   value: info.prefix,   color: C.textMid },
    { label: "Platform", value: info.platform,  color: C.green   },
    { label: "Admins",   value: String(info.admins), color: C.amber },
    { label: "Node.js",  value: process.version, color: C.cyan  },
  ];

  r2.forEach(({ label, value, color }, i) => {
    const cx = 24 + i * (cardW + cardGap);
    drawStatCard(ctx, cx, gridY2, cardW, cardH, label, value, color);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════════════
  const footerY = H - 36;
  ctx.strokeStyle = C.border; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(24, footerY); ctx.lineTo(W - 24, footerY); ctx.stroke();

  const now = new Date().toLocaleString("en-GB", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    day: "numeric",  month: "short",    year: "numeric",
  });
  ctx.fillStyle = C.textDim;
  ctx.font = F.reg(9);
  ctx.textAlign = "center";
  ctx.fillText(now + "  ·  " + (info.botName || "TESLA").toUpperCase() + " v" + info.version, W / 2, footerY + 18);

  return canvas.toBuffer("image/png");
}

// ── Command export ────────────────────────────────────────────────────────────
module.exports = {
  name:        "uptime",
  aliases:     ["up", "stats"],
  description: "لوحة حالة البوت كصورة.",
  usage:       "uptime",
  category:    "General",

  async execute({ api, event, commands }) {
    const total = Math.floor(process.uptime());
    const days  = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const mins  = Math.floor((total % 3600) / 60);
    const secs  = total % 60;
    const memMB = Math.round(process.memoryUsage().rss / 1024 / 1024);

    let groups = 0, locked = 0;
    try {
      const state = require("../state");
      groups = state.groupsCache.size;
      locked = state.lockedThreads.size;
    } catch {}

    const cmdCount = commands ? [...new Set(commands.values())].length : 0;
    const admins   = Array.isArray(config.bot?.adminIDs) ? config.bot.adminIDs.length : 0;

    const info = {
      botName:  config.bot?.name    || "TESLA",
      version:  config.bot?.version || "2.1.0",
      prefix:   config.prefix       || "-",
      days, hours, mins, secs,
      memMB, groups, locked,
      commands: cmdCount,
      admins,
      platform: os.platform(),
    };

    const tmpFile = path.join(os.tmpdir(), "uptime_" + Date.now() + ".png");
    try {
      const buf = await buildCard(info);
      fs.writeFileSync(tmpFile, buf);
      await api.sendMessage(
        { body: "", attachment: [fs.createReadStream(tmpFile)] },
        event.threadID
      );
    } catch {
      // Text fallback
      api.sendMessage(
        `⚡ ${info.botName} v${info.version}\n` +
        `🕐 Uptime : ${days}d ${hours}h ${mins}m ${secs}s\n` +
        `💾 RAM    : ${memMB} MB\n` +
        `👥 Groups : ${groups}  |  🔒 Locked: ${locked}\n` +
        `📋 Commands: ${cmdCount}  |  🛡 Admins: ${admins}`,
        event.threadID
      );
    } finally {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  },
};
