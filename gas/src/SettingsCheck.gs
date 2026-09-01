/**
 * 「② 設定チェック」
 * LINEトークン検証、Driveフォルダ書込・共有確認、各シート見出し確認を行い、
 * 結果を✅／❌でまとめて表示する。
 */

function runSettingsCheck() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var lines = [];

  lines.push(checkLineToken_(ss));
  lines.push(checkDriveFolder_(ss));
  lines.push.apply(lines, checkSheetHeaders_(ss));

  var summary = lines.map(function (r) {
    return (r.ok ? '✅ ' : '❌ ') + r.name + '：' + r.message;
  }).join('\n');

  ui.alert('設定チェック 結果', summary, ui.ButtonSet.OK);
}

function findSettingsRow_(sheet, key) {
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === key) return i + 1; // 1-based row number
  }
  return -1;
}

function checkLineToken_(ss) {
  var name = 'LINEアクセストークン';
  var sheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  if (!sheet) return { name: name, ok: false, message: '設定シートが存在しません' };

  var row = findSettingsRow_(sheet, name);
  if (row === -1) return { name: name, ok: false, message: '設定シートに項目行が見つかりません' };

  var cellValue = String(sheet.getRange(row, 2).getValue() || '').trim();
  var props = PropertiesService.getScriptProperties();

  var token = '';
  if (cellValue === TOKEN_MASK) {
    token = props.getProperty(SCRIPT_PROP_LINE_TOKEN) || '';
    if (!token) return { name: name, ok: false, message: 'マスク済み表示ですがScript Propertiesにトークンが見つかりません。値を再入力してください。' };
  } else if (cellValue === '') {
    return { name: name, ok: false, message: '未入力です' };
  } else {
    token = cellValue;
  }

  try {
    var res = UrlFetchApp.fetch('https://api.line.me/v2/bot/info', {
      method: 'get',
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });
    if (res.getResponseCode() === 200) {
      if (cellValue !== TOKEN_MASK) {
        props.setProperty(SCRIPT_PROP_LINE_TOKEN, token);
        sheet.getRange(row, 2).setValue(TOKEN_MASK);
      }
      var info = JSON.parse(res.getContentText());
      return { name: name, ok: true, message: '有効です（Bot名：' + (info.displayName || '不明') + '）' };
    } else {
      return { name: name, ok: false, message: 'LINE API検証に失敗しました（HTTP ' + res.getResponseCode() + '）。トークンを確認してください。' };
    }
  } catch (e) {
    return { name: name, ok: false, message: '検証中にエラーが発生しました：' + e.message };
  }
}

function checkDriveFolder_(ss) {
  var name = 'Google Drive素材ルートフォルダ';
  var sheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  if (!sheet) return { name: name, ok: false, message: '設定シートが存在しません' };

  var row = findSettingsRow_(sheet, 'Google Drive素材ルートフォルダID');
  if (row === -1) return { name: name, ok: false, message: '設定シートに項目行が見つかりません' };

  var folderId = String(sheet.getRange(row, 2).getValue() || '').trim();
  if (!folderId) return { name: name, ok: false, message: '未入力です' };

  try {
    var folder = DriveApp.getFolderById(folderId);
    var testFile = folder.createFile('setting_check_' + new Date().getTime() + '.txt', '設定チェック用テストファイル（自動削除されます）');
    testFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    testFile.setTrashed(true);
    return { name: name, ok: true, message: 'フォルダ「' + folder.getName() + '」への書込・共有設定・削除を確認しました' };
  } catch (e) {
    return { name: name, ok: false, message: 'フォルダへのアクセスに失敗しました：' + e.message };
  }
}

function checkSheetHeaders_(ss) {
  var results = [];

  var settingsSheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  results.push(headerCheckResult_(SHEET_NAMES.SETTINGS, settingsSheet, ['項目', '値', '備考']));

  var catalogSheet = ss.getSheetByName(SHEET_NAMES.CATALOG);
  results.push(headerCheckResult_(SHEET_NAMES.CATALOG, catalogSheet, CATALOG_HEADERS));

  var pageSheet = ss.getSheetByName(SHEET_NAMES.PAGE);
  results.push(headerCheckResult_(SHEET_NAMES.PAGE, pageSheet, PAGE_HEADERS));

  var companySheet = ss.getSheetByName(SHEET_NAMES.COMPANY);
  results.push(headerCheckResult_(SHEET_NAMES.COMPANY, companySheet, COMPANY_HEADERS));

  if (pageSheet) {
    var data = pageSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var sheetName = data[i][4]; // sheet_name列
      var pageType = data[i][5]; // page_type列
      if (!sheetName) continue;
      var contentSheet = ss.getSheetByName(sheetName);
      var expected = (pageType === 'company') ? COMPANY_PAGE_HEADERS : PAGE_CONTENT_HEADERS;
      results.push(headerCheckResult_(sheetName, contentSheet, expected));
    }
  }

  return results;
}

function headerCheckResult_(name, sheet, headers) {
  if (!sheet) return { name: name, ok: false, message: 'シートが存在しません' };
  if (!headersMatch_(sheet, headers)) return { name: name, ok: false, message: '見出しが想定と異なります' };
  return { name: name, ok: true, message: '見出しOK' };
}
