/**
 * Drive画像のWeb表示URL変換（共通関数・6章）
 * Google側の仕様変更に対応できるよう、変換処理はこの1か所に集約する。
 */

function driveFileIdToWebUrl_(fileId, width) {
  if (!fileId) return '';
  var w = width || 1600;
  return 'https://lh3.googleusercontent.com/d/' + fileId + '=w' + w;
}

/**
 * 画像フォルダID配下の画像ファイルをWeb表示URLの配列として返す。
 * ファイル名の昇順で返す。
 */
function listFolderImageUrls_(folderId, width) {
  if (!folderId) return [];
  var urls = [];
  try {
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFiles();
    var items = [];
    while (files.hasNext()) {
      var file = files.next();
      var mime = file.getMimeType();
      if (mime.indexOf('image/') === 0) {
        items.push({ name: file.getName(), id: file.getId() });
      }
    }
    items.sort(function (a, b) { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0); });
    urls = items.map(function (it) { return driveFileIdToWebUrl_(it.id, width); });
  } catch (e) {
    // フォルダが存在しない／権限がない場合は空配列を返す
    urls = [];
  }
  return urls;
}
