# Meant to Follow

Read-only audit of who you follow on X.

Most tools dump everyone who does not follow back.
This one splits that list:

- **Mutuals** — they follow you back
- **Keep** — they do not follow back, but you follow them on purpose
- **Review** — they do not follow back, and you did not mark them as keep

It does not follow, unfollow, like, or post.
It does not use the X API.
Do not put your X archive or your private keep list in this repository.

---

## Live console mode

Use this when you want a live list from your Following page.

### What you need

- A desktop browser (Chrome, Edge, Firefox, Brave)
- You logged into X
- This file: `console.js`

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

### Steps

1. Open X on a computer and log in.
2. Go to your accounts Following page:
   `https://x.com/YOUR_HANDLE/following`
3. Reload the page once (F5) so the list is fresh.
4. Open Developer Tools:
   - Windows / Linux: `F12` or `Ctrl + Shift + I`
   - Mac: `Cmd + Option + I`
5. Click the **Console** tab.
6. If the console says you must allow pasting, type exactly:
   `allow pasting`
   Then press Enter.
7. Open `console.js` from this repo, copy the whole file, paste it into the console, press Enter.
8. When the popup appears, type the handles you want to **keep** (or leave it blank) and click OK.
9. Leave that X tab in front. The page will scroll by itself for a couple of minutes.
10. When it finishes, your Downloads folder should contain:
    - `mutuals.csv`
    - `keep.csv`
    - `review.csv
