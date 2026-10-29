# Your Feedback Matters

This is a static feedback page with an optional Google Sheets connection. Submissions are also kept in the visitor's browser so they appear in that browser's Customer Notes list.

## Connect a Google Sheet

1. Create or open the Google Sheet you want to use. Keep the sheet private; the website does not need the sheet itself to be shared publicly.
2. Open [Google Apps Script](https://script.google.com/) while signed into the Google account that owns the sheet. Create a project and replace its starter code with `Code.gs` from this folder.
3. In Apps Script project settings, add a Script Property named `SPREADSHEET_ID`. Set its value to the ID from your Sheet URL (the part between `/d/` and `/edit`).
4. In Apps Script, choose **Deploy → New deployment → Web app**. Set it to execute as you, and allow access to anyone, including anonymous visitors, so customers can submit without signing in. This endpoint only appends validated feedback; it does not return sheet contents. Public access can still allow spam submissions, so use a dedicated feedback spreadsheet.
5. Deploy, copy the URL ending in `/exec`, and paste it into `feedback-config.js` as `window.FEEDBACK_WEB_APP_URL`.
6. Upload `index.html` and `feedback-config.js` with the rest of the site to your hosting provider.

The form uses a cross-origin no-cors request because Apps Script's Content Service redirects responses and does not expose them to a Vercel page. The page cannot confirm a successful sheet write; after the first real submission, check the `Feedback` tab in your Sheet.

## Files

- `index.html` — the page and feedback form.
- `feedback-config.js` — paste your Apps Script deployment URL here.
- `Code.gs` — Apps Script endpoint that writes feedback to your Sheet.
