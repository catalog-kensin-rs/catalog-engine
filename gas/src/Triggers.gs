/**
 * カタログ管理シートの編集を検知する簡易トリガー（Simple Trigger）。
 * A列（catalog_id）に新しい値が入力されたら、
 *  1) 同じ行のG列（公開URL）に自動で公開URL数式をセットする
 *  2) ページ管理シートに、そのcatalog_id用の初期6行（未登録の場合のみ）を追加する
 * 簡易トリガーはスプレッドシート自身の読み書きのみ許可されるため、
 * 外部サービス呼び出し（UrlFetchApp等）はここでは行わない。
 */
function onEdit(e) {
  try {
    var range = e.range;
    var sheet = range.getSheet();
    if (sheet.getName() !== SHEET_NAMES.CATALOG) return;
    if (range.getColumn() > 1) return; // A列（catalog_id）を含まない編集は対象外
    if (!headersMatch_(sheet, CATALOG_HEADERS)) return; // 「①初期設定」未実行／未移行のシートは対象外（安全策）

    var startRow = Math.max(range.getRow(), 2);
    var endRow = range.getLastRow();
    for (var row = startRow; row <= endRow; row++) {
      var catalogId = String(sheet.getRange(row, 1).getValue() || '').trim();
      if (!catalogId) continue;
      sheet.getRange(row, 7).setFormula(catalogPublicUrlFormula_(row));
      ensurePageRowsForCatalog_(e.source, catalogId);
    }
  } catch (err) {
    // onEditはUIコンテキストを持たないため、エラーはログのみに留める
    Logger.log('onEdit error: ' + err.message);
  }
}

/**
 * ページ管理シートに、指定catalog_id用の初期6行（concept/features/service/works/technical/company）を追加する。
 * 既にそのcatalog_idの行が1件でも存在する場合は何もしない（重複防止）。
 * sheet_nameはcatalog_idごとに一意にするため「<catalog_id>_P10_CONCEPT」のように接頭辞を付与する
 * （実コンテンツシート自体はここでは作成しない。内容投入時に別途作成する想定）。
 */
function ensurePageRowsForCatalog_(ss, catalogId) {
  var sheet = ss.getSheetByName(SHEET_NAMES.PAGE);
  if (!sheet) return;
  if (!headersMatch_(sheet, PAGE_HEADERS)) return; // 想定外の列構成の場合は何もしない（安全策）

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === catalogId) return; // 既にこのcatalog_id用の行がある場合は何もしない
  }

  // order, page_id, ページ名, sheet_name（接頭辞なし）, page_type
  var template = [
    [10, 'concept', 'コンセプト', 'P10_CONCEPT', 'hero'],
    [20, 'features', 'FEATURES', 'P20_FEATURES', 'features'],
    [30, 'service', 'SERVICE', 'P30_SERVICE', 'text'],
    [40, 'works', '施工事例', 'P40_WORKS', 'gallery'],
    [50, 'technical', 'TECHNICAL DATA', 'P50_TECHNICAL', 'specs'],
    [60, 'company', '会社情報', 'P60_COMPANY', 'company']
  ];
  var rows = template.map(function (p) {
    return [catalogId, p[0], p[1], p[2], catalogId + '_' + p[3], p[4], false];
  });

  var startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, PAGE_HEADERS.length).setValues(rows);
}
