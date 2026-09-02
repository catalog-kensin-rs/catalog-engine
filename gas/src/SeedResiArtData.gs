/**
 * 「③ Resi Art データ投入（Phase3）」
 * P10_CONCEPT / P20_FEATURES / P30_SERVICE / P40_WORKS / P50_TECHNICAL と
 * 会社マスター（numan）へ実データを投入する。
 * 列構成が想定と異なる場合は書き込まず警告する（安全策）。
 */

function runSeedResiArtData() {
  var results = seedResiArtData_();
  var summary = results.map(function (r) {
    return (r.ok ? '✅ ' : '⚠️ ') + r.name + '：' + r.message;
  }).join('\n');
  SpreadsheetApp.getUi().alert('Resi Art データ投入 結果', summary, SpreadsheetApp.getUi().ButtonSet.OK);
}

/** clasp run など、UIコンテキストを持たない実行元から呼び出すための版（結果はログに出力） */
function runSeedResiArtDataApi() {
  var results = seedResiArtData_();
  results.forEach(function (r) {
    Logger.log((r.ok ? 'OK ' : 'NG ') + r.name + '：' + r.message);
  });
  return results;
}

function seedResiArtData_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var results = [];

  results.push(seedContentSheet_(ss, 'P10_CONCEPT', [
    ['Resi Art', '床が変われば、空間が変わる。',
      '職人の手仕事が生み出す、世界に一つだけのオーダーメイドフロア。国内外で高い評価を受けるレジンアートで、空間そのものの価値を変えます。',
      '1sun3XCevGJQsbK87nX0Uyqqj29byYGDa', '', '', 'full', '']
  ]));

  // 4項目とも同じFeaturesフォルダを参照する。フォルダ内は「01_◯◯.jpg」〜「04_◯◯.jpg」の
  // 連番想定（ファイル名昇順で返るため、行の並び順＝連番の並び順になる。features()テンプレート側で
  // 行インデックスに対応する画像を1枚ずつ割り当てる）。
  var FEATURES_FOLDER_ID = '1S0rRlK_-umhZk3KaQ3bFtwJgknk3CxKW';
  results.push(seedContentSheet_(ss, 'P20_FEATURES', [
    ['優れた意匠性', '',
      '職人の手作業が描き出す、世界に一つだけのオーダーメイドフロア。豊富な手法とバリエーションにより、空間に合わせた唯一無二の美しさを表現します。',
      FEATURES_FOLDER_ID, '', '', '', ''],
    ['迅速な施工', '',
      '最短2日で仕上げる迅速な施工体制。施工から約48時間で完全硬化し実用強度に達するため、工期の大幅な短縮に貢献します。',
      FEATURES_FOLDER_ID, '', '', '', ''],
    ['優れたメンテナンス性', '',
      '継ぎ目のないシームレスな表面が水や汚れの浸透をシャットアウト。日々の簡単な拭き掃除だけで美しさを保てます。',
      FEATURES_FOLDER_ID, '', '', '', ''],
    ['強靭な耐久性', '',
      '厳格な各種試験をクリアした高品質レジンを採用。事業所での乗り入れにも耐える高い表面強度で、長期間性能を維持します。',
      FEATURES_FOLDER_ID, '', '', '', '']
  ]));

  // Sign／Tableは「メイン行（既存フォルダ）」＋「ギャラリー行（新規フォルダ、レイアウトタイプ=carousel）」の
  // 2行構成にする（列追加はせず、既存のPAGE_CONTENT_HEADERSのまま）。
  // レイアウトタイプ=carouselの行は、text()テンプレート側で全画像を1本のカルーセルとして描画する。
  results.push(seedContentSheet_(ss, 'P30_SERVICE', [
    ['Resi Art Floor（レジンアートフロア）', '',
      '店舗・住宅・ガレージなど空間の雰囲気を大きく変えるオーダーデザインのレジンフロア。床だけの一部リフォームから空間づくりまで対応。\n施工フロー：①ヒアリング→②デザイン提案→③施工→④お引き渡し',
      '1sTp76AimT7D1zN0toenm8pMC5KVYthb_', '', '', '', ''],
    ['Resi Art Sign（レジアート看板）', '',
      'レジンで創る唯一無二の看板。フルオーダーでサロン・オフィス等の空間に合わせて制作',
      '1jt8tQjXTrkGVVLafY3nItUATSkOQ6OZ4', '', '', '', ''],
    ['', '', '', '1sz3CnIHjjdYRzQaNTQfBzQzvnT2vsORD', '', '', 'carousel', ''],
    ['Resi Art Table（レジアートテーブル）', '',
      '世界に一つだけの、自然が描くアートテーブル',
      '1S1z4_XaC_dczGTQS8BP4j8GteGy75A7S', '', '', '', ''],
    ['', '', '', '1lUvo0uN1m21dfCIcq-Kb-equpzR-lU14', '', '', 'carousel', '']
  ]));

  results.push(seedContentSheet_(ss, 'P50_TECHNICAL', [
    ['ノーマル', '', buildSpecsBody_({
      外観: '無色透明状', '配合比（主剤：硬化剤）': '3:1', '粘度（25℃）': '550mPa・s', 比重: '1.10',
      可使時間: '0.87分', '脱型可能時間（25℃）': '480分', 完全硬化時間: '48-72時間',
      圧縮強さ: '211MPa', 引張強さ: '41.1MPa', 曲げ強さ: '70.4MPa', シャルピー衝撃値: '8.95KJ/m2', 最大硬度: '86（シュアD）'
    }), '', '', '', '', ''],
    ['速乾用', '', buildSpecsBody_({
      外観: '無色再帰透明状', '配合比（主剤：硬化剤）': '3:1', '粘度（25℃）': '300mPa・s', 比重: '1.09',
      可使時間: '0.88分', '脱型可能時間（25℃）': '180分', 完全硬化時間: '12-24時間',
      圧縮強さ: '252MPa', 引張強さ: '40.9MPa', 曲げ強さ: '80.9MPa', シャルピー衝撃値: '8.10KJ/m2', 最大硬度: '88（シュアD）'
    }), '', '', '', '', ''],
    ['アート用', '', buildSpecsBody_({
      外観: '微渡再色透明状', '配合比（主剤：硬化剤）': '3:1', '粘度（25℃）': '5700mPa・s', 比重: '1.15',
      可使時間: '1.05分', '脱型可能時間（25℃）': '45分', 完全硬化時間: '10-20時間',
      圧縮強さ: '168MPa', 引張強さ: '41.6MPa', 曲げ強さ: '34.3MPa', シャルピー衝撃値: '15.7KJ/m2', 最大硬度: '83（シュアD）'
    }), '', '', '', '', ''],
    ['クラフト用', '', buildSpecsBody_({
      外観: '微渡再色透明状', '配合比（主剤：硬化剤）': '3:1', '粘度（25℃）': '200mPa・s', 比重: '1.08',
      可使時間: '0.88分', '脱型可能時間（25℃）': '240分', 完全硬化時間: '24-48時間',
      圧縮強さ: '178MPa', 引張強さ: '40.3MPa', 曲げ強さ: '50.7MPa', シャルピー衝撃値: '9.96KJ/m2', 最大硬度: '86（シュアD）'
    }), '', '', '', '', ''],
    ['備考', '', 'パンフレット記載の実測値（2026年1月時点データ）', '', '', '', '', '']
  ]));

  // P40_WORKS（施工事例）はResi Art Floor専用：Before/Afterのグリッド（メイン）＋
  // 完成事例ギャラリーのカルーセルの2行構成。看板・テーブルはP30_SERVICE側の
  // 各行（メイン＋ギャラリー）に統合したため、ここには含めない。
  results.push(seedContentSheet_(ss, 'P40_WORKS', [
    ['Before / After', '', '', '1sTp76AimT7D1zN0toenm8pMC5KVYthb_', '', '', 'grid', ''],
    ['Gallery', '', '', '1pTU0wNfKN_rEjhEM30E2LWJnXYL-7RZ7', '', '', 'carousel', '']
  ]));

  var logoFileId = '1SY93X2cpJFdqevmXeixt8SUFq6q9bbjC';
  results.push(seedCompanyRow_(ss, 'numan', '株式会社トリニティリンク', '529-1443', '滋賀県近江八幡市白鳥町151-1 五番街テナントD', 'レジン施工・空間デザイン', logoFileId));

  // Web公開ページ（GitHub Pages＝匿名アクセス）から画像を表示するには、
  // Driveの各画像フォルダ・ロゴファイルが「リンクを知っている全員が閲覧可」になっている必要がある。
  // 未設定だとdriveFileIdToWebUrl_で作ったURLがGoogleのログイン画面にリダイレクトされ、
  // 画像が壊れたアイコンになる（今回発覧した不具合の原因）。③実行のたびに強制的に揃える。
  var imageFolderIds = [
    '1sun3XCevGJQsbK87nX0Uyqqj29byYGDa', // P10_CONCEPT メインビジュアル
    FEATURES_FOLDER_ID,
    '1jt8tQjXTrkGVVLafY3nItUATSkOQ6OZ4', // Sign
    '1sz3CnIHjjdYRzQaNTQfBzQzvnT2vsORD', // Sign_Gallery
    '1S1z4_XaC_dczGTQS8BP4j8GteGy75A7S', // Table
    '1lUvo0uN1m21dfCIcq-Kb-equpzR-lU14', // Table_Gallery
    '1sTp76AimT7D1zN0toenm8pMC5KVYthb_', // Floor_BeforeAfter
    '1pTU0wNfKN_rEjhEM30E2LWJnXYL-7RZ7'  // Floor_Gallery
  ];
  var sharingNotes = imageFolderIds.map(ensureFolderPubliclyViewable_);
  sharingNotes.push(ensureFilePubliclyViewable_(logoFileId));
  var sharingFailures = sharingNotes.filter(function (n) { return n && !n.ok; });
  results.push({
    name: '画像の公開設定',
    ok: sharingFailures.length === 0,
    message: sharingFailures.length === 0
      ? '全フォルダ・ロゴを「リンクを知っている全員が閲覧可」に設定しました'
      : sharingFailures.map(function (n) { return n.id + '：' + n.message; }).join(' / ')
  });

  return results;
}

