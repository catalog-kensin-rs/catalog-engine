/**
 * 「① 初期設定」
 * 必要なシート一式を、見出し・列幅・入力規則・サンプル行つきで自動生成する。
 * 列構成が既存データと異なる場合は上書きせず警告して停止する（安全策）。
 */

function runInitialSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var results = [];

  results.push(setupSettingsSheet_(ss));
  results.push(setupCatalogSheet_(ss));
  results.push(setupPageSheet_(ss));
  results.push(setupCompanySheet_(ss));

  for (var i = 0; i < INITIAL_PAGES.length; i++) {
    var row = INITIAL_PAGES[i];
    var sheetName = row[3];
    var pageType = row[4];
    if (pageType === 'company') {
      results.push(setupCompanyPageSheet_(ss, sheetName));
    } else {
      results.push(setupContentSheet_(ss, sheetName));
    }
  }

  results.push(setupDraftSheet_(ss));

  var summary = results.map(function (r) {
    return (r.ok ? '✅ ' : '⚠️ ') + r.name + '：' + r.message;
  }).join('\n');

  ui.alert('初期設定 結果', summary, ui.ButtonSet.OK);
}

/** シートの1行目が指定ヘッダーと一致するか */
function headersMatch_(sheet, headers) {
  if (sheet.getLastColumn() < headers.length) return false;
  var existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (String(existing[i]).trim() !== headers[i]) return false;
  }
  return true;
}

function isBlankSheet_(sheet) {
  return sheet.getLastRow() === 0 || (sheet.getLastRow() === 1 && sheet.getRange(1, 1).getValue() === '');
}

function writeHeaderRow_(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f0f0f0');
  sheet.setFrozenRows(1);
}

function applyDropdown_(sheet, colIndex, values, numRows) {
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build();
  sheet.getRange(2, colIndex, numRows, 1).setDataValidation(rule);
}

function applyCheckbox_(sheet, colIndex, numRows) {
  var rule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  sheet.getRange(2, colIndex, numRows, 1).setDataValidation(rule);
}

/**
 * 汎用：表形式シートの安全な初期化。
 * 既存シートがあり列構成が想定と異なり、かつデータ行がある場合は上書きせず停止する。
 */
function ensureTabularSheet_(ss, name, headers, sampleRows, widths) {
  var existing = ss.getSheetByName(name);

  if (existing) {
    if (isBlankSheet_(existing)) {
      // 空シートなので初期化してよい
    } else if (headersMatch_(existing, headers)) {
      return { name: name, ok: true, message: '既に構成済みです（変更なし）' };
    } else {
      var hasData = existing.getLastRow() > 1;
      if (hasData) {
        return { name: name, ok: false, message: '既存データがあり列構成が想定と異なるため、上書きせず処理を停止しました。手動で確認してください。' };
      }
      // ヘッダー行のみで内容と異なる場合は上書きしてよい（データ喪失なし）
    }
  }

  var sheet = existing || ss.insertSheet(name);
  writeHeaderRow_(sheet, headers);
  if (sampleRows && sampleRows.length && sheet.getLastRow() <= 1) {
    sheet.getRange(2, 1, sampleRows.length, headers.length).setValues(sampleRows);
  }
  if (widths) {
    for (var i = 0; i < widths.length; i++) {
      sheet.setColumnWidth(i + 1, widths[i]);
    }
  }
  return { name: name, ok: true, message: existing ? '見出しを設定しました' : '新規作成しました' };
}

function setupSettingsSheet_(ss) {
  var name = SHEET_NAMES.SETTINGS;
  var existing = ss.getSheetByName(name);
  var headers = ['項目', '値', '備考'];

  if (existing && !isBlankSheet_(existing)) {
    if (headersMatch_(existing, headers)) {
      return { name: name, ok: true, message: '既に構成済みです（変更なし）' };
    }
    if (existing.getLastRow() > 1) {
      return { name: name, ok: false, message: '既存データがあり列構成が想定と異なるため、上書きせず処理を停止しました。手動で確認してください。' };
    }
  }

  var sheet = existing || ss.insertSheet(name);
  writeHeaderRow_(sheet, headers);

  var rows = SETTINGS_ITEMS.map(function (item) { return [item.key, '', item.note]; });
  if (sheet.getLastRow() <= 1) {
    sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  }
  sheet.setColumnWidth(1, 260);
  sheet.setColumnWidth(2, 320);
  sheet.setColumnWidth(3, 420);
  return { name: name, ok: true, message: existing ? '見出しを設定しました' : '新規作成しました' };
}

