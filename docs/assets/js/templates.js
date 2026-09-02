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

/**
 * specsテンプレート用：本文の「項目：値」改行区切りテキストを{項目: 値}へパースする。
 * 「：」を優先区切りとする（値側に半角「:」を含む場合があるため、行内で最後に
 * 現れる全角「：」を区切り位置とする。全角「：」が無ければ半角「:」にフォールバック）。
 * 区切りが1つも見つからなければnullを返す（＝備考等の非表形式行として扱う）。
 */
function parseSpecsBody_(body) {
  if (!body) return null;
  var lines = String(body).split('\n');
  var props = {};
  var found = false;
  lines.forEach(function (line) {
    if (!line) return;
    var idx = line.lastIndexOf('：');
    if (idx === -1) idx = line.indexOf(':');
    if (idx > 0) {
      var key = line.slice(0, idx).trim();
      var value = line.slice(idx + 1).trim();
      if (key) {
        props[key] = value;
        found = true;
      }
    }
  });
  return found ? props : null;
}

function section(pageId, pageType, innerHtml, extraClass) {
  return '<section id="page-' + escapeHtml(pageId) + '" class="page-section page-type-' + escapeHtml(pageType) + (extraClass ? ' ' + extraClass : '') + '">' + innerHtml + '</section>';
}

/**
 * セクション冒頭の見出し階層（英字ラベル→大見出し）を共通化する。
 * 英字ラベルはpage_id（"features"等、既存データに含まれる識別子）をそのまま使う
 * ＝新しいデータ項目を増やさずに済む。
 */
function sectionHeading_(page) {
  return '<div class="section-heading reveal">' +
    (page.page_id ? '<p class="section-eyebrow">' + escapeHtml(page.page_id) + '</p>' : '') +
    '<h2 class="page-title">' + escapeHtml(page.page_name) + '</h2>' +
    '</div>';
}

function imageTag(url, alt) {
  return '<img src="' + escapeHtml(url) + '" alt="' + escapeHtml(alt || '') + '" loading="lazy">';
}

