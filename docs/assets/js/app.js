/**
 * カタログWeb管理システム - 共通表示エンジン（Phase2）
 * catalog_id / company_id をクエリパラメータから取得し、GAS Web AppからJSONを取得して描画する。
 * このファイルに商品固有のロジックを書かないこと（page_typeテンプレートは templates.js 側）。
 */
(function () {
  function getParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function show(el) { el.hidden = false; }
  function hide(el) { el.hidden = true; }

  function showError(message) {
    var errorEl = document.getElementById('error');
    errorEl.textContent = message;
    show(errorEl);
    hide(document.getElementById('loading'));
  }

  function renderHeader(data) {
    document.body.dataset.theme = data.catalog.theme || 'default';
    var headerEl = document.getElementById('catalog-header');
    var nameEl = document.getElementById('catalog-name');
    nameEl.textContent = data.catalog.name || '';
    document.title = data.catalog.name || 'カタログ';

    var logoEl = document.getElementById('header-logo');
    if (data.company && data.company.logo) {
      logoEl.src = data.company.logo;
      logoEl.alt = data.company.name || data.catalog.name || '';
      show(logoEl);
      hide(nameEl); // ロゴ画像がある場合はテキストの代わりにロゴを表示する
    }

    var navEl = document.getElementById('catalog-nav');
    navEl.innerHTML = data.pages.map(function (p) {
      return '<a href="#page-' + p.page_id + '">' + escapeHtml(p.page_name) + '</a>';
    }).join('');

    show(headerEl);
  }

  function renderPages(data) {
    var mainEl = document.getElementById('catalog-main');
    var html = data.pages.map(function (page) {
      var template = window.CATALOG_TEMPLATES[page.page_type] || window.CATALOG_TEMPLATES.custom;
      try {
        return template(page, data.catalog, data.company);
      } catch (e) {
        return '';
      }
    }).join('');
    mainEl.innerHTML = html;
  }

  function renderFooter(data) {
    var footerEl = document.getElementById('catalog-footer');
    var c = data.company;
    if (!c) return;
    var parts = [];
    if (c.name) parts.push('<p class="footer-company">' + escapeHtml(c.name) + '</p>');
    if (c.address) parts.push('<p>' + escapeHtml((c.postal_code ? '〒' + c.postal_code + ' ' : '') + c.address) + '</p>');
    var contacts = [c.tel ? 'TEL：' + c.tel : '', c.mail ? 'MAIL：' + c.mail : ''].filter(Boolean).join('　');
    if (contacts) parts.push('<p>' + escapeHtml(contacts) + '</p>');
    footerEl.innerHTML = parts.join('');
    show(footerEl);
  }

  function init() {
    var catalogParam = getParam('catalog');
    var companyParam = getParam('company');

    if (!catalogParam) {
      showError('URLに catalog パラメータが指定されていません。例：?catalog=resiart&company=numan');
      return;
    }

    var apiUrl = window.CATALOG_CONFIG && window.CATALOG_CONFIG.GAS_API_URL;
    if (!apiUrl) {
      showError('GAS_API_URLが設定されていません（assets/js/config.js を確認してください）');
      return;
    }

    var url = apiUrl + '?catalog=' + encodeURIComponent(catalogParam) + (companyParam ? '&company=' + encodeURIComponent(companyParam) : '');

    fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.ok) {
          showError(data.error || 'カタログの取得に失敗しました');
          return;
        }
        hide(document.getElementById('loading'));
        renderHeader(data);
        renderPages(data);
        renderFooter(data);
      })
      .catch(function () {
        showError('カタログの取得中に通信エラーが発生しました。しばらくしてから再度お試しください。');
      });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
