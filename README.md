# 奨学金・フェローシップ検索

日本人学生・研究者向けの奨学金・フェローシップ情報を検索する GitHub Pages 用の静的サイトです。

## ローカル確認

```bash
python3 -m http.server 8000
```

`http://localhost:8000` を開いて確認します。

## データ更新

1. 公開スプレッドシートの CSV を取得します。
2. `data/scholarships.json` を更新します。
3. フィールド名は `script.js` に合わせて保ちます。
4. 更新内容をコミットして GitHub Pages に反映します。

## GitHub Pages

- GitHub に push します。
- デフォルトブランチのルートを GitHub Pages として公開します。
- 相対パスでアセットを読み込むため、プロジェクトページ URL でも動作します。
