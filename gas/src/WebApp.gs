/**
 * GAS Web App（Phase2・3章）
 * doGet で JSON（カタログ／ページ／会社情報）を返す。
 * 処理フロー：catalog_id取得 → 対象カタログ取得 → 公開中ページ取得 → order順
 * → ページ内容取得 → Drive画像取得 → 会社情報取得 → JSON化
 * page_typeごとの描画はWeb側（クライアント）が行う。ここでは商品固有ロジックを持たない。
 */

function doGet(e) {
  var params = (e && e.parameter) || {};
  var result;
  try {
    result = buildCatalogResponse_(params);
  } catch (err) {
    result = { ok: false, error: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function buildCatalogResponse_(params) {
  var catalogParam = params.catalog;
  if (!catalogParam) {
    return { ok: false, error: 'catalog パラメータが指定されていません' };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var catalog = findCatalog_(ss, catalogParam);
  if (!catalog) {
    return { ok: false, error: '指定されたカタログが見つからないか、非公開です' };
  }

  var pages = getPublishedPages_(ss, catalog.catalog_id);
  var companyOverride = params.company || null;
  var company = null;

  var resultPages = pages.map(function (pageRow) {
    var pageData = readPageContent_(ss, pageRow, companyOverride);
    if (pageData.page_type === 'company' && pageData.company) {
      company = pageData.company;
    }
    return pageData;
  });

  return {
    ok: true,
    catalog: {
      catalog_id: catalog.catalog_id,
      name: catalog.name,
      slug: catalog.slug,
      theme: catalog.theme
    },
    company: company,
    pages: resultPages
  };
}

function findCatalog_(ss, catalogParam) {
  var sheet = ss.getSheetByName(SHEET_NAMES.CATALOG);
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var catalogId = row[0];
    var published = row[1];
    var catalogName = row[2];
    var slug = row[3];
    var theme = row[4];
    if ((catalogId === catalogParam || slug === catalogParam) && published === true) {
      return { catalog_id: catalogId, name: catalogName, slug: slug, theme: theme };
    }
  }
  return null;
}

function getPublishedPages_(ss, catalogId) {
  var sheet = ss.getSheetByName(SHEET_NAMES.PAGE);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0] === catalogId && row[6] === true) {
      rows.push({
        catalog_id: row[0],
        order: row[1],
        page_id: row[2],
        page_name: row[3],
        sheet_name: row[4],
        page_type: row[5],
        published: row[6]
      });
    }
  }
  rows.sort(function (a, b) { return a.order - b.order; });
  return rows;
}

function readPageContent_(ss, pageRow, companyOverride) {
  var sheet = ss.getSheetByName(pageRow.sheet_name);
  var base = {
    page_id: pageRow.page_id,
    page_name: pageRow.page_name,
    page_type: pageRow.page_type,
    order: pageRow.order
  };

  if (!sheet) {
    base.items = [];
    return base;
  }

  if (pageRow.page_type === 'company') {
    var companyId = companyOverride || readCompanyPageDefaultId_(sheet);
    base.company = companyId ? findCompany_(ss, companyId) : null;
    return base;
  }

  base.items = readContentRows_(sheet);
  return base;
}

function readCompanyPageDefaultId_(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length > 1 && data[1][0]) return data[1][0];
  return null;
}

function readContentRows_(sheet) {
  var data = sheet.getDataRange().getValues();
  var items = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] && !row[1] && !row[2]) continue; // 完全空行はスキップ
    var imageFolderId = row[3];
    items.push({
      title: row[0] || '',
      subtitle: row[1] || '',
      body: row[2] || '',
      images: imageFolderId ? listFolderImageUrls_(imageFolderId) : [],
      caption: row[4] || '',
      link: row[5] || '',
      layout_type: row[6] || '',
      background: row[7] || ''
    });
  }
  return items;
}

function findCompany_(ss, companyId) {
  var sheet = ss.getSheetByName(SHEET_NAMES.COMPANY);
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0] === companyId) {
      return {
        company_id: row[0],
        name: row[1],
        postal_code: row[2],
        address: row[3],
        tel: row[4],
        fax: row[5],
        mail: row[6],
        web: row[7],
        instagram: row[8],
        line: row[9],
        representative: row[10],
        contact_person: row[11],
        business_hours: row[12],
        service_area: row[13],
        inquiry: row[14],
        logo: row[15] ? driveFileIdToWebUrl_(row[15], 400) : '',
        business: row[16] || ''
      };
    }
  }
  return null;
}
