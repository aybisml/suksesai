// ================================================================
// Google Apps Script — AI Tools Studio
// Fungsi: Validasi whitelist email + Audit Trail AccessLog
// ================================================================
// CARA DEPLOY:
//   1. Buka Google Spreadsheet Anda
//   2. Extensions → Apps Script
//   3. Hapus kode default → Paste seluruh kode ini
//   4. Klik Save (Ctrl+S)
//   5. Klik Deploy → New Deployment
//      - Type        : Web App
//      - Execute as  : Me
//      - Who access  : Anyone
//   6. Klik Deploy → Copy URL yang muncul
//   7. Paste URL tersebut ke APPS_SCRIPT_URL di js/auth.js
// ================================================================

var WHITELIST = 'Whitelist';   // Sheet berisi daftar email (kolom A)
var LOG       = 'AccessLog';   // Sheet log akses otomatis

function doGet(e) {
  var result = { allowed: false, message: '' };

  try {
    // Ambil & bersihkan email dari parameter
    var raw   = (e && e.parameter && e.parameter.email) ? e.parameter.email : '';
    var email = raw.toLowerCase().trim();

    // Validasi format email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      result.message = 'invalid_email';
      writeLog(email, 'REJECTED_INVALID', e);
      return respond(result);
    }

    // Cek whitelist DI SERVER
    // Browser hanya terima {allowed:true/false} — daftar email TIDAK pernah bocor
    var ss      = SpreadsheetApp.getActiveSpreadsheet();
    var ws      = ss.getSheetByName(WHITELIST);
    var lastRow = ws.getLastRow();
    var rows    = lastRow > 1 ? ws.getRange(2, 1, lastRow - 1, 1).getValues() : [];
    var list    = rows.map(function(r) { return String(r[0]).toLowerCase().trim(); }).filter(Boolean);

    var allowed = list.indexOf(email) !== -1;

    // Tulis audit log (semua jalur)
    writeLog(email, allowed ? 'ALLOWED' : 'DENIED', e);

    result.allowed = allowed;
    result.message = allowed ? 'ok' : 'not_whitelisted';

  } catch (err) {
    writeLog('', 'ERROR: ' + err.message, e);
    result.message = 'server_error';
  }

  return respond(result);
}

function writeLog(email, status, e) {
  try {
    var ss  = SpreadsheetApp.getActiveSpreadsheet();
    var log = ss.getSheetByName(LOG);

    // Buat sheet AccessLog otomatis jika belum ada
    if (!log) {
      log = ss.insertSheet(LOG);
      log.appendRow(['Timestamp', 'Email', 'Status', 'User-Agent', 'Referer']);
      log.setFrozenRows(1);
      log.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#4285F4').setFontColor('#fff');
      log.setColumnWidth(1, 170);
      log.setColumnWidth(2, 220);
      log.setColumnWidth(3, 100);
    }

    log.appendRow([
      new Date(),
      email,
      status,
      (e && e.parameter && e.parameter.ua)  ? e.parameter.ua  : '-',
      (e && e.parameter && e.parameter.ref) ? e.parameter.ref : '-'
    ]);
  } catch (err) {
    console.error('writeLog error: ' + err.message);
  }
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
