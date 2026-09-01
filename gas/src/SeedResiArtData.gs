/**
 * 「③ Resi Art データ投入（Phase3）」
 * P10_CONCEPT / P20_FEATURES / P30_SERVICE と会社マスター（numan）へ
 * 実データを投入する。列構成が想定と異なる場合は書き込まず警告する（安全策）。
 * P40_WORKS（施工事例画像）・P50_TECHNICAL（性状・物性データ）は
 * 画像・数値データ未確定のため対象外。
 */

function runSeedResiArtData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var results = [];

  results.push(seedContentSheet_(ss, 'P10_CONCEPT', [
    ['Resi Art', '床が変われば、空間が変わる。',
      '職人の手仕事が生み出す、世界に一つだけのオーダーメイドフロア。国内外で高い評価を受けるレジンアートで、空間そのものの価値を変えます。',
      '', '', '', 'full', '']
  ]));

  results.push(seedContentSheet_(ss, 'P20_FEATURES', [
    ['優れた意匠性', '',
      '職人の手作業が描き出す、世界に一つだけのオーダーメイドフロア。豊富な手法とバリエーションにより、空間に合わせた唯一無二の美しさを表現します。',
      '', '', '', '', ''],
    ['迅速な施工', '',
      '最短2日で仕上げる迅速な施工体制。施工から約48時間で完全硬化し実用強度に達するため、工期の大幅な短縮に貢献します。',
      '', '', '', '', ''],
    ['優れたメンテナンス性', '',
      '継ぎ目のないシームレスな表面が水や汚れの浸透をシャットアウト。日々の簡単な拭き掃除だけで美しさを保てます。',
      '', '', '', '', ''],
    ['強靭な耐久性', '',
      '厳格な各種試験をクリアした高品質レジンを採用。事業所での乗り入れにも耐える高い表面強度で、長期間性能を維持します。',
      '', '', '', '', '']
  ]));

  results.push(seedContentSheet_(ss, 'P30_SERVICE', [
    ['Resi Art Floor（レジンアートフロア）', '',
      '店舗・住宅・ガレージなど空間の雰囲気を大きく変えるオーダーデザインのレジンフロア。床だけの一部リフォームから空間づくりまで対応。\n施工フロー：①ヒアリング→②デザイン提案→③施工→④お引き渡し',
      '', '', '', '', ''],
    ['Resi Art Sign（レジアート看板）', '',
      'レジンで創る唯一無二の看板。フルオーダーでサロン・オフィス等の空間に合わせて制作',
      '', '', '', '', ''],
    ['Resi Art Table（レジアートテーブル）', '',
      '世界に一つだけの、自然が描くアートテーブル',
      '', '', '', '', '']
  ]));

  results.push(seedCompanyRow_(ss, 'numan', '株式会社トリニティリンク', '529-1443', '滋賀県近江八幡市白鳥町151-1 五番街テナントD'));

  var summary = results.map(function (r) {
    return (r.ok ? '✅ ' : '⚠️ ') + r.name + '：' + r.message;
  }).join('\n');
  summary += '\n\n※ P40_WORKS（施工事例画像）とP50_TECHNICAL（性状・物性データ）は、画像・数値データが未確定のため今回は投入していません。';

  ui.alert('Resi Art データ投入 結果', summary, ui.ButtonSet.OK);
}

/** 汎用コンテンツシート（PAGE_CONTENT_HEADERS構成）へ行データを投入 */
function seedContentSheet_(ss, sheetName, rows) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { name: sheetName, ok: false, message: 'シートが存在しません（先に「①初期設定」を実行してください）' };
  if (!headersMatch_(sheet, PAGE_CONTENT_HEADERS)) {
    return { name: sheetName, ok: false, message: '見出しが想定と異なるため書き込みを中止しました。手動で確認してください。' };
  }
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, PAGE_CONTENT_HEADERS.length).clearContent();
  }
  sheet.getRange(2, 1, rows.length, PAGE_CONTENT_HEADERS.length).setValues(rows);
  return { name: sheetName, ok: true, message: rows.length + '件を投入しました' };
}

/** 会社マスターの既存company_id行へ会社名・郵便番号・住所を更新（他列は変更しない） */
function seedCompanyRow_(ss, companyId, name, postalCode, address) {
  var sheetName = SHEET_NAMES.COMPANY;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { name: sheetName, ok: false, message: 'シートが存在しません' };
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === companyId) {
      sheet.getRange(i + 1, 2, 1, 3).setValues([[name, postalCode, address]]);
      return { name: sheetName, ok: true, message: 'company_id=' + companyId + ' の行（会社名・郵便番号・住所）を更新しました' };
    }
  }
  return { name: sheetName, ok: false, message: 'company_id=' + companyId + ' の行が見つかりません。「①初期設定」で会社マスターにサンプル行が作成されているか確認してください。' };
}
