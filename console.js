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
    const t = (cell.innerText || "").toLowerCase();
    return /\bfollows you\b|\bte sigue\b|\bvous suit\b|\bfolgt dir\b|\bsegue você\b|\bti segue\b/.test(t);
  }

  function cells() {
    const found = document.querySelectorAll('[data-testid="UserCell"]');
    if (found.length) return [...found];
    return [...document.querySelectorAll('[data-testid="cellInnerDiv"]')];
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

    while (idle < IDLE_ROUNDS && Date.now() - started < MAX_MINUTES * 60 * 1000) {
      harvest(map);
      onProgress(map.size);

      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;

      if (map.size === last) {
        idle += 1;
        if (!atBottom) {
          window.scrollBy(0, window.innerHeight * 0.9);
          root.scrollTop += Math.floor((root.clientHeight || 600) * 0.9);
        }
      } else {
        idle = 0;
        last = map.size;
        window.scrollBy(0, window.innerHeight * 0.85);
        root.scrollTop += Math.floor((root.clientHeight || 600) * 0.85);
      }

      await sleep(SCROLL_MS);
    }

    harvest(map);
    return [...map.values()];
  }

  function csv(rows) {
    const head = "account_id,profile_name,username,follows_back,profile_url";
    const body = rows
      .map((r) =>
        [r.id || "", r.name || "", r.user, r.followsBack ? "yes" : "no", r.url]
          .map((v) => '"' + String(v).replace(/"/g, '""') + '"')
          .join(",")
      )
      .join("\n");
    return head + "\n" + body;
  }

  function download(name, rows) {
    const blob = new Blob([csv(rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  }

  function idList(rows) {
    return rows
      .map((r) => r.id || r.user)
      .filter(Boolean)
      .join(",");
  }

  function removePanel() {
    const el = document.getElementById("keep-review-panel");
    if (el) el.remove();
  }

  function panel(text) {
    let el = document.getElementById("keep-review-panel");
    if (!el) {
      el = document.createElement("div");
      el.id = "keep-review-panel";
      el.style.cssText =
        "position:fixed;z-index:999999;right:16px;bottom:16px;max-width:360px;background:#111;color:#eee;padding:12px 14px;border-radius:10px;font:13px/1.4 system-ui;box-shadow:0 8px 24px #0008;cursor:pointer";
      el.title = "Click to dismiss";
      el.addEventListener("click", removePanel);
      document.body.appendChild(el);
    }
    el.textContent = text;
  }

  (async () => {
    if (!/\/following\/?$/.test(location.pathname)) {
      console.warn("Open your Following page first: x.com/<handle>/following");
      panel("Open x.com/<handle>/following then paste again.");
      return;
    }

    const extra = window.prompt(
      "Keep list (optional). Comma-separated @handles you follow on purpose.\nLeave empty if none.",
      ""
    );
    const keepSet = parseKeep(extra);

    panel("Scrolling following list… keep this tab in front.");
    const all = await scrape((n) => {
      panel("Scanned " + n + " accounts… keep this tab in front.");
    });

    const mutuals = all.filter((a) => a.followsBack);
    const oneWay = all.filter((a) => !a.followsBack);
    const keep = oneWay.filter((a) => keepSet.has(a.user));
    const review = oneWay.filter((a) => !keepSet.has(a.user));

    console.log(
      "Done.",
      all.length,
      "following /",
      mutuals.length,
      "mutuals /",
      keep.length,
      "keep /",
      review.length,
      "review"
    );

    download("mutuals.csv", mutuals);
    download("keep.csv", keep);
    download("review.csv", review);

    panel(
      "Done. " +
        all.length +
        " following · " +
        mutuals.length +
        " mutuals · " +
        keep.length +
        " keep · " +
        review.length +
        " review. Click to dismiss."
    );
    setTimeout(removePanel, PANEL_CLEAR_MS);

    window.prompt(
      "Review account IDs (copy, then OK/Cancel). Blank IDs fall back to username.",
      idList(review)
    );
  })();
})();
