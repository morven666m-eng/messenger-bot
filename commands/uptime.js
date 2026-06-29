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
  bg:      "#02050f",
  cyan:    "#00d4ff",
  green:   "#00ff99",
  amber:   "#ffb300",
  purple:  "#b06aff",
  white:   "#e8f4ff",
  dimText: "#2a4060",
  mid:     "#4a6a88",
  gridLn:  "rgba(0,180,255,0.06)",
  surface: "rgba(0,20,50,0.55)",
};

const RINGS = [
  { color: C.cyan,   label: "SEC",  max: 60  },
  { color: C.green,  label: "MIN",  max: 60  },
  { color: C.amber,  label: "HRS",  max: 24  },
  { color: C.purple, label: "DAYS", max: 30  },
];

function font(sz, bold = true) {
  return (bold ? "bold " : "") + sz + "px JBMono, monospace";
}
function pad(n) { return String(n).padStart(2, "0"); }

// ── Helpers ───────────────────────────────────────────────────────────────────
function drawGrid(ctx, W, H) {
  ctx.strokeStyle = C.gridLn;
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

function drawCorner(ctx, x, y, dx, dy, color) {
  const len = 20;
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + dx * len, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + dy * len);
  ctx.stroke();
}

function drawRing(ctx, cx, cy, r, frac, color, thick) {
  const start = -Math.PI / 2;
  // Track
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = thick;
  ctx.stroke();
  // Arc
  if (frac > 0) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur  = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, start + frac * Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth   = thick;
    ctx.lineCap     = "round";
    ctx.stroke();
    ctx.restore();
  }
  // Dot at arc tip
  if (frac > 0) {
    const angle = start + frac * Math.PI * 2;
    const dx = cx + r * Math.cos(angle);
    const dy = cy + r * Math.sin(angle);
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = 20;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(dx, dy, thick / 2 + 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawCrosshair(ctx, cx, cy, R) {
  ctx.strokeStyle = "rgba(0,200,255,0.12)";
  ctx.lineWidth = 1;
  // Horizontal
  ctx.beginPath(); ctx.moveTo(cx - R - 20, cy); ctx.lineTo(cx + R + 20, cy); ctx.stroke();
  // Vertical
  ctx.beginPath(); ctx.moveTo(cx, cy - R - 20); ctx.lineTo(cx, cy + R + 20); ctx.stroke();
  // Small tick marks
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r0 = R + 8, r1 = R + 16;
    ctx.beginPath();
    ctx.moveTo(cx + r0 * Math.cos(a), cy + r0 * Math.sin(a));
    ctx.lineTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a));
    ctx.stroke();
  }
}

function drawStatRow(ctx, x, y, w, label, value, color) {
  // Row background
  ctx.fillStyle = "rgba(0,30,60,0.6)";
  ctx.beginPath();
  ctx.roundRect(x, y, w, 48, 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,180,255,0.12)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Left color tab
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y + 8, 3, 32, 1.5);
  ctx.fill();

  // Label
  ctx.fillStyle = C.mid;
  ctx.font = font(8, false);
  ctx.textAlign = "left";
  ctx.fillText(label.toUpperCase(), x + 14, y + 20);

  // Value
  ctx.fillStyle = color;
  ctx.font = font(18);
  ctx.fillText(value, x + 14, y + 42);
}

function drawStatusBadge(ctx, cx, y, label, color) {
  const bW = 110, bH = 26, bX = cx - bW / 2;
  ctx.fillStyle = color + "22";
  ctx.beginPath(); ctx.roundRect(bX, y, bW, bH, 13); ctx.fill();
  ctx.strokeStyle = color + "88"; ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = font(10);
  ctx.textAlign = "center";
  ctx.fillText("● " + label, cx, y + bH / 2 + 4);
}

