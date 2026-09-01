/**
 * LINE公式アカウント「Web_カタログ」に送られた画像を、選択したカテゴリのDriveフォルダへ振り分ける。
 * 既存のdoGet（Web表示API）・①②③メニュー機能（Code.gs/Setup.gs/SettingsCheck.gs/SeedResiArtData.gs）
 * には一切手を加えていない。GASのWeb Appは同一デプロイでGET→doGet、POST→doPostに自動振り分けされるため、
 * doGet側の変更は不要。
 *
 * カテゴリ→DriveフォルダIDの対応表はLINE_IMAGE_SORT_CATEGORIES一箇所にまとめてある。
 * 将来カテゴリを追加・変更する場合はここだけを編集すればよい。
 * P40_WORKS以外（例：P10_CONCEPTのメインビジュアル）にも流用できるよう、
 * カテゴリと投入先ページを紐付ける固有ロジックは持たせていない（フォルダへの振り分けのみを行う）。
 *
 * 【注意】Apps ScriptのWeb App（doPost）はリクエストヘッダーを参照できない仕様のため、
 * LINEの署名（X-Line-Signature）検証は実装できない。Webhook URLを秘匿することが実質的な防御線になる。
 */

var LINE_IMAGE_SORT_CATALOG_ID = 'resiart';
var LINE_IMAGE_SORT_ACTION = 'image_sort';
var LINE_TEMP_FOLDER_NAME = '_LINE受信一時';

var LINE_IMAGE_SORT_CATEGORIES = [
  { key: 'main_visual', label: '① メインビジュアル', folderId: '1sun3XCevGJQsbK87nX0Uyqqj29byYGDa' },
  { key: 'before_after', label: '② 床施工Before/After', folderId: '1sTp76AimT7D1zN0toenm8pMC5KVYthb_' },
  { key: 'sign', label: '③ 看板', folderId: '1jt8tQjXTrkGVVLafY3nItUATSkOQ6OZ4' },
  { key: 'table', label: '④ テーブル', folderId: '1S1z4_XaC_dczGTQS8BP4j8GteGy75A7S' }
];

function doPost(e) {
  try {
    var contents = e && e.postData && e.postData.contents;
    if (contents) {
      var body = JSON.parse(contents);
      var events = body.events || [];
      events.forEach(function (event) {
        if (event.type === 'message' && event.message && event.message.type === 'image') {
          handleLineImageMessage_(event);
        } else if (event.type === 'postback') {
          handleLineImageSortPostback_(event);
        }
      });
    }
  } catch (err) {
    Logger.log('doPost error: ' + err.message);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

/** 画像メッセージ受信：一時フォルダへ保存→_作成中シートに記録→カテゴリ選択のQuick Replyを返信 */
function handleLineImageMessage_(event) {
  var token = getLineAccessToken_();
  if (!token) return;

  var messageId = event.message.id;
  var userId = (event.source && event.source.userId) || '';

  var imageBlob = fetchLineImageContent_(messageId, token);
  var ext = (imageBlob.getContentType() || '').indexOf('png') !== -1 ? '.png' : '.jpg';
  var folder = getOrCreateLineTempFolder_();
  var file = folder.createFile(imageBlob).setName(messageId + ext);

  recordDraftRow_(userId, LINE_IMAGE_SORT_CATALOG_ID, LINE_IMAGE_SORT_ACTION, file.getId());
  replyLineImageSortQuickReply_(event.replyToken, file.getId());
}

/** LINE Content APIから画像バイナリを取得 */
function fetchLineImageContent_(messageId, token) {
  var res = UrlFetchApp.fetch('https://api-data.line.me/v2/bot/message/' + messageId + '/content', {
    method: 'get',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });
  return res.getBlob();
}

/** Drive素材ルートフォルダ配下の「_LINE受信一時」フォルダを取得（無ければ作成） */
function getOrCreateLineTempFolder_() {
  var rootId = getSettingValue_('Google Drive素材ルートフォルダID');
  if (!rootId) throw new Error('Google Drive素材ルートフォルダIDが未設定です');
  var root = DriveApp.getFolderById(rootId);
  var existing = root.getFoldersByName(LINE_TEMP_FOLDER_NAME);
  if (existing.hasNext()) return existing.next();
  return root.createFolder(LINE_TEMP_FOLDER_NAME);
}

/** 「_作成中」シートへ振り分け待ちレコードを1行追加 */
function recordDraftRow_(userId, catalogId, action, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.DRAFT);
  if (!sheet) return;
  sheet.appendRow([userId, catalogId, action, '', data, new Date(), '']);
}

/** 「_作成中」シートから該当レコード（action+data一致）を削除 */
function removeDraftRow_(action, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.DRAFT);
  if (!sheet) return;
  var values = sheet.getDataRange().getValues();
  for (var i = values.length - 1; i >= 1; i--) {
    if (values[i][2] === action && values[i][4] === data) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

/** カテゴリ選択ボタン（Quick Reply／postback）を返信。dataに一時ファイルIDを含めるため、
 *  複数画像を続けて送っても後続の選択が別画像と混同しない。 */
function replyLineImageSortQuickReply_(replyToken, tempFileId) {
  var items = LINE_IMAGE_SORT_CATEGORIES.map(function (c) {
    return {
      type: 'action',
      action: {
        type: 'postback',
        label: c.label,
        data: 'action=' + LINE_IMAGE_SORT_ACTION + '&key=' + c.key + '&file=' + tempFileId,
        displayText: c.label + 'を選択'
      }
    };
  });
  lineReply_(replyToken, [{
    type: 'text',
    text: '保存先カテゴリを選んでください',
    quickReply: { items: items }
  }]);
}

/** カテゴリ選択（postback）：一時フォルダから対象カテゴリのフォルダへファイルを移動し、記録を削除して完了を返信 */
function handleLineImageSortPostback_(event) {
  var params = parseLinePostbackData_(event.postback.data);
  if (params.action !== LINE_IMAGE_SORT_ACTION) return;

  var category = LINE_IMAGE_SORT_CATEGORIES.filter(function (c) { return c.key === params.key; })[0];
  if (!category) return;

  var fileId = params.file;
  try {
    var file = DriveApp.getFileById(fileId);
    var destFolder = DriveApp.getFolderById(category.folderId);
    file.moveTo(destFolder);
  } catch (err) {
    Logger.log('image move error: ' + err.message);
    lineReply_(event.replyToken, [{ type: 'text', text: '保存に失敗しました：' + err.message }]);
    return;
  }

  removeDraftRow_(LINE_IMAGE_SORT_ACTION, fileId);
  lineReply_(event.replyToken, [{ type: 'text', text: '「' + category.label + '」に保存しました' }]);
}

function parseLinePostbackData_(data) {
  var result = {};
  (data || '').split('&').forEach(function (pair) {
    var kv = pair.split('=');
    if (kv[0]) result[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
  });
  return result;
}

/** LINEアクセストークンを取得（②設定チェック実行後はScript Propertiesから、未検証時は設定シートの生値から） */
function getLineAccessToken_() {
  var token = PropertiesService.getScriptProperties().getProperty(SCRIPT_PROP_LINE_TOKEN);
  if (token) return token;
  var raw = getSettingValue_('LINEアクセストークン');
  return (raw && raw !== TOKEN_MASK) ? raw : '';
}

/** LINE Messaging APIのreply APIを呼び出す */
function lineReply_(replyToken, messages) {
  var token = getLineAccessToken_();
  if (!token || !replyToken) return;
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ replyToken: replyToken, messages: messages }),
    muteHttpExceptions: true
  });
}
