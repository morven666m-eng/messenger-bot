"use strict";
/**
 * fmt.js — Shared formatting helpers (Tesla theme).
 *
 *   ╔══[ ⚡ TESLA  •  v2.1.0 ]══╗
 *   ╚═══════════════════════════╝
 *   ◆ LABEL·······▸  value
 *   ══════════════════════════════
 */

const config = require("../config.json");

// ── Header ────────────────────────────────────────────────────────────────────
function header(subtitle) {
  const name = (config.bot?.name || "TESLA").toUpperCase();
  const ver  =  config.bot?.version || "2.1.0";
  const top  = `╔══[ ⚡ ${name}  •  v${ver} ]══╗`;
  const bot  = `╚${"═".repeat(top.length - 2)}╝`;
  if (subtitle) return `${top}\n║  ${subtitle}\n${bot}`;
  return `${top}\n${bot}`;
}

// ── Separators ────────────────────────────────────────────────────────────────
function divider(char) { return (char || "═").repeat(33); }
function thin()        { return "─".repeat(33); }

// ── Rows ──────────────────────────────────────────────────────────────────────
function row(label, value, icon) {
  const ic  = icon ? icon + " " : "◆ ";
  const lbl = (label + " ").padEnd(12, "·");
  return `${ic}${lbl}▸  ${value}`;
}

// ── Section title ─────────────────────────────────────────────────────────────
function section(title) { return `\n【 ${title} 】`; }

// ── Status helpers ────────────────────────────────────────────────────────────
const ok  = (msg) => `✅  ${msg}`;
const err = (msg) => `✗  ${msg}`;
const wrn = (msg) => `⚠️  ${msg}`;
const inf = (msg) => `◆  ${msg}`;

/** Status badge — ✅ label (on) or ❌ label (off) */
function badge(label, on) {
  return on ? `✅  ${label}` : `❌  ${label}`;
}

/**
 * Quick panel — clean bordered block.
 *
 * panel("🔒 قفل البوت", [
 *   ["الحالة",  "مفعّل"],
 *   ["المجموعة",".."],
 * ])
 */
function panel(title, rows) {
  const W    = 35;
  const line = "─".repeat(W);
  const lines = [`┌─ ${title} ${"─".repeat(Math.max(0, W - [...title].length - 3))}┐`];
  lines.push("│");
  for (const [k, v] of rows) {
    const label = (k + " ").padEnd(14, "·");
    lines.push(`│  ${label}  ${v}`);
  }
  lines.push("│");
  lines.push(`└${"─".repeat(W + 2)}┘`);
  return lines.join("\n");
}

// ── Uptime ────────────────────────────────────────────────────────────────────
function uptime(sec) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600)  / 60);
  const s = sec % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

const LINE = "═════════════════════════════════";
const THIN = "─────────────────────────────────";

module.exports = {
  header, divider, thin, row, section,
  ok, err, wrn, inf, badge, panel, uptime,
  LINE, THIN,
};
