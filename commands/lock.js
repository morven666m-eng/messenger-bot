"use strict";

const fmt = require("../utils/fmt");

module.exports = {
  name:        "lock",
  aliases:     ["botlock"],
  description: "قفل البوت — يستجيب للمشرفين فقط.",
  usage:       "lock [on | off | status]",
  category:    "Admin",
  groupOnly:   true,
  adminOnly:   true,

  async execute({ api, event, args }) {
    const { threadID } = event;
    const sub      = (args[0] || "").toLowerCase();
    const isLocked = require("../state").lockedThreads.has(threadID);
    const { lockedThreads } = require("../state");

    // ── status ────────────────────────────────────────────────────────────────
    if (sub === "status" || sub === "حالة") {
      return api.sendMessage(
        [
          fmt.header(),
          "",
          fmt.row("حالة البوت", isLocked ? "مقفل 🔒" : "مفتوح 🔓", "🔒"),
          isLocked
            ? fmt.inf("البوت يستجيب للمشرفين فقط.")
            : fmt.inf("البوت يستجيب لجميع الأعضاء."),
        ].join("\n"),
        threadID
      );
    }

    // ── on ────────────────────────────────────────────────────────────────────
    if (sub === "on" || sub === "تفعيل") {
      if (isLocked) {
        return api.sendMessage(
          [fmt.header(), "", fmt.wrn("البوت مقفل بالفعل في هذه المجموعة.")].join("\n"),
          threadID
        );
      }
      lockedThreads.add(threadID);
      return api.sendMessage(
        [
          fmt.header(),
          "",
          fmt.ok("تم تفعيل قفل البوت. 🔒"),
          fmt.inf("البوت يستجيب للمشرفين فقط من الآن."),
          "",
          fmt.row("لإلغاء القفل", require("../config.json").prefix + "lock off", "🔓"),
        ].join("\n"),
        threadID
      );
    }

    // ── off ───────────────────────────────────────────────────────────────────
    if (sub === "off" || sub === "إلغاء") {
      if (!isLocked) {
        return api.sendMessage(
          [fmt.header(), "", fmt.wrn("البوت غير مقفل في هذه المجموعة.")].join("\n"),
          threadID
        );
      }
      lockedThreads.delete(threadID);
      return api.sendMessage(
        [
          fmt.header(),
          "",
          fmt.ok("تم إلغاء قفل البوت. 🔓"),
          fmt.inf("يمكن لجميع الأعضاء استخدام الأوامر الآن."),
        ].join("\n"),
        threadID
      );
    }

    // ── no arg → toggle ──────────────────────────────────────────────────────
    if (!sub) {
      const prefix = require("../config.json").prefix;
      if (isLocked) {
        lockedThreads.delete(threadID);
        return api.sendMessage(
          [
            fmt.header(),
            "",
            fmt.ok("تم إلغاء قفل البوت. 🔓"),
            fmt.inf("يمكن لجميع الأعضاء استخدام الأوامر الآن."),
          ].join("\n"),
          threadID
        );
      }
      lockedThreads.add(threadID);
      return api.sendMessage(
        [
          fmt.header(),
          "",
          fmt.ok("تم تفعيل قفل البوت. 🔒"),
          fmt.inf("البوت يستجيب للمشرفين فقط من الآن."),
          "",
          fmt.row("لإلغاء القفل", prefix + "lock off", "🔓"),
        ].join("\n"),
        threadID
      );
    }

    // ── unknown sub ───────────────────────────────────────────────────────────
    const prefix = require("../config.json").prefix;
    return api.sendMessage(
      [
        fmt.header(),
        "",
        fmt.row("تبديل",  prefix + "lock",        "🔄"),
        fmt.row("تفعيل",  prefix + "lock on",      "🔒"),
        fmt.row("إلغاء",  prefix + "lock off",     "🔓"),
        fmt.row("الحالة", prefix + "lock status",  "📊"),
      ].join("\n"),
      threadID
    );
  },
};