window.CATALOG_TEMPLATES = {

  hero: function (page, catalog, company) {
    // 情報を絞る：ロゴ＋キャッチコピー＋英字タグラインのみ（補足説明の本文は表示しない）。
    // 会社マスターにロゴが設定されている場合は、タイトルのテキストではなくロゴ画像を表示する
    // （商品名テキストの代わりにブランドロゴを見せる、という汎用的な切り替えなので商品固有ロジックにはしていない）。
    // 英字タグラインは既存の「キャプション」列を流用する（新規データ項目を増やさない）。
    var item = (page.items && page.items[0]) || {};
    var bg = item.images && item.images[0] ? item.images[0] : '';
    var style = bg ? ' style="background-image:url(\'' + escapeHtml(bg) + '\')"' : '';
    var titleHtml = (company && company.logo)
      ? '<img class="hero-logo" src="' + escapeHtml(company.logo) + '" alt="' + escapeHtml(item.title || '') + '">'
      : (item.title ? '<h2 class="hero-title">' + escapeHtml(item.title) + '</h2>' : '');
    var html = '<div class="hero-block"' + style + '>' +
      '<div class="hero-overlay">' +
      (page.page_name ? '<p class="hero-eyebrow">' + escapeHtml(page.page_name) + '</p>' : '') +
      titleHtml +
      (item.subtitle ? '<p class="hero-catchcopy">' + escapeHtml(item.subtitle) + '</p>' : '') +
      (item.caption ? '<p class="hero-tagline">' + escapeHtml(item.caption) + '</p>' : '') +
      '</div></div>';
    return section(page.page_id, page.page_type, html);
  },

  text: function (page) {
    // 画像フォルダの先頭2枚をメイン写真として横並び表示し、3枚目以降は
    // gallery側と同じ横スクロールカルーセル（.gallery-carousel/.gallery-tile）で表示する。
    // ただしレイアウトタイプ=carouselの行は「別ギャラリー行」として、
    // 先頭2枚メイン分けをせず全画像を1本のカルーセルにする。
    // 画像枚数は可変（今後Drive側に追加されていく想定）なので枚数固定にしない。
    // CSSファイルには手を加えない指示のため、レイアウトはインラインスタイルで対応する。
    var blocks = (page.items || []).map(function (item) {
      var images = item.images || [];
      var isGalleryRow = String(item.layout_type || '').trim().toLowerCase() === 'carousel';

      var mainHtml = '';
      var carouselHtml = '';

      if (isGalleryRow) {
        carouselHtml = images.length
          ? '<div class="gallery-carousel">' +
            images.map(function (url) {
              return '<figure class="gallery-tile">' + imageTag(url, item.title) + '</figure>';
            }).join('') +
            '</div>'
          : '';
      } else {
        var mainImages = images.slice(0, 2);
        var restImages = images.slice(2);
        mainHtml = mainImages.length
          ? '<div style="display:flex;flex-wrap:wrap;gap:1rem;margin:0.75rem 0;">' +
            mainImages.map(function (url) {
              return '<div style="flex:1 1 220px;min-width:0;">' + imageTag(url, item.title) + '</div>';
            }).join('') +
            '</div>'
          : '';
        carouselHtml = restImages.length
          ? '<div class="gallery-carousel">' +
            restImages.map(function (url) {
              return '<figure class="gallery-tile">' + imageTag(url, item.title) + '</figure>';
            }).join('') +
            '</div>'
          : '';
      }

      return '<div class="text-block reveal">' +
        (item.title ? '<h3>' + escapeHtml(item.title) + '</h3>' : '') +
        (item.subtitle ? '<p class="subtitle">' + escapeHtml(item.subtitle) + '</p>' : '') +
        mainHtml +
        (item.body ? '<p class="body">' + nl2br(item.body) + '</p>' : '') +
        carouselHtml +
        '</div>';
    }).join('');
    return section(page.page_id, page.page_type, sectionHeading_(page) + blocks);
  },

  image_text: function (page) {
    var blocks = (page.items || []).map(function (item, i) {
      var reversed = (item.layout_type === 'reverse') || (i % 2 === 1);
      return '<div class="image-text-row reveal' + (reversed ? ' reversed' : '') + '">' +
        '<div class="image-text-media">' + (item.images && item.images[0] ? imageTag(item.images[0], item.title) : '') + '</div>' +
        '<div class="image-text-content">' +
        (item.title ? '<h3>' + escapeHtml(item.title) + '</h3>' : '') +
        (item.subtitle ? '<p class="subtitle">' + escapeHtml(item.subtitle) + '</p>' : '') +
        (item.body ? '<p class="body">' + nl2br(item.body) + '</p>' : '') +
        '</div></div>';
    }).join('');
    return section(page.page_id, page.page_type, sectionHeading_(page) + blocks);
  },

  features: function (page) {
    // 4項目が同じ画像フォルダを共有している場合（ft.1〜ft.4のような連番運用）を想定し、
    // 行のインデックスに対応する画像を1枚だけ割り当てる（フォルダの画像は常にファイル名昇順の配列）。
    // 各行が別々のフォルダを持つ場合は、そのフォルダの1枚目（images[0]）が使われるので従来通り動く。
    var cards = (page.items || []).map(function (item, i) {
      var photo = (item.images || [])[i] || (item.images || [])[0];
      return '<div class="feature-card">' +
        (photo ? '<div class="feature-media">' + imageTag(photo, item.title) + '</div>' : '') +
        (item.title ? '<h3>' + escapeHtml(item.title) + '</h3>' : '') +
        (item.subtitle ? '<p class="subtitle">' + escapeHtml(item.subtitle) + '</p>' : '') +
        (item.body ? '<p class="body">' + nl2br(item.body) + '</p>' : '') +
        '</div>';
    }).join('');
    return section(page.page_id, page.page_type, sectionHeading_(page) + '<div class="feature-grid reveal-stagger">' + cards + '</div>');
  },

  gallery: function (page) {
    // 1行（1画像フォルダ）を1グループとして描画する。行数・画像枚数はどちらも可変を前提とする
    // （LINE経由で今後増えていく想定）。レイアウトタイプ列でgrid/carouselを指定でき、
    // 未指定または不明な値はcarousel扱いにする。
    var groups = (page.items || []).map(function (item) {
      var images = item.images || [];
      if (!images.length) return '';
      var layout = String(item.layout_type || '').trim().toLowerCase() === 'grid' ? 'grid' : 'carousel';
      var tiles = images.map(function (url) {
        return '<figure class="gallery-tile">' + imageTag(url, item.title) + '</figure>';
      }).join('');
      // タイトル・キャプションは写真の下にシンプルに添える（写真そのものを主役にする）
      var caption = (item.title || item.caption)
        ? '<p class="gallery-group-caption">' + [item.title, item.caption].filter(Boolean).map(escapeHtml).join('　') + '</p>'
        : '';
      var body = '<div class="gallery-' + layout + ' reveal-stagger">' + tiles + '</div>';
      return '<div class="gallery-group">' + body + caption + '</div>';
    }).join('');
    return section(page.page_id, page.page_type, sectionHeading_(page) + groups);
  },

  before_after: function (page) {
    var rows = (page.items || []).map(function (item) {
      var before = item.images && item.images[0];
      var after = item.images && item.images[1];
      return '<div class="before-after-row reveal">' +
        '<div class="ba-col"><p class="ba-label">Before</p>' + (before ? imageTag(before, item.title) : '') + '</div>' +
        '<div class="ba-col"><p class="ba-label">After</p>' + (after ? imageTag(after, item.title) : '') + '</div>' +
        (item.title ? '<h3 class="ba-title">' + escapeHtml(item.title) + '</h3>' : '') +
        '</div>';
    }).join('');
    return section(page.page_id, page.page_type, sectionHeading_(page) + rows);
  },

  specs: function (page) {
    // 本文が「項目：値」の改行区切りで格納された行を種類ごとの列とし、項目名を行とする横並び比較表に変換する。
    // パースできない行（備考など）は表に含めず、表の下に注記として表示する。
    var columns = [];
    var notes = [];
    (page.items || []).forEach(function (item) {
      var props = parseSpecsBody_(item.body);
      if (props) {
        columns.push({ title: item.title, props: props });
      } else if (item.title || item.body) {
        notes.push(item);
      }
    });

    var html = sectionHeading_(page);

    if (columns.length) {
      var rowKeys = [];
      columns.forEach(function (col) {
        Object.keys(col.props).forEach(function (key) {
          if (rowKeys.indexOf(key) === -1) rowKeys.push(key);
        });
      });

      var thead = '<tr><th></th>' + columns.map(function (c) {
        return '<th>' + escapeHtml(c.title) + '</th>';
      }).join('') + '</tr>';

      var tbody = rowKeys.map(function (key) {
        var cells = columns.map(function (c) {
          return '<td>' + escapeHtml(c.props[key] || '') + '</td>';
        }).join('');
        return '<tr><th>' + escapeHtml(key) + '</th>' + cells + '</tr>';
      }).join('');

      html += '<div class="specs-table-wrap reveal" style="overflow-x:auto;">' +
        '<table class="specs-table specs-compare-table"><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table>' +
        '</div>';
    }

    if (notes.length) {
      html += notes.map(function (n) {
        return '<p class="specs-note">' + (n.title ? escapeHtml(n.title) + '：' : '') + nl2br(n.body) + '</p>';
      }).join('');
    }

    return section(page.page_id, page.page_type, html);
  },

  company: function (page, catalog, company) {
    var c = company || page.company;
    if (!c) return section(page.page_id, page.page_type, sectionHeading_(page) + '<p>会社情報が設定されていません。</p>');
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
      sectionHeading_(page) +
      '<div class="company-block reveal">' +
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
      return '<div class="video-block reveal">' +
        (item.title ? '<h3>' + escapeHtml(item.title) + '</h3>' : '') +
        embed +
        (item.body ? '<p class="body">' + nl2br(item.body) + '</p>' : '') +
        '</div>';
    }).join('');
    return section(page.page_id, page.page_type, sectionHeading_(page) + blocks);
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
    return section(page.page_id, page.page_type, sectionHeading_(page) + '<div class="contact-block reveal">' + blocks + contactLines.join('') + '</div>');
  },

  custom: function (page) {
    var blocks = (page.items || []).map(function (item) {
      return '<div class="custom-block reveal">' +
        (item.title ? '<h3>' + escapeHtml(item.title) + '</h3>' : '') +
        (item.subtitle ? '<p class="subtitle">' + escapeHtml(item.subtitle) + '</p>' : '') +
        (item.body ? '<p class="body">' + nl2br(item.body) + '</p>' : '') +
        (item.images && item.images.length ? '<div class="custom-images">' + item.images.map(function (u) { return imageTag(u, item.title); }).join('') + '</div>' : '') +
        '</div>';
    }).join('');
    return section(page.page_id, page.page_type, sectionHeading_(page) + blocks);
  }
};

