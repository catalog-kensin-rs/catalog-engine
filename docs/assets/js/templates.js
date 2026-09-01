/**
 * page_type ごとの描画テンプレート（共通カタログエンジン）
 * 商品固有のロジックはここに書かない。新しい page_type を追加する場合は
 * このファイルに CATALOG_TEMPLATES へキーを1つ追加するだけでよい。
 * 未対応の page_type は CATALOG_TEMPLATES.custom にフォールバックする。
 */

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nl2br(str) {
  return escapeHtml(str).replace(/\n/g, '<br>');
}

function section(pageId, pageType, innerHtml, extraClass) {
  return '<section id="page-' + escapeHtml(pageId) + '" class="page-section page-type-' + escapeHtml(pageType) + (extraClass ? ' ' + extraClass : '') + '">' + innerHtml + '</section>';
}

function imageTag(url, alt) {
  return '<img src="' + escapeHtml(url) + '" alt="' + escapeHtml(alt || '') + '" loading="lazy">';
}

window.CATALOG_TEMPLATES = {

  hero: function (page) {
    var item = (page.items && page.items[0]) || {};
    var bg = item.images && item.images[0] ? item.images[0] : '';
    var style = bg ? ' style="background-image:url(\'' + escapeHtml(bg) + '\')"' : '';
    var html = '<div class="hero-block"' + style + '>' +
      '<div class="hero-overlay">' +
      (page.page_name ? '<p class="hero-eyebrow">' + escapeHtml(page.page_name) + '</p>' : '') +
      (item.title ? '<h2 class="hero-title">' + escapeHtml(item.title) + '</h2>' : '') +
      (item.subtitle ? '<p class="hero-subtitle">' + escapeHtml(item.subtitle) + '</p>' : '') +
      (item.body ? '<p class="hero-body">' + nl2br(item.body) + '</p>' : '') +
      '</div></div>';
    return section(page.page_id, page.page_type, html);
  },

  text: function (page) {
    var blocks = (page.items || []).map(function (item) {
      return '<div class="text-block">' +
        (item.title ? '<h3>' + escapeHtml(item.title) + '</h3>' : '') +
        (item.subtitle ? '<p class="subtitle">' + escapeHtml(item.subtitle) + '</p>' : '') +
        (item.body ? '<p class="body">' + nl2br(item.body) + '</p>' : '') +
        '</div>';
    }).join('');
    return section(page.page_id, page.page_type, '<h2 class="page-title">' + escapeHtml(page.page_name) + '</h2>' + blocks);
  },

  image_text: function (page) {
    var blocks = (page.items || []).map(function (item, i) {
      var reversed = (item.layout_type === 'reverse') || (i % 2 === 1);
      return '<div class="image-text-row' + (reversed ? ' reversed' : '') + '">' +
        '<div class="image-text-media">' + (item.images && item.images[0] ? imageTag(item.images[0], item.title) : '') + '</div>' +
        '<div class="image-text-content">' +
        (item.title ? '<h3>' + escapeHtml(item.title) + '</h3>' : '') +
        (item.subtitle ? '<p class="subtitle">' + escapeHtml(item.subtitle) + '</p>' : '') +
        (item.body ? '<p class="body">' + nl2br(item.body) + '</p>' : '') +
        '</div></div>';
    }).join('');
    return section(page.page_id, page.page_type, '<h2 class="page-title">' + escapeHtml(page.page_name) + '</h2>' + blocks);
  },

  features: function (page) {
    var cards = (page.items || []).map(function (item) {
      return '<div class="feature-card">' +
        (item.images && item.images[0] ? '<div class="feature-media">' + imageTag(item.images[0], item.title) + '</div>' : '') +
        (item.title ? '<h3>' + escapeHtml(item.title) + '</h3>' : '') +
        (item.subtitle ? '<p class="subtitle">' + escapeHtml(item.subtitle) + '</p>' : '') +
        (item.body ? '<p class="body">' + nl2br(item.body) + '</p>' : '') +
        '</div>';
    }).join('');
    return section(page.page_id, page.page_type, '<h2 class="page-title">' + escapeHtml(page.page_name) + '</h2><div class="feature-grid">' + cards + '</div>');
  },

  gallery: function (page) {
    var tiles = [];
    (page.items || []).forEach(function (item) {
      (item.images || []).forEach(function (url) {
        tiles.push('<figure class="gallery-tile">' + imageTag(url, item.title) +
          (item.caption ? '<figcaption>' + escapeHtml(item.caption) + '</figcaption>' : '') + '</figure>');
      });
    });
    return section(page.page_id, page.page_type, '<h2 class="page-title">' + escapeHtml(page.page_name) + '</h2><div class="gallery-grid">' + tiles.join('') + '</div>');
  },

  before_after: function (page) {
    var rows = (page.items || []).map(function (item) {
      var before = item.images && item.images[0];
      var after = item.images && item.images[1];
      return '<div class="before-after-row">' +
        '<div class="ba-col"><p class="ba-label">Before</p>' + (before ? imageTag(before, item.title) : '') + '</div>' +
        '<div class="ba-col"><p class="ba-label">After</p>' + (after ? imageTag(after, item.title) : '') + '</div>' +
        (item.title ? '<h3 class="ba-title">' + escapeHtml(item.title) + '</h3>' : '') +
        '</div>';
    }).join('');
    return section(page.page_id, page.page_type, '<h2 class="page-title">' + escapeHtml(page.page_name) + '</h2>' + rows);
  },

  specs: function (page) {
    var rows = (page.items || []).map(function (item) {
      return '<tr><th>' + escapeHtml(item.title) + '</th><td>' + nl2br(item.body) + '</td></tr>';
    }).join('');
    return section(page.page_id, page.page_type, '<h2 class="page-title">' + escapeHtml(page.page_name) + '</h2><table class="specs-table"><tbody>' + rows + '</tbody></table>');
  },

  company: function (page, catalog, company) {
    var c = company || page.company;
    if (!c) return section(page.page_id, page.page_type, '<h2 class="page-title">' + escapeHtml(page.page_name) + '</h2><p>会社情報が設定されていません。</p>');
    var rows = [
      ['所在地', (c.postal_code ? '〒' + c.postal_code + ' ' : '') + (c.address || '')],
      ['業務内容', c.business],
      ['TEL', c.tel],
      ['FAX', c.fax],
      ['MAIL', c.mail],
      ['WEB', c.web ? '<a href="' + escapeHtml(c.web) + '" target="_blank" rel="noopener">' + escapeHtml(c.web) + '</a>' : ''],
      ['Instagram', c.instagram ? '<a href="' + escapeHtml(c.instagram) + '" target="_blank" rel="noopener">' + escapeHtml(c.instagram) + '</a>' : ''],
      ['LINE', c.line],
      ['代表者', c.representative],
      ['担当者', c.contact_person],
      ['営業時間', c.business_hours],
      ['対応エリア', c.service_area],
      ['お問い合わせ', c.inquiry]
    ].filter(function (r) { return r[1]; })
      .map(function (r) { return '<tr><th>' + escapeHtml(r[0]) + '</th><td>' + (r[0] === 'WEB' || r[0] === 'Instagram' ? r[1] : nl2br(r[1])) + '</td></tr>'; })
      .join('');
    return section(page.page_id, page.page_type,
      '<h2 class="page-title">' + escapeHtml(page.page_name) + '</h2>' +
      '<div class="company-block">' +
      (c.logo ? '<div class="company-logo">' + imageTag(c.logo, c.name) + '</div>' : '') +
      '<h3 class="company-name">' + escapeHtml(c.name) + '</h3>' +
      '<table class="specs-table"><tbody>' + rows + '</tbody></table>' +
      '</div>');
  },

  video: function (page) {
    var blocks = (page.items || []).map(function (item) {
      var embed = '';
      if (item.link && /youtu\.?be/.test(item.link)) {
        var id = (item.link.match(/(?:v=|youtu\.be\/)([\w-]+)/) || [])[1];
        if (id) embed = '<div class="video-embed"><iframe src="https://www.youtube.com/embed/' + escapeHtml(id) + '" allowfullscreen loading="lazy"></iframe></div>';
      }
      if (!embed && item.link) embed = '<p class="video-link"><a href="' + escapeHtml(item.link) + '" target="_blank" rel="noopener">' + escapeHtml(item.link) + '</a></p>';
      return '<div class="video-block">' +
        (item.title ? '<h3>' + escapeHtml(item.title) + '</h3>' : '') +
        embed +
        (item.body ? '<p class="body">' + nl2br(item.body) + '</p>' : '') +
        '</div>';
    }).join('');
    return section(page.page_id, page.page_type, '<h2 class="page-title">' + escapeHtml(page.page_name) + '</h2>' + blocks);
  },

  contact: function (page, catalog, company) {
    var c = company;
    var contactLines = [];
    if (c && c.tel) contactLines.push('<p class="contact-line">TEL：<a href="tel:' + escapeHtml(c.tel) + '">' + escapeHtml(c.tel) + '</a></p>');
    if (c && c.mail) contactLines.push('<p class="contact-line">MAIL：<a href="mailto:' + escapeHtml(c.mail) + '">' + escapeHtml(c.mail) + '</a></p>');
    if (c && c.line) contactLines.push('<p class="contact-line">LINE：' + escapeHtml(c.line) + '</p>');
    var blocks = (page.items || []).map(function (item) {
      return (item.title ? '<h3>' + escapeHtml(item.title) + '</h3>' : '') +
        (item.body ? '<p class="body">' + nl2br(item.body) + '</p>' : '');
    }).join('');
    return section(page.page_id, page.page_type, '<h2 class="page-title">' + escapeHtml(page.page_name) + '</h2><div class="contact-block">' + blocks + contactLines.join('') + '</div>');
  },

  custom: function (page) {
    var blocks = (page.items || []).map(function (item) {
      return '<div class="custom-block">' +
        (item.title ? '<h3>' + escapeHtml(item.title) + '</h3>' : '') +
        (item.subtitle ? '<p class="subtitle">' + escapeHtml(item.subtitle) + '</p>' : '') +
        (item.body ? '<p class="body">' + nl2br(item.body) + '</p>' : '') +
        (item.images && item.images.length ? '<div class="custom-images">' + item.images.map(function (u) { return imageTag(u, item.title); }).join('') + '</div>' : '') +
        '</div>';
    }).join('');
    return section(page.page_id, page.page_type, '<h2 class="page-title">' + escapeHtml(page.page_name) + '</h2>' + blocks);
  }
};
