# Meant to Follow

GitHub repo name: `keep-review`

Read-only audit of who you follow on X.

Most tools dump everyone who does not follow back.
This one splits that list:

- **Mutuals** — they follow you back
- **Keep** — they do not follow back, but you follow them on purpose
- **Review** — they do not follow back, and you did not mark them as keep

It does not follow, unfollow, like, or post.
It does not use the X API.
Do not put your X archive or your private keep list in this repository.

There are two ways to run it:

1. **Live console mode** (`console.js`) — use this first. Reads your Following page while you are logged into X.
2. **Archive page** (`index.html`) — optional. You drop official X archive files onto a local or GitHub Pages tab. It cannot read your live X account.

---

## Live console mode

Use this when you want a live list from your Following page.

### What you need

- A desktop browser (Chrome, Edge, Firefox, Brave)
- You logged into X
- This file: [`console.js`](./console.js)

Phones do not have a usable console.

### Where you type keep handles

After the script starts, the **browser** shows a popup (`prompt`).

That popup is the keep list.

- Type handles there, separated by commas or spaces
- With or without `@`
- Example: `nasa bbcworld example_account`
- Click OK
- If you want no keep list, leave it empty and click OK

Do **not** type handles in:

- the GitHub README
- the GitHub file (except empty examples)
- X search
- the address bar

Your real keep list stays in that popup (or in a private file on your computer). It should not be committed to git.

### Steps to run

1. Open X on a computer and log in.
2. Go to your Following page:
   `https://x.com/YOUR_HANDLE/following`
3. Reload the page once (F5) so the list is fresh.
4. Open Developer Tools:
   - Windows / Linux: `F12` or `Ctrl + Shift + I`
   - Mac: `Cmd + Option + I`
5. Click the **Console** tab.
6. If the console says you must allow pasting, type exactly:
   `allow pasting`
   Then press Enter.
7. Open [`console.js`](./console.js), click **Raw**, copy the whole file, paste it into the X console, press Enter.
8. When the popup appears, type the handles you want to **keep** (or leave it blank) and click OK.
9. Leave that X tab in front. The page will scroll by itself for a couple of minutes.
10. When it finishes, your Downloads folder should contain:
    - `mutuals.csv`
    - `keep.csv`
    - `review.csv`
11. Open **review.csv** yourself if you want to unfollow anyone. This script will not unfollow.

### What the three files mean

| File | Meaning |
|---|---|
| `mutuals.csv` | You follow them and they follow you |
| `keep.csv` | You follow them, they do not follow you, handle was in the popup |
| `review.csv` | You follow them, they do not follow you, handle was not in the popup |

CSV columns: `account_id`, `profile_name`, `username`, `follows_back`, `profile_url`.  
`account_id` can be blank. `keep.csv` is empty if you left the popup blank.

### How to clean up after the script

The script only adds a small status box on the X page. It does not install anything and it does not stay logged into GitHub.

Do this when you see **Done** and the CSVs have downloaded:

1. **Status box on the page**
   - Click the black box to dismiss it, or
   - Wait about 8 seconds (current script removes it), or
   - Press `F5` to reload the Following page.
2. **Browser console**
   - Still in the Console tab, click the **clear** icon (circle with a line) or press `Ctrl + L` (Mac: `Cmd + K`).
   - That only clears log text. It does not undo the CSVs.
3. **Close Developer Tools**
   - Press `F12` again, or `Esc`, or click the `X` on the tools panel.
4. **Do not leave the script running**
   - If the page is still auto-scrolling, reload (`F5`). That stops the script.
5. **Downloads**
   - CSVs stay in your Downloads folder until you delete them. That is your result, not leftover code on X.

Reload is enough. You do not need to log out of X or clear cookies.

### If something goes wrong

- No popup: you are in **Elements**, not **Console**.
- Script says open Following first: the URL must end with `/following`.
- Too few accounts: reload the Following page, keep the tab in front, paste again.
- Browser blocks three downloads: allow multiple downloads for `x.com`.
- Paste blocked: type `allow pasting`, press Enter, paste `console.js` again.
- Black “Done” box still visible: click it or press `F5`.

---

## Archive page (optional)

[`index.html`](./index.html) plus [`app.js`](./app.js) can split lists from an official X data archive.

This is not live. A GitHub Pages site **cannot** log into X or read your Following page. You must download your archive from X first (Settings → Your account → Download an archive of your data), wait for the zip, then drop `data/following.js` and `data/follower.js` onto the page.

X archive files usually contain **account IDs**, not `@handles`. Put those IDs in your private keep list if you use this mode.

Do not commit the zip or those `.js` files to this repo. See [`keep.example.txt`](./keep.example.txt) for the keep-file format.

To publish the page: repo Settings → Pages → Deploy from branch `main` / root. Then open:

`https://YOUR_GITHUB_USER.github.io/keep-review/`

---

## What not to put in this repo

- Your X archive zip
- `following.js` / `follower.js` from your account
- Your real keep list
- Screenshots of your profile or follower counts
- API keys (this project does not use any)

---

## License

MIT