/**
 * UI演出（ヘッダーのスクロール状態切り替え、スクロール出現アニメーション）。
 * データ取得・描画のオーケストレーションはapp.js側の責務のままなので、
 * ここでは「#catalog-mainへ内容が挿入されたこと」をMutationObserverで検知するだけにして
 * app.jsには手を加えない。prefers-reduced-motionが有効な場合は演出を行わない
 * （CSS側でも.reveal/.reveal-staggerの初期非表示自体を無効化している）。
 */
(function () {
  if (typeof window === 'undefined') return;

  var headerEl = document.getElementById('catalog-header');
  if (headerEl) {
    var updateHeaderState = function () {
      headerEl.classList.toggle('is-scrolled', window.scrollY > 60);
    };
    updateHeaderState();
    window.addEventListener('scroll', updateHeaderState, { passive: true });
  }

  if (typeof IntersectionObserver === 'undefined') return;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  var mainEl = document.getElementById('catalog-main');
  if (!mainEl) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  var mo = new MutationObserver(function () {
    mainEl.querySelectorAll('.reveal, .reveal-stagger').forEach(function (el) {
      if (!el.dataset.revealObserved) {
        el.dataset.revealObserved = '1';
        io.observe(el);
      }
    });
  });
  mo.observe(mainEl, { childList: true, subtree: true });
})();

