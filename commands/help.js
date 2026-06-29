"use strict";

const config = require("../config.json");

// ─── Command registry ─────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    icon: "⚡",
    title: "عام",
    commands: [
      { cmd: "help",          aliases: "مساعدة",    desc: "عرض هذه القائمة" },
      { cmd: "uptime",        aliases: "up · stats", desc: "لوحة حالة البوت" },
    ],
  },
  {
    icon: "⚙️",
    title: "إدارة البوت",
    commands: [
      { cmd: "control",       aliases: "",           desc: "التحكم بإعدادات البوت" },
      { cmd: "lock",          aliases: "",           desc: "قفل البوت — مشرفون فقط" },
      { cmd: "restart",       aliases: "",           desc: "إعادة تشغيل البوت" },
      { cmd: "addadmin",      aliases: "",           desc: "ترقية عضو إلى مشرف" },
    ],
  },
  {
    icon: "✏️",
    title: "تخصيص المجموعة",
    commands: [
      { cmd: "rename",        aliases: "",           desc: "تغيير / قفل اسم المجموعة" },
      { cmd: "rename unlock", aliases: "",           desc: "رفع قفل الاسم" },
      { cmd: "nickname",      aliases: "",           desc: "تعيين / قفل / مسح الكنيات" },
      { cmd: "autoreply",     aliases: "",           desc: "إدارة الردود التلقائية" },
    ],
  },
  {
    icon: "📡",
    title: "حالة النظام",
    commands: [
      { cmd: "simstatus",     aliases: "",           desc: "حالة محاكي الإنسان" },
      { cmd: "cookiestatus",  aliases: "",           desc: "حالة تحديث الكوكيز" },
    ],
  },
];

// ─── Box helpers ──────────────────────────────────────────────────────────────
// INNER is the number of characters between the two vertical bars (║ ... ║).
// Every helper produces exactly INNER visible characters of content.
const INNER = 36;

const TOP = "╔" + "═".repeat(INNER + 2) + "╗";   // ╔══...══╗
const BOT = "╚" + "═".repeat(INNER + 2) + "╝";   // ╚══...══╝
const MID = "╠" + "═".repeat(INNER + 2) + "╣";   // ╠══...══╣
const SEP = "║ " + "─".repeat(INNER) + " ║";      // ║ ────── ║  (thin rule)

/**
 * Wrap one line of text inside the frame.
 * Pads or clips to exactly INNER visible characters.
 * Uses codePoint length so emoji / Arabic don't throw off the count.
 */
function row(text) {
  // Clip at INNER chars (codepoints), then right-pad with spaces.
  const pts  = [...text];
  const clipped = pts.slice(0, INNER).join("");
  const pad    = Math.max(0, INNER - pts.length);
  return "║ " + clipped + " ".repeat(pad) + " ║";
}

const BLANK = row("");

// ─── Builder ─────────────────────────────────────────────────────────────────
module.exports = {
  name:        "help",
  aliases:     ["مساعدة", "commands", "cmds"],
  description: "عرض قائمة الأوامر المتاحة.",
  usage:       "help",
  category:    "General",

  execute({ api, event }) {
    const { threadID } = event;
    const p    = config.prefix        || "-";
    const name = (config.bot?.name    || "TESLA").toUpperCase();
    const ver  =  config.bot?.version || "2.1.0";

    const lines = [];

    // ── Header ──────────────────────────────────────────────────────────────
    lines.push(TOP);
    lines.push(row(`  ⚡  ${name}  •  v${ver}`));
    lines.push(row(`  📋  الأوامر المتاحة`));
    lines.push(MID);

    // ── Categories ──────────────────────────────────────────────────────────
    for (const cat of CATEGORIES) {
      // Category heading
      lines.push(row(`${cat.icon}  ${cat.title}`));
      lines.push(SEP);                           // thin rule — always exact width

      for (const { cmd, aliases, desc } of cat.commands) {
        const cmdStr  = (p + cmd).padEnd(15);    // fixed-width command column
        const aliasHint = aliases ? ` (${aliases})` : "";
        const content = `  ${cmdStr}▸ ${desc}${aliasHint}`;
        lines.push(row(content));                // row() clips if too long
      }

      lines.push(BLANK);
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    lines.push(MID);
    lines.push(row(`◆  البادئة : [ ${p} ]`));
    lines.push(row(`◆  مثال   : ${p}uptime`));
    lines.push(BOT);

    api.sendMessage(lines.join("\n"), threadID);
  },
};
