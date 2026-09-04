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

### Steps

1. Open X on a computer and log in.
2. Go to your Following page:
   `https://x.com/YOUR_HANDLE/following
