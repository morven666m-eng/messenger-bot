"use strict";

const fmt            = require("../utils/fmt");
const humanSimulator = require("../utils/humanSimulator");

function timeAgo(ms) {
  if (!ms) return "لم يبدأ بعد";
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 60)   return "منذ " + sec + " ث";
  if (sec < 3600) return "منذ " + Math.floor(sec / 60) + " دق";
  return "منذ " + Math.floor(sec / 3600) + "س " + Math.floor((sec % 3600) / 60) + "د";
}

function elapsed(ms) {
  if (!ms) return "—";
  const sec = Math.floor((Date.now() - ms) / 1000);
  const h   = Math.floor(sec / 3600);
  const m   = Math.floor((sec % 3600) / 60);
  const s   = sec % 60;
  if (h > 0) return h + "س " + m + "د";
  if (m > 0) return m + "د " + s + "ث";
  return s + "ث";
}

const ACTION_LABELS = {
  presence:      "💚 إشارة تواجد",
  typing:        "⌨️  كتابة",
  markRead:      "👁️  قراءة محادثة",
  browse:        "📂 تصفح دفعة",
  reels:         "🎬 تصفح الرئيسية",
  profileView:   "👤 زيارة ملف",
  inboxScroll:   "📥 تصفح الصندوق",
  historyScroll: "📜 قراءة تاريخ",
};

module.exports = {
  name:        "simstatus",
  aliases:     ["sim", "محاكي"],
  description: "حالة محاكي الإنسان — إحصائيات anti-detection.",
  usage:       "simstatus",
  category:    "Admin",
  adminOnly:   true,

  async execute({ api, event }) {
    const { threadID } = event;
    const s  = humanSimulator.status();
    const st = s.stats;

    const lastAction = ACTION_LABELS[st.lastActionType] || st.lastActionType || "—";

    const lines = [
      fmt.header(),
      "",
      fmt.row("الحالة",       s.running ? "يعمل 🟢" : "متوقف 🔴", "🤖"),
      fmt.row("وقت التشغيل",  elapsed(st.startedAt),               "⏱️"),
      "",
      fmt.divider("─"),
      "  📊  الإحصائيات",
      fmt.divider("─"),
      "",
      fmt.row("تواجد",         String(st.presenceSent),             "💚"),
      fmt.row("كتابة",         String(st.typingSimulated),          "⌨️"),
      fmt.row("محادثات مقروءة",String(st.threadsRead),             "👁️"),
      fmt.row("تصفح دفعات",    String(st.browseSessions),          "📂"),
      fmt.row("صندوق",         String(st.inboxScrolls  || 0),      "📥"),
      fmt.row("تاريخ",         String(st.historyScrolls || 0),     "📜"),
      fmt.row("رئيسية",        String(st.reelsSessions),           "🎬"),
      fmt.row("ملفات زُيرت",  String(st.profileViews),             "👤"),
      "",
      fmt.inf("آخر نشاط : " + lastAction),
      fmt.inf(timeAgo(st.lastActionAt)),
    ];

    return api.sendMessage(lines.join("\n"), threadID);
  },
};
