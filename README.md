# catalog-engine

複数の商品・ブランド・会社へ横展開できる共通カタログWeb管理基盤。
Google Spreadsheet をデータ正本とし、Google Apps Script (GAS) が JSON API を提供し、
GitHub Pages 上の静的サイトがそれを読み込んで表示する。

Resi Art はこのエンジンを使う最初の実装対象であり、Resi Art専用のコード・データ構造は含まない。
商品固有情報はすべて Spreadsheet 側で管理し、コードは `catalog_id` / `company_id` を通じて汎用的に読み込む。

## 構成

```
docs/   GitHub Pages で公開する静的サイト（表示エンジン）
gas/    Google Apps Script プロジェクト（clasp管理、Spreadsheet読込・JSON API）
```

## 表示URL

```
https://<org>.github.io/<repo>/?catalog=resiart&company=numan
```

- `catalog`: カタログ管理シートの `slug`（または `catalog_id`）
- `company`: 会社マスターの `company_id`（省略時はカタログの既定会社）

## セットアップ手順

詳細は `../docs_project/setup-instructions.md`（ローカル開発フォルダ側）を参照。

1. Spreadsheet を開き、メニュー「⚙️ カタログ管理」→「① 初期設定」を実行
2. 「設定」シートに LINEアクセストークン／Drive素材ルートフォルダID／Web公開URL を入力
3. メニュー「⚙️ カタログ管理」→「② 設定チェック」を実行し、✅がそろうことを確認
4. カタログ管理・ページ管理シートで公開したい行を `公開=TRUE` にする
5. GitHub Pages の設定で `main` ブランチ `/docs` フォルダを公開元に指定する
