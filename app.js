(function () {
  const state = {
    following: [],
    followers: [],
    keepText: "",
    buckets: null
  };

  const $ = (id) => document.getElementById(id);

  function normalizeKey(value) {
    if (value == null) return "";
    return String(value).trim().replace(/^@/, "").toLowerCase();
  }

  function extractAccounts(text) {
    const cleaned = String(text)
      .replace(/^\uFEFF/, "")
      .replace(/^[\s\S]*?=\s*/, "")
      .replace(/;\s*$/, "")
      .trim();

    let data;
    try {
      data = JSON.parse(cleaned);
    } catch (err) {
      throw new Error("Could not parse file. Use following.js / follower.js from the official X archive.");
    }

    if (!Array.isArray(data)) {
      if (Array.isArray(data.following)) data = data.following;
      else if (Array.isArray(data.follower)) data = data.follower;
      else if (Array.isArray(data.followers)) data = data.followers;
      else throw new Error("File JSON did not contain a list.");
    }

    const out = [];
    const seen = new Set();

    for (const row of data) {
      const node = row.following || row.follower || row.followers || row;
      const id = node.accountId || node.account_id || node.userId || node.user_id || node.id;
      const handle =
        node.screenName ||
        node.screen_name ||
        node.username ||
        node.handle ||
        node.userName;
      const link =
        node.userLink ||
        node.user_link ||
        (id ? "https://x.com/intent/user?user_id=" + encodeURIComponent(id) : handle ? "https://x.com/" + encodeURIComponent(handle) : "");

      const keys = [id, handle].map(normalizeKey).filter(Boolean);
      if (!keys.length) continue;
      const primary = keys[0];
      if (seen.has(primary)) continue;
      seen.add(primary);
      out.push({
        id: id ? String(id) : "",
        handle: handle ? String(handle).replace(/^@/, "") : "",
        link,
        keys
      });
    }
    return out;
  }

  function parseKeep(text) {
    const set = new Set();
    String(text || "")
      .split(/\r?\n/)
      .map((line) => line.replace(/#.*$/, "").trim())
      .filter(Boolean)
      .forEach((line) => set.add(normalizeKey(line)));
    return set;
  }

  function accountMatchesKeep(account, keepSet) {
    return account.keys.some((k) => keepSet.has(k));
  }

  function diff() {
    const followerKeys = new Set();
    state.followers.forEach((a) => a.keys.forEach((k) => followerKeys.add(k)));
    const keepSet = parseKeep(state.keepText + "\n" + ($("keepText").value || ""));

    const mutuals = [];
    const keep = [];
    const review = [];

    for (const acc of state.following) {
      const followsBack = acc.keys.some((k) => followerKeys.has(k));
      if (followsBack) mutuals.push(acc);
      else if (accountMatchesKeep(acc, keepSet)) keep.push(acc);
      else review.push(acc);
    }

    state.buckets = { mutuals, keep, review };
    render();
  }

  function csvFor(list) {
    const header = "id,handle,profile_url";
    const rows = list.map((a) =>
      [a.id, a.handle, a.link].map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(",")
    );
    return header + "\n" + rows.join("\n");
  }

  function download(name, list) {
    const blob = new Blob([csvFor(list)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function render() {
    const b = state.buckets;
    if (!b) return;
    $("stats").hidden = false;
    $("actions").hidden = false;
    $("nFollowing").textContent = state.following.length;
    $("nFollowers").textContent = state.followers.length;
    $("nMutuals").textContent = b.mutuals.length;
    $("nKeep").textContent = b.keep.length;
    $("nReview").textContent = b.review.length;

    const rows = b.review
      .slice(0, 500)
      .map((a) => {
        const label = a.handle || a.id || "(unknown)";
        const href = a.link || "#";
        return `<tr><td>${escapeHtml(a.id)}</td><td>${escapeHtml(a.handle)}</td><td><a href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(label)}</a></td></tr>`;
      })
      .join("");

    $("reviewTable").innerHTML =
      "<table><thead><tr><th>ID</th><th>Handle</th><th>Profile</th></tr></thead><tbody>" +
      (rows || "<tr><td colspan='3'>Nothing in review.</td></tr>") +
      "</tbody></table>" +
      (b.review.length > 500 ? "<p>Showing first 500. Download CSV for the rest.</p>" : "");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function readFile(input, kind) {
    $("error").textContent = "";
    const file = input.files && input.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      if (kind === "keep") {
        state.keepText = text;
        $("keepStatus").innerHTML = '<span class="ok">Loaded ' + file.name + "</span>";
      } else {
        const accounts = extractAccounts(text);
        state[kind] = accounts;
        $(kind + "Status").innerHTML =
          '<span class="ok">Loaded ' + accounts.length + " accounts from " + file.name + "</span>";
      }
      if (state.following.length && state.followers.length) diff();
      else if (kind === "keep" && state.buckets) diff();
    } catch (err) {
      $("error").textContent = err.message;
    }
  }

  $("followingFile").addEventListener("change", (e) => readFile(e.target, "following"));
  $("followerFile").addEventListener("change", (e) => readFile(e.target, "followers"));
  $("keepFile").addEventListener("change", (e) => readFile(e.target, "keep"));
  $("keepText").addEventListener("input", () => {
    if (state.following.length && state.followers.length) diff();
  });

  document.getElementById("actions").addEventListener("click", (e) => {
    const key = e.target.getAttribute("data-dl");
    if (!key || !state.buckets) return;
    download(key, state.buckets[key]);
  });
})();