function setupCatalogSheet_(ss) {
  var name = SHEET_NAMES.CATALOG;
  var existing = ss.getSheetByName(name);
  // 公開URL列（G列）追加前の旧ヘッダー。既存シートの後方互換マイグレーション判定に使う。
  var oldHeaders = ['catalog_id', '公開', 'カタログ名', 'slug', 'テーマ', '更新日'];

  if (existing && existing.getLastRow() > 1 && !headersMatch_(existing, CATALOG_HEADERS) && headersMatch_(existing, oldHeaders)) {
    addCatalogPublicUrlColumn_(existing);
    fillCatalogPublicUrlFormulas_(existing);
    applyCheckbox_(existing, 2, 500);
    return { name: name, ok: true, message: 'G列「公開URL」を追加し、既存行に数式を反映しました' };
  }

  var sampleRow = [INITIAL_CATALOG_ID, false, 'Resi Art', 'resiart', 'default', new Date(), catalogPublicUrlFormula_(2)];
  var result = ensureTabularSheet_(ss, name, CATALOG_HEADERS, [sampleRow], [140, 80, 200, 140, 140, 120, 320]);
  var sheet = ss.getSheetByName(name);
  if (sheet) {
    applyCheckbox_(sheet, 2, 500); // 公開列（今後の追加行にも適用）
    if (result.ok) fillCatalogPublicUrlFormulas_(sheet); // 手動追加行等、数式が未設定の行があれば補完
  }
  return result;
}

/** カタログ管理G列（公開URL）に入れる数式文字列を生成 */
function catalogPublicUrlFormula_(row) {
  return '="https://catalog-kensin-rs.github.io/catalog-engine/?catalog="&A' + row + '&"&company=numan"';
}

/** カタログ管理シートの、catalog_id入力済みの全行にG列（公開URL）の数式を設定する（未入力行はスキップ） */
function fillCatalogPublicUrlFormulas_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0]) {
      var row = i + 2;
      sheet.getRange(row, 7).setFormula(catalogPublicUrlFormula_(row));
    }
  }
}

/** 旧6列ヘッダーのカタログ管理シートへ、G列「公開URL」ヘッダーを追加する（列構成の後方互換マイグレーション） */
function addCatalogPublicUrlColumn_(sheet) {
  sheet.getRange(1, 7).setValue('公開URL').setFontWeight('bold').setBackground('#f0f0f0');
  sheet.setColumnWidth(7, 320);
}

function setupPageSheet_(ss) {
  var name = SHEET_NAMES.PAGE;
  var existing = ss.getSheetByName(name);

  if (existing && !isBlankSheet_(existing)) {
    if (headersMatch_(existing, PAGE_HEADERS)) {
      return { name: name, ok: true, message: '既に構成済みです（変更なし）' };
    }
    if (existing.getLastRow() > 1) {
      return { name: name, ok: false, message: '既存データがあり列構成が想定と異なるため、上書きせず処理を停止しました。手動で確認してください。' };
    }
  }

  var sheet = existing || ss.insertSheet(name);
  writeHeaderRow_(sheet, PAGE_HEADERS);

  if (sheet.getLastRow() <= 1) {
    var rows = INITIAL_PAGES.map(function (p) {
      return [INITIAL_CATALOG_ID, p[0], p[1], p[2], p[3], p[4], p[5]];
    });
    sheet.getRange(2, 1, rows.length, PAGE_HEADERS.length).setValues(rows);
  }
  applyDropdown_(sheet, 6, PAGE_TYPES, 500); // page_type列（今後の追加行にも適用）
  applyCheckbox_(sheet, 7, 500); // 公開列

  var widths = [100, 70, 110, 160, 160, 110, 80];
  for (var i = 0; i < widths.length; i++) sheet.setColumnWidth(i + 1, widths[i]);

  return { name: name, ok: true, message: existing ? '見出しを設定しました' : '新規作成しました' };
}

function setupCompanySheet_(ss) {
  var sampleRow = ['numan', '（会社名を入力）', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
  var widths = [110, 160, 100, 260, 130, 130, 180, 200, 160, 160, 100, 100, 160, 160, 200, 160, 200];
  return ensureTabularSheet_(ss, SHEET_NAMES.COMPANY, COMPANY_HEADERS, [sampleRow], widths);
}

function setupContentSheet_(ss, sheetName) {
  var sampleRow = ['（タイトル）', '', '', '', '', '', '', ''];
  var widths = [200, 200, 320, 220, 220, 220, 140, 160];
  return ensureTabularSheet_(ss, sheetName, PAGE_CONTENT_HEADERS, [sampleRow], widths);
}

function setupCompanyPageSheet_(ss, sheetName) {
  var sampleRow = ['numan'];
  return ensureTabularSheet_(ss, sheetName, COMPANY_PAGE_HEADERS, [sampleRow], [160]);
}

function setupDraftSheet_(ss) {
  var name = SHEET_NAMES.DRAFT;
  var result = ensureTabularSheet_(ss, name, DRAFT_HEADERS, [], [140, 100, 100, 60, 260, 140, 100]);
  var sheet = ss.getSheetByName(name);
  if (sheet && !sheet.isSheetHidden()) sheet.hideSheet();
  return result;
}
