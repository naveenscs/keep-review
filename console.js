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
  const IDLE_ROUNDS = 18;
  const MAX_MINUTES = 8;

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
    const roots = [
      ...document.querySelectorAll('[data-testid="UserCell"]'),
      ...document.querySelectorAll('[data-testid="cellInnerDiv"]')
    ];
    const unique = [];
    const seen = new Set();
    for (const el of roots) {
      const user = usernameFromCell(el);
      if (!user || seen.has(el)) continue;
      seen.add(el);
      unique.push(el);
    }
    return unique;
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
      map.set(user, {
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

      if (map.size === last) {
        idle += 1;
        root.scrollTop = Math.max(0, root.scrollTop - 400);
        window.scrollBy(0, -400);
        await sleep(400);
        window.scrollBy(0, window.innerHeight * 0.9);
        root.scrollTop += Math.floor((root.clientHeight || 600) * 0.9);
      } else {
        idle = 0;
        last = map.size;
        window.scrollBy(0, window.innerHeight * 0.85);
        root.scrollTop += Math.floor((root.clientHeight || 600) * 0.85);
      }

      const more = [...document.querySelectorAll("span, div")].find((n) =>
        /^(retry|try again|see more|show more)$/i.test((n.textContent || "").trim())
      );
      if (more) more.click();

      await sleep(SCROLL_MS);
    }

    harvest(map);
    return [...map.values()];
  }

  function csv(rows) {
    const head = "username,follows_back,profile_url";
    const body = rows
      .map((r) =>
        [r.user, r.followsBack ? "yes" : "no", r.url]
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

  function panel(text) {
    let el = document.getElementById("keep-review-panel");
    if (!el) {
      el = document.createElement("div");
      el.id = "keep-review-panel";
      el.style.cssText =
        "position:fixed;z-index:999999;right:16px;bottom:16px;max-width:360px;background:#111;color:#eee;padding:12px 14px;border-radius:10px;font:13px/1.4 system-ui;box-shadow:0 8px 24px #0008";
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
      console.log("Scanned", n, "accounts…");
      panel("Scanned " + n + " accounts… keep this tab in front.");
    });

    const mutuals = all.filter((a) => a.followsBack);
    const oneWay = all.filter((a) => !a.followsBack);
    const keep = oneWay.filter((a) => keepSet.has(a.user));
    const review = oneWay.filter((a) => !keepSet.has(a.user));

    console.log("Following scanned:", all.length);
    console.log("Mutuals:", mutuals.length, mutuals.map((a) => a.user));
    console.log("Keep (one-way, protected):", keep.length, keep.map((a) => a.user));
    console.log("Review (one-way, not in keep):", review.length, review.map((a) => a.user));

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
        " review. CSVs downloaded."
    );

    if (all.length < 50) {
      console.warn(
        "Scan looks short. Reload /following, keep the tab visible, allow multiple downloads, run again."
      );
    }
  })();
})();
