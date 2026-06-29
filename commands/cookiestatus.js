"use strict";

const fs             = require("fs");
const path           = require("path");
const fmt            = require("../utils/fmt");
const cookieRefresher = require("../utils/cookieRefresher");

function ago(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return "منذ " + s + " ثانية";
  if (s < 3600) return "منذ " + Math.floor(s / 60) + " دقيقة";
  return "منذ " + Math.floor(s / 3600) + " ساعة";
}

function fileAge(mtimeMs) {
  const sec = Math.floor((Date.now() - mtimeMs) / 1000);
  if (sec < 60)   return sec + " ثانية";
  if (sec < 3600) return Math.floor(sec / 60) + " دقيقة";
  return Math.floor(sec / 3600) + " ساعة";
}

module.exports = {
  name:        "cookiestatus",
  aliases:     ["cookies", "cs", "كوكيز"],
  description: "حالة الكوكيز وجاهزية الجلسة.",
  usage:       "cookiestatus",
  category:    "Admin",
  adminOnly:   true,

  async execute({ api, event }) {
    const { threadID } = event;
    const s = cookieRefresher.status();

    const appStatePath = path.resolve(__dirname, "../appstate.json");
    let cookieAge   = "—";
    let cookieCount = "—";
    try {
      const stat = fs.statSync(appStatePath);
      cookieAge   = fileAge(stat.mtimeMs) + " مضت";
      const data  = JSON.parse(fs.readFileSync(appStatePath, "utf8"));
      cookieCount = Array.isArray(data) ? String(data.length) : "—";
    } catch {}

    const lastPush = s.lastPushAt ? ago(s.lastPushAt) : "لم يتم بعد";

    const lines = [
      fmt.header(),
      "",
      fmt.row("التجديد التلقائي", s.active ? "نشط 🟢"   : "متوقف 🔴", "🍪"),
      fmt.row("عدد الكوكيز",      cookieCount,                           "📦"),
      fmt.row("آخر تعديل",        cookieAge,                             "🕐"),
      "",
      fmt.divider("─"),
      "",
      fmt.row("مرات الحفظ",  String(s.pushCount),          "⬆️"),
      fmt.row("كل",          s.intervalMinutes + " دقيقة", "🔄"),
      fmt.row("آخر رفع",     lastPush,                      "📡"),
      fmt.row("الأخطاء",     String(s.errorCount),          "❌"),
      "",
      fmt.inf("لتحديث الكوكيز: افتح صفحة /cookies"),
    ];

    return api.sendMessage(lines.join("\n"), threadID);
  },
};
