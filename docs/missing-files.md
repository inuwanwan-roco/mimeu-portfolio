# 欠落ファイルの調査結果

`index.html` のローカル参照を調べ、次の10ファイルが存在しないことを確認しました。
取得済みの全Git履歴にも追加された記録はなく、既存ファイルの名前違いではありません。

## 画像6件

- `assets/images/hero/hero-visual.webp`
- `assets/images/works/mi-nuit.webp`
- `assets/images/works/graphic-preview-01.webp`
- `assets/images/works/graphic-preview-02.webp`
- `assets/images/4.aboutme/profile.webp`
- `assets/images/contact/contact-visual.webp`

## 詳細ページ4件

- `aboutme.html`
- `works/mi-nuit.html`
- `works/profile-site.html`
- `works/graphic.html`（`graphic-01` / `graphic-02` のIDも必要）

元の画像・ページの提供待ちです。ユーザーの希望と引き継ぎ仕様書に従い、
代替画像や削除前提のプレースホルダーは作らず、配置予定のパスとコメントを保持しています。
素材を配置する際、下層ページのCSS・画像・トップへのリンクは各ページからの相対パスで確認してください。

## Accordionの原因と修正

Works調整コミット `5bdeb1b` でイベント登録処理が関数の外へ移されましたが、
DOMContentLoaded内の `initAccordion()` 呼び出しは残り、ReferenceErrorになっていました。
処理を関数へ戻し、`is-open` と `aria-expanded` の同期を保っています。
Panelの `hidden` 属性とアイコンの文字置き換えは使っていません。

## 回帰確認

Python Playwrightと `/usr/bin/chromium` がある環境で、リポジトリルートから実行します。

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

別のターミナルで:

```sh
node --check js/main.js
python3 -B -m unittest discover -s tests -v
```

UIテストは外部フォント通信を除外し、アコーディオン、後続のフォーム初期化、
モバイルメニューを検証します。欠落ファイルやフォントの表示を検証するテストではありません。