/** Driveフォルダを「リンクを知っている全員が閲覧可」に設定する（既に十分な公開設定なら何もしない） */
function ensureFolderPubliclyViewable_(folderId) {
  return ensurePubliclyViewable_(folderId, function () { return DriveApp.getFolderById(folderId); });
}

/** Driveファイルを「リンクを知っている全員が閲覧可」に設定する（既に十分な公開設定なら何もしない） */
function ensureFilePubliclyViewable_(fileId) {
  return ensurePubliclyViewable_(fileId, function () { return DriveApp.getFileById(fileId); });
}

/**
 * すでに「リンクを知っている全員（閲覧または編集）」以上の公開設定になっている場合は
 * setSharing()を呼ばない。すでにANYONE_WITH_LINK(Writer)の項目に対してVIEWへ変更しようとすると
 * アカウント側の設定によっては「アクセスが拒否されました」になるケースがあるため、
 * 既に目的を満たしている（＝匿名で閲覧できる）場合は何もしないことでこれを避ける。
 */
function ensurePubliclyViewable_(id, getItem) {
  try {
    var item = getItem();
    var access = item.getSharingAccess();
    if (access === DriveApp.Access.ANYONE || access === DriveApp.Access.ANYONE_WITH_LINK) {
      return { id: id, ok: true, message: '既に公開設定済み' };
    }
    item.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { id: id, ok: true, message: '公開設定にしました' };
  } catch (e) {
    return { id: id, ok: false, message: e.message };
  }
}