// ── Main card builder ─────────────────────────────────────────────────────────
async function buildCard(info) {
  const W = 900, H = 500;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext("2d");

  // ── Background ─────────────────────────────────────────────────────────────
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  drawGrid(ctx, W, H);

  // Radial vignette (edges darker)
  const vig = ctx.createRadialGradient(W/2, H/2, 100, W/2, H/2, W * 0.75);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.65)");
  ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

  // Outer border
  ctx.strokeStyle = "rgba(0,160,255,0.2)"; ctx.lineWidth = 1.5;
  ctx.strokeRect(1, 1, W - 2, H - 2);

  // Corner marks
  const cc = "rgba(0,200,255,0.5)";
  drawCorner(ctx,  2,   2,  1,  1, cc);
  drawCorner(ctx, W-2,  2, -1,  1, cc);
  drawCorner(ctx,  2,  H-2, 1, -1, cc);
  drawCorner(ctx, W-2, H-2,-1, -1, cc);

  // ═══════════════════════════════════════════════════════════════════════════
  // CIRCULAR HUD (center of canvas)
  // ═══════════════════════════════════════════════════════════════════════════
  const cx = W / 2, cy = H / 2;

  // Outer glow halo
  const halo = ctx.createRadialGradient(cx, cy, 120, cx, cy, 240);
  halo.addColorStop(0, "rgba(0,180,255,0.08)");
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);

  drawCrosshair(ctx, cx, cy, 175);

  // 4 rings  (inner → outer: secs, mins, hrs, days)
  const values = [info.secs, info.mins, info.hours, info.days];
  const radii  = [80, 108, 136, 164];
  const thick  = [10, 10, 10, 10];

  for (let i = 0; i < 4; i++) {
    const frac  = Math.min(values[i] / RINGS[i].max, 1);
    drawRing(ctx, cx, cy, radii[i], frac, RINGS[i].color, thick[i]);
  }

  // Center circle fill
  ctx.fillStyle = "rgba(0,10,30,0.85)";
  ctx.beginPath(); ctx.arc(cx, cy, 66, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(0,180,255,0.15)"; ctx.lineWidth = 1;
  ctx.stroke();

  // Center: big time string
  const upStr = pad(info.days) + ":" + pad(info.hours) + ":" + pad(info.mins) + ":" + pad(info.secs);
  ctx.save();
  ctx.shadowColor = C.cyan; ctx.shadowBlur = 16;
  ctx.fillStyle = C.white;
  ctx.font = font(18);
  ctx.textAlign = "center";
  ctx.fillText(upStr, cx, cy - 6);
  ctx.restore();

  ctx.fillStyle = C.dimText;
  ctx.font = font(7, false);
  ctx.textAlign = "center";
  ctx.fillText("DD : HH : MM : SS", cx, cy + 12);

  // Status badge under circle
  drawStatusBadge(ctx, cx, cy + 82, "ONLINE", C.green);

  // Ring legend (below arc on each side)
  const legendItems = [
    { label: "SECS",  color: C.cyan,   lx: cx + 185, ly: cy + 64 },
    { label: "MINS",  color: C.green,  lx: cx + 185, ly: cy + 84 },
    { label: "HRS",   color: C.amber,  lx: cx + 185, ly: cy + 104 },
    { label: "DAYS",  color: C.purple, lx: cx + 185, ly: cy + 124 },
  ];
  for (const { label, color, lx, ly } of legendItems) {
    // color dot
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(lx - 12, ly - 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.mid;
    ctx.font = font(9, false);
    ctx.textAlign = "left";
    ctx.fillText(label, lx, ly);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEFT PANEL — Bot identity
  // ═══════════════════════════════════════════════════════════════════════════
  const LP = 24;

  // Bot name
  ctx.save();
  ctx.shadowColor = C.cyan; ctx.shadowBlur = 10;
  ctx.fillStyle = C.cyan;
  ctx.font = font(22);
  ctx.textAlign = "left";
  ctx.fillText((info.botName || "TESLA").toUpperCase(), LP, 58);
  ctx.restore();

  // Version
  ctx.fillStyle = C.dimText;
  ctx.font = font(10, false);
  ctx.fillText("VERSION  " + info.version, LP, 78);

  // Thin separator
  ctx.strokeStyle = "rgba(0,200,255,0.15)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(LP, 92); ctx.lineTo(LP + 180, 92); ctx.stroke();

  // Prefix
  ctx.fillStyle = C.mid;
  ctx.font = font(9, false);
  ctx.fillText("PREFIX", LP, 112);
  ctx.fillStyle = C.white;
  ctx.font = font(20);
  ctx.fillText("[  " + info.prefix + "  ]", LP, 138);

  // Platform
  ctx.fillStyle = C.mid;
  ctx.font = font(9, false);
  ctx.fillText("PLATFORM", LP, 166);
  ctx.fillStyle = C.green;
  ctx.font = font(13);
  ctx.fillText(info.platform.toUpperCase(), LP, 184);

  // Node version
  ctx.fillStyle = C.mid;
  ctx.font = font(9, false);
  ctx.fillText("NODE.JS", LP, 208);
  ctx.fillStyle = C.amber;
  ctx.font = font(13);
  ctx.fillText(process.version, LP, 226);

  // ═══════════════════════════════════════════════════════════════════════════
  // RIGHT PANEL — Stats
  // ═══════════════════════════════════════════════════════════════════════════
  const RP = W - 220;
  const statW = 196;
  const gap   = 10;
  const stats = [
    { label: "RAM Usage",     value: info.memMB + " MB",    color: C.amber  },
    { label: "Active Groups", value: String(info.groups),   color: C.cyan   },
    { label: "Commands",      value: String(info.commands), color: C.purple },
    { label: "Admins",        value: String(info.admins),   color: C.green  },
  ];

  stats.forEach(({ label, value, color }, i) => {
    drawStatRow(ctx, RP, 56 + i * (48 + gap), statW, label, value, color);
  });

  // RAM usage bar inside first stat
  const memFrac = Math.min(info.memMB / 512, 1);
  const barX = RP + 14, barY = 56 + 2 + (48 + gap) * 0 + 44;
  // (no extra bar — value already displayed)

  // Locked row
  const lockY = 56 + 4 * (48 + gap);
  ctx.fillStyle = "rgba(0,30,60,0.6)";
  ctx.beginPath(); ctx.roundRect(RP, lockY, statW, 48, 6); ctx.fill();
  ctx.strokeStyle = info.locked > 0
    ? "rgba(255,50,70,0.3)"
    : "rgba(0,180,255,0.12)";
  ctx.lineWidth = 1; ctx.stroke();

  const lockColor = info.locked > 0 ? "#ff4455" : C.dimText;
  ctx.fillStyle = lockColor;
  ctx.beginPath(); ctx.roundRect(RP, lockY + 8, 3, 32, 1.5); ctx.fill();
  ctx.fillStyle = C.mid;
  ctx.font = font(8, false); ctx.textAlign = "left";
  ctx.fillText("LOCKED GROUPS", RP + 14, lockY + 20);
  ctx.fillStyle = lockColor;
  ctx.font = font(18);
  ctx.fillText(String(info.locked), RP + 14, lockY + 42);
  // lock icon
  ctx.font = font(16, false);
  ctx.fillStyle = lockColor;
  ctx.textAlign = "right";
  ctx.fillText(info.locked > 0 ? "🔒" : "🔓", RP + statW - 12, lockY + 34);

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════════════
  const fY = H - 28;
  ctx.strokeStyle = "rgba(0,180,255,0.1)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(24, fY); ctx.lineTo(W - 24, fY); ctx.stroke();

  const now = new Date().toLocaleString("en-GB", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    day: "numeric",  month: "short",    year: "numeric",
  });
  ctx.fillStyle = C.dimText;
  ctx.font = font(8, false);
  ctx.textAlign = "center";
  ctx.fillText(now + "  ·  " + (info.botName || "TESLA").toUpperCase() + " v" + info.version, W / 2, fY + 16);

  return canvas.toBuffer("image/png");
}

// ── Command export ────────────────────────────────────────────────────────────
module.exports = {
  name:        "uptime",
  aliases:     ["up", "stats"],
  description: "لوحة حالة البوت — HUD دائري.",
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
      api.sendMessage(
        `⚡ ${info.botName} v${info.version}\n` +
        `🕐 Uptime : ${days}d ${hours}h ${mins}m ${secs}s\n` +
        `💾 RAM    : ${memMB} MB\n` +
        `👥 Groups : ${groups}  |  🔒 Locked: ${locked}\n` +
        `📋 Cmds   : ${cmdCount}  |  🛡 Admins: ${admins}`,
        event.threadID
      );
    } finally {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  },
};