/**
 * ライトボックス（画像クリック／タップで拡大表示）。
 * #catalog-main配下の画像すべてをクリック委譲で拾う。ただしヘッダー用途ではない
 * hero内ロゴ・会社ロゴ（ブランド要素）は拡大対象から除外する。
 * ピンチズームを妨げないよう、独自のズーム処理は行わずimgをcontainで大きく表示するのみ。
 */
(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  var mainEl = document.getElementById('catalog-main');
  if (!mainEl) return;

  var overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.setAttribute('hidden', '');
  overlay.innerHTML = '<button type="button" class="lightbox-close" aria-label="閉じる">&times;</button><img class="lightbox-image" alt="">';
  document.body.appendChild(overlay);

  var imgEl = overlay.querySelector('.lightbox-image');
  var closeBtn = overlay.querySelector('.lightbox-close');

  function openLightbox(src, alt) {
    imgEl.src = src;
    imgEl.alt = alt || '';
    overlay.removeAttribute('hidden');
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });
  }

  function closeLightbox() {
    overlay.classList.remove('is-open');
    setTimeout(function () {
      overlay.setAttribute('hidden', '');
      imgEl.src = '';
    }, 250);
  }

  mainEl.addEventListener('click', function (e) {
    var img = e.target.closest('img');
    if (!img) return;
    if (img.classList.contains('hero-logo') || img.closest('.company-logo')) return;
    openLightbox(img.src, img.alt);
  });

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeLightbox();
  });
  closeBtn.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeLightbox();
  });
})();