/** {項目名: 値} を「項目名：値」の改行区切りテキストに変換（specsテンプレートのbody用） */
function buildSpecsBody_(props) {
  var lines = [];
  for (var key in props) {
    if (Object.prototype.hasOwnProperty.call(props, key)) {
      lines.push(key + '：' + props[key]);
    }
  }
  return lines.join('\n');
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

/** 会社マスターの既存company_id行へ会社名・郵便番号・住所・業務内容・ロゴを更新（TEL等の他列は変更しない） */
function seedCompanyRow_(ss, companyId, name, postalCode, address, business, logoFileId) {
  var sheetName = SHEET_NAMES.COMPANY;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { name: sheetName, ok: false, message: 'シートが存在しません' };
  ensureCompanyBusinessColumn_(sheet);
  var data = sheet.getDataRange().getValues();
  var businessCol = COMPANY_HEADERS.indexOf('業務内容') + 1;
  var logoCol = COMPANY_HEADERS.indexOf('ロゴ') + 1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === companyId) {
      sheet.getRange(i + 1, 2, 1, 3).setValues([[name, postalCode, address]]);
      sheet.getRange(i + 1, businessCol, 1, 1).setValue(business);
      if (logoFileId) sheet.getRange(i + 1, logoCol, 1, 1).setValue(logoFileId);
      return { name: sheetName, ok: true, message: 'company_id=' + companyId + ' の行（会社名・郵便番号・住所・業務内容・ロゴ）を更新しました' };
    }
  }
  return { name: sheetName, ok: false, message: 'company_id=' + companyId + ' の行が見つかりません。「①初期設定」で会社マスターにサンプル行が作成されているか確認してください。' };
}

/** 既存の会社マスターシートに「業務内容」列（COMPANY_HEADERS末尾）が無ければ見出しを追加する（列構成の後方互換マイグレーション） */
function ensureCompanyBusinessColumn_(sheet) {
  var col = COMPANY_HEADERS.indexOf('業務内容') + 1;
  var current = String(sheet.getRange(1, col).getValue() || '').trim();
  if (current !== '業務内容') {
    sheet.getRange(1, col).setValue('業務内容').setFontWeight('bold').setBackground('#f0f0f0');
    sheet.setColumnWidth(col, 200);
  }
}
