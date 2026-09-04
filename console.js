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

  const SCROLL_MS = 1200;
  const IDLE_ROUNDS = 8;

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

  function usernameFromCell(cell) {
    const links = [...cell.querySelectorAll('a[href^="/"]')];
    for (const a of links) {
      const path = (a.getAttribute("href") || "").split("?")[0];
      const part = path.replace(/^\//, "").split("/")[0];
      if (
        part &&
        ![
          "home",
          "explore",
          "search",
          "i",
          "settings",
          "notifications",
          "messages",
          "compose",
          "intent"
        ].includes(part.toLowerCase())
      ) {
        return norm(part);
      }
    }
    return "";
  }

  function followsYou(cell) {
    if (cell.querySelector('[data-testid="userFollowIndicator"]')) return true;
    const t = (cell.innerText || "").toLowerCase();
    return (
      t.includes("follows you") ||
      t.includes("te sigue") ||
      t.includes("vous suit") ||
      t.includes("folgt dir") ||
      t.includes("segue você") ||
      t.includes("ti segue")
    );
  }

  function cells() {
    const found = [
      ...document.querySelectorAll('[data-testid="UserCell"]'),
      ...document.querySelectorAll('[data-testid="cellInnerDiv"]')
    ];
    return found.filter((el) => usernameFromCell(el));
  }

  async function scrape() {
    const map = new Map();
    let idle = 0;
    let last = 0;

    while (idle < IDLE_ROUNDS) {
      for (const cell of cells()) {
        const user = usernameFromCell(cell);
        if (!user) continue;
        map.set(user, {
          user,
          followsBack: followsYou(cell),
          url: "https://x.com/" + user
        });
      }
      if (map.size === last) idle += 1;
      else {
        idle = 0;
        last = map.size;
      }
      window.scrollTo(0, document.body.scrollHeight);
      console.log("Scanned", map.size, "accounts…");
      await sleep(SCROLL_MS);
    }
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
    const all = await scrape();

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
  })();
})();
