// Google Apps Script sample for receiving form posts and appending to a Google Sheet.
// Instructions:
// 1. Create or open a Google Sheet and copy its ID from the URL (between /d/ and /edit).
// 2. Replace 'YOUR_SHEET_ID' below with your sheet's ID.
// 3. In the Apps Script editor, paste this file, Save, then Deploy -> New deployment -> "Web app".
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Use the deployed Web App URL as the form `data-action` (example: https://script.google.com/macros/s/AKfy.../exec)

function doPost(e) {
  // Robust handler: accepts application/x-www-form-urlencoded or application/json
  try {
    // normalize e to avoid 'undefined' errors when running tests from the editor
    e = e || {};
    e.parameter = e.parameter || {};

    var ss = SpreadsheetApp.openById('1rmwsKgAzZ_4gAKjwx-UKTBy5oL_M4IUjA1ty3UfAYNU');
    var sheet = ss.getSheetByName('Sheet1') || ss.getSheets()[0];

    // Parse incoming parameters safely
    var params = {};
    var postData = e.postData || null;
    if (postData && postData.type && postData.type.indexOf('application/json') === 0) {
      try { params = JSON.parse(postData.contents || '{}'); } catch (err) { params = e.parameter || {}; }
    } else {
      // e.parameter works for form-encoded and query params
      params = e.parameter || {};
    }

    // Normalize fields
    var name = (params.name || params.fullname || '').toString().trim();
    var phone = (params.phone || params.tel || params.mobile || '').toString().trim();
    var message = (params.message || params.msg || params.enquiry || '').toString().trim();

    // Basic validation
    if (!name) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Name is required' })).setMimeType(ContentService.MimeType.JSON);
    }
    if (!phone || phone.length < 6) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Please provide a valid phone number' })).setMimeType(ContentService.MimeType.JSON);
    }
    if (!message || message.length < 5) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Message is too short' })).setMimeType(ContentService.MimeType.JSON);
    }

    // Append row: Timestamp | Name | Phone | Message
    var timestamp = new Date();
    sheet.appendRow([timestamp, name, phone, message]);

    // Log for debugging
    Logger.log('Appended row: %s | %s | %s', name, phone, message);

    // Friendly, full response message shown in the site modal
    var successMessage = 'Thank you for reaching out to R‑Tech Software Solutions. Our team will get back to you shortly.';
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: successMessage })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('doPost error: %s', err.stack || err.message || err);
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Server error: ' + (err.message || err) })).setMimeType(ContentService.MimeType.JSON);
  }
}
