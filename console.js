/**
 * Keep / Review — read-only X following audit
 * Run on: https://x.com/YOUR_HANDLE/following
 * F12 → Console → allow pasting → paste this file → Enter
 * Does not follow, unfollow, like, or post.
 */
(() => {
  const KEEP = [
    // Public examples only. Put your private list in the prompt, not in git.
    // "bbcworld",
    // "nasa"
  ];

  const SCROLL_MS = 900;
  const IDLE_ROUNDS = 4;
  const MAX_MINUTES = 8;
  const PANEL_CLEAR_MS = 8000;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function norm(s) {
    return String(s || "")
      .trim()
      .replace(/^@/, "")
      .toLowerCase();
  }

  function parseKeep(extra) {
    const set = new Set(KEEP.map(norm).filter(Boolean));
    String(extra || "")
      .split(/[\s,]+/)
      .map(norm)
      .filter(Boolean)
      .forEach((x) => set.add(x));
    return set;
  }

  const SKIP = new Set([
    "home",
    "explore",
    "search",
    "i",
    "settings",
    "notifications",
    "messages",
    "compose",
    "intent",
    "tos",
    "privacy",
    "login",
    "signup",
    "following",
    "followers",
    "verified"
  ]);

  function usernameFromCell(cell) {
    const links = [...cell.querySelectorAll('a[href^="/"]')];
    for (const a of links) {
      const raw = (a.getAttribute("href") || "").split("?")[0].split("#")[0];
      const part = raw.replace(/^\//, "").split("/")[0];
      if (!part || SKIP.has(part.toLowerCase())) continue;
      if (!/^[A-Za-z0-9_]+$/.test(part)) continue;
      return norm(part);
    }
    return "";
  }

  function accountIdFromCell(cell) {
    const btn = cell.querySelector('[data-testid$="-unfollow"], [data-testid$="-follow"]');
    const testid = btn && btn.getAttribute("data-testid");
    if (!testid) return "";
    const id = testid.replace(/-(un)?follow$/i, "");
    return /^\d+$/.test(id) ? id : "";
  }

  function profileNameFromCell(cell, username) {
    const handle = norm(username);
    const links = [...cell.querySelectorAll('a[href^="/"]')];
    for (const a of links) {
      const raw = (a.getAttribute("href") || "").split("?")[0].split("#")[0];
      const part = raw.replace(/^\//, "").split("/")[0];
      if (norm(part) !== handle) continue;
      const label = (a.textContent || "").replace(/\s+/g, " ").trim();
      if (!label) continue;
      if (norm(label) === handle || label === "@" + username) continue;
      if (/^follows you$/i.test(label)) continue;
      return label;
    }
    const spans = [...cell.querySelectorAll("span")];
    for (const s of spans) {
      const label = (s.textContent || "").replace(/\s+/g, " ").trim();
      if (!label) continue;
      if (norm(label) === handle || label === "@" + username) continue;
      if (/follows you|follow|pending|following/i.test(label)) continue;
      if (label.length > 60) continue;
      return label;
    }
    return "";
  }

  function followsYou(cell) {
    if (cell.querySelector('[data-testid="userFollowIndicator"]')) return true;
    const nodes = cell.querySelectorAll("span, div");
    for (const n of nodes) {
      const t = (n.textContent || "").trim().toLowerCase();
      if (
        t === "follows you" ||
        t === "follow you" ||
        t === "te sigue" ||
        t === "vous suit" ||
        t === "folgt dir" ||
        t === "segue você" ||
        t === "ti segue"
      ) {
        return true;
      }
    }
    const t = (cell.innerText || "").toLowerCase();
    return /\bfollows you\b|\bte sigue\b|\bvous suit\b|\bfolgt dir\b/.test(t);
  }

  function cells() {
    return [
      ...document.querySelectorAll('[data-testid="UserCell"]'),
      ...document.querySelectorAll('[data-testid="cellInnerDiv"]')
    ];
  }

  function scrollRoot() {
    return (
      document.querySelector('[data-testid="primaryColumn"]') ||
      document.scrollingElement ||
      document.documentElement
    );
  }

  function harvest(map) {
    for (const cell of cells()) {
      const user = usernameFromCell(cell);
      if (!user) continue;
      const prev = map.get(user);
      const back = followsYou(cell);
      const name = profileNameFromCell(cell, user);
      const id = accountIdFromCell(cell);
      map.set(user, {
        id: (prev && prev.id) || id,
        name: (prev && prev.name) || name,
        user,
        followsBack: Boolean(prev && prev.followsBack) || back,
        url: "https://x.com/" + user
      });
    }
  }

  async function scrape(onProgress) {
    const map = new Map();
    let idle = 0;
    let last = 0;
    const started = Date.now();
    const root = scrollRoot();

   
