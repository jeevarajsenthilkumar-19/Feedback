const FEEDBACK_SHEET_NAME = "Feedback";
const FEEDBACK_HEADERS = [
  "Timestamp",
  "Name",
  "Rating",
  "Feedback",
  "Contact requested"
];

function doGet() {
  return jsonOutput_({ success: true, message: "Feedback endpoint is ready." });
}

function doPost(e) {
  const fields = e && e.parameter ? e.parameter : {};

  // Quietly accept the request without saving it when a bot fills the trap field.
  if (String(fields.website || "").trim()) {
    return jsonOutput_({ success: true });
  }

  const rating = Number(fields.rating);
  const name = String(fields.name || "").trim().slice(0, 50);
  const feedback = String(fields.comment || "").trim().slice(0, 500);
  const contactRequested = String(fields.contactRequested) === "true";

  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !feedback) {
    return jsonOutput_({ success: false, error: "Please provide a rating and feedback." });
  }

  const spreadsheetId = PropertiesService.getScriptProperties()
    .getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) {
    return jsonOutput_({ success: false, error: "SPREADSHEET_ID is not configured." });
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    let sheet = spreadsheet.getSheetByName(FEEDBACK_SHEET_NAME);
    if (!sheet) sheet = spreadsheet.insertSheet(FEEDBACK_SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(FEEDBACK_HEADERS);
    }

    sheet.appendRow([
      new Date(),
      safeCell_(name || "A FRIEND"),
      rating,
      safeCell_(feedback),
      contactRequested
    ]);

    return jsonOutput_({ success: true });
  } catch (error) {
    console.error("Could not save feedback:", error);
    return jsonOutput_({ success: false, error: "Could not save feedback." });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function safeCell_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function jsonOutput_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
