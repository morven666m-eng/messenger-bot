"use strict";

const config = require("../config.json");

// ─── Command registry ─────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    icon: "⚡",
    title: "عام",
    commands: [
      { cmd: "help",         aliases: "مساعدة",    desc: "عرض هذه القائمة" },
      { cmd: "uptime",       aliases: "up · stats", desc: "لوحة حالة البوت" },
    ],
  },
  {
    icon: "⚙️",
    title: "إدارة البوت",
    commands: [
      { cmd: "control",      aliases: "",           desc: "التحكم بإعدادات البوت" },
      { cmd: "lock",         aliases: "",           desc: "قفل البوت — مشرفون فقط" },
      { cmd: "restart",      aliases: "",           desc: "إعادة تشغيل البوت" },
      { cmd: "addadmin",     aliases: "",           desc: "ترقية عضو إلى مشرف (رد)" },
    ],
  },
  {
    icon: "✏️",
    title: "تخصيص المجموعة",
    commands: [
      { cmd: "rename",       aliases: "",           desc: "تغيير / قفل اسم المجموعة" },
      { cmd: "rename unlock",aliases: "",           desc: "رفع قفل الاسم" },
      { cmd: "nickname",     aliases: "",           desc: "تعيين / قفل / مسح الكنيات" },
      { cmd: "autoreply",    aliases: "",           desc: "إدارة الردود التلقائية" },
    ],
  },
  {
    icon: "📡",
    title: "حالة النظام",
    commands: [
      { cmd: "simstatus",    aliases: "",           desc: "حالة محاكي الإنسان" },
      { cmd: "cookiestatus", aliases: "",           desc: "حالة تحديث الكوكيز" },
    ],
  },
];

// ─── Box drawing helpers ──────────────────────────────────────────────────────
const W  = 38;                                 // inner width
const HL = "─".repeat(W);                     // horizontal line
const TL = "╔" + "═".repeat(W) + "╗";        // top
const BL = "╚" + "═".repeat(W) + "╝";        // bottom
const ML = "╠" + "═".repeat(W) + "╣";        // middle divider
const row = (text) => {
  // pad text to fill inner width (handles Arabic / mixed)
  const len  = [...text].length;               // codepoint length
  const pad  = Math.max(0, W - len - 1);
  return "║ " + text + " ".repeat(pad) + "║";
};
const blank = row("");

// ─── Builder ─────────────────────────────────────────────────────────────────
module.exports = {
  name:        "help",
  aliases:     ["مساعدة", "commands", "cmds"],
  description: "عرض قائمة الأوامر المتاحة.",
  usage:       "help",
  category:    "General",

  execute({ api, event }) {
    const { threadID } = event;
    const p    = config.prefix    || "-";
    const name = (config.bot?.name    || "TESLA").toUpperCase();
    const ver  =  config.bot?.version || "2.1.0";

    const lines = [];

    // ── Header ──────────────────────────────────────────────────────────────
    lines.push(TL);
    lines.push(row(`  ⚡  ${name}  •  v${ver}`));
    lines.push(row(`  📋  الأوامر المتاحة`));
    lines.push(ML);

    // ── Categories ──────────────────────────────────────────────────────────
    for (const cat of CATEGORIES) {
      // Category header
      lines.push(row(`${cat.icon}  ${cat.title}`));
      lines.push(row(HL));

      for (const { cmd, aliases, desc } of cat.commands) {
        const cmdStr  = (p + cmd).padEnd(16);
        const aliasHint = aliases ? ` (${aliases})` : "";
        lines.push(row(`  ${cmdStr}▸ ${desc}${aliasHint}`));
      }

      lines.push(blank);
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    lines.push("╠" + "═".repeat(W) + "╣");
    lines.push(row(`◆  البادئة : [ ${p} ]`));
    lines.push(row(`◆  مثال   : ${p}uptime`));
    lines.push(BL);

    api.sendMessage(lines.join("\n"), threadID);
  },
};
