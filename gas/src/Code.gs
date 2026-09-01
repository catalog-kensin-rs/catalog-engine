/**
 * カタログWeb管理システム - 共通定数・メニュー
 * 実装指示書「カタログWeb管理システム｜実装指示書（for Claude Code）」4章・5章準拠
 */

var SHEET_NAMES = {
  SETTINGS: '設定',
  CATALOG: 'カタログ管理',
  PAGE: 'ページ管理',
  COMPANY: '会社マスター',
  DRAFT: '_作成中'
};

// 設定シートの項目名（キー）とセル位置（2行目以降、A列=項目名固定）
var SETTINGS_ITEMS = [
  { key: 'システム名', note: '例：Resi Art カタログ' },
  { key: 'LINEアクセストークン', note: '「② 設定チェック」実行で検証後、自動的にScript Propertiesへ保存されます' },
  { key: 'Google Drive素材ルートフォルダID', note: '画像・ロゴ等を格納するDriveフォルダのID（URLの/folders/以降の文字列）' },
  { key: 'Web公開URL', note: 'GitHub PagesのカタログWeb公開URL' }
];

var SCRIPT_PROP_LINE_TOKEN = 'LINE_ACCESS_TOKEN';
var TOKEN_MASK = '●●●保存済み';

var CATALOG_HEADERS = ['catalog_id', '公開', 'カタログ名', 'slug', 'テーマ', '更新日'];
var PAGE_HEADERS = ['catalog_id', 'order', 'page_id', 'ページ名', 'sheet_name', 'page_type', '公開'];
var COMPANY_HEADERS = ['company_id', '会社名', '郵便番号', '住所', 'TEL', 'FAX', 'MAIL', 'WEB', 'Instagram', 'LINE', '代表者', '担当者', '営業時間', '対応エリア', '問い合わせ先', 'ロゴ'];
var PAGE_CONTENT_HEADERS = ['タイトル', 'サブタイトル', '本文', '画像フォルダID', 'キャプション', 'リンク', 'レイアウトタイプ', '背景設定'];
var COMPANY_PAGE_HEADERS = ['company_id'];
var DRAFT_HEADERS = ['userId', 'catalogId', 'action', 'step', 'data', 'updated', 'previousStep'];

var PAGE_TYPES = ['hero', 'text', 'image_text', 'features', 'gallery', 'before_after', 'specs', 'company', 'video', 'contact', 'custom'];

// Resi Art 初期ページ構成（4-2章）
var INITIAL_CATALOG_ID = 'resiart';
var INITIAL_PAGES = [
  // order, page_id, ページ名, sheet_name, page_type, 公開
  [10, 'concept', 'コンセプト', 'P10_CONCEPT', 'hero', false],
  [20, 'features', 'FEATURES', 'P20_FEATURES', 'features', false],
  [30, 'service', 'SERVICE', 'P30_SERVICE', 'text', false],
  [40, 'works', '施工事例', 'P40_WORKS', 'gallery', false],
  [50, 'technical', 'TECHNICAL DATA', 'P50_TECHNICAL', 'specs', false],
  [60, 'company', '会社情報', 'P60_COMPANY', 'company', false]
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚙️ カタログ管理')
    .addItem('① 初期設定', 'runInitialSetup')
    .addItem('② 設定チェック', 'runSettingsCheck')
    .addItem('③ Resi Art データ投入（Phase3）', 'runSeedResiArtData')
    .addToUi();
}

/** 設定シートから項目値を読む（表示がマスクなら Script Properties を優先） */
function getSettingValue_(key) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  if (!sheet) return '';
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === key) {
      return values[i][1];
    }
  }
  return '';
}
