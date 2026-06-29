"use strict";
const fs   = require("fs");
const path = require("path");

// ── Paths ────────────────────────────────────────────────────────────────────
// Read initial list from config.json (backwards-compatible).
// Runtime changes go to data/admins.json so we never touch config.json
// (touching it while running under `node --watch` restarts the process).
const CONFIG     = path.resolve(__dirname, "../config.json");
const ADMINS_FILE = path.resolve(__dirname, "../data/admins.json");

let _adminIDs = [];

function _load() {
  // 1. Base list from static config
  let base = [];
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG, "utf8"));
    base = (cfg.bot && cfg.bot.adminIDs ? cfg.bot.adminIDs : []).map(String);
  } catch {}

  // 2. Runtime overrides from data/admins.json (wins over config)
  if (fs.existsSync(ADMINS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(ADMINS_FILE, "utf8"));
      if (Array.isArray(data.adminIDs) && data.adminIDs.length > 0) {
        _adminIDs = data.adminIDs.map(String);
        return;  // runtime file takes precedence
      }
    } catch {}
  }

  _adminIDs = base;
}

function _save() {
  try {
    fs.mkdirSync(path.dirname(ADMINS_FILE), { recursive: true });
    fs.writeFileSync(ADMINS_FILE, JSON.stringify({ adminIDs: _adminIDs }, null, 2), "utf8");
  } catch {}
}

_load();

module.exports = {
  isAdmin(id)  { return _adminIDs.includes(String(id)); },
  isPrimary(id){ return _adminIDs[0] === String(id); },
  list()       { return [..._adminIDs]; },

  add(id) {
    const s = String(id).trim();
    if (!s) return false;
    if (_adminIDs.includes(s)) return false;
    _adminIDs.push(s);
    _save();
    return true;
  },

  remove(id) {
    const s = String(id).trim();
    const i = _adminIDs.indexOf(s);
    if (i <= 0) return false;   // 0 = primary admin — never remove
    _adminIDs.splice(i, 1);
    _save();
    return true;
  },

  reload() { _load(); },
};
