# 配信ピタポン

<p align="center"><img src="assets/icon.png" alt="配信ピタポン アイコン" width="160"></p>

画像も動画も、OBSの枠へピタッと。ドロップするだけで、固定枠内へアスペクト比を保ったまま全体表示するWindowsアプリです。素材ごとにOBSでサイズを直す必要がありません。

日本語 | [English](#english)

## 主な機能

- 画像・動画のドラッグ＆ドロップと複数ファイル選択
- 素材をアプリ管理領域へコピーして安全に保持
- 固定枠への全体表示（クロップなし、縦横比維持、余白は透明）
- 素材リスト、並べ替え、前後移動、即時切り替え
- 動画再生と音量・ミュート設定
- 画像の表示秒数／動画終了に合わせた自動送り
- 切り替え時のフェード
- アプリとOBSブラウザソースの自動再接続

## OBSへの設定

1. 配信ピタポンを起動します。
2. 画面上部に表示されたURLをコピーします。
3. OBSの「ソース」から「ブラウザ」を追加します。
4. URLを貼り付けます。
5. ブラウザソースの幅・高さをアプリの「表示設定」と同じ値にします（初期値は1920×1080）。
6. 動画の音をOBSへ流す場合は、ブラウザソースの「OBSで音声を制御する」を有効にします。

アプリを終了するとローカル表示ページも停止します。配信中はアプリを起動したまま使用してください。

## 対応形式

画像: PNG、JPEG、WebP、GIF、BMP、AVIF  
動画: MP4、WebM、MOV、M4V、OGV

実際の動画再生可否はOBS内蔵ブラウザが対応するコーデックにも依存します。安定性を優先する場合はH.264/AACのMP4またはWebMを推奨します。

## 使用上の注意

- 配信や収録を始める前に、実際に使用する画像・動画・音声がOBSで正しく表示・再生されることを確認してください。
- 配信中は配信ピタポンを起動したままにしてください。アプリを終了すると、OBSのブラウザソースへの配信も停止します。
- 動画の再生可否はファイル形式だけでなく、使用されている映像・音声コーデックにも依存します。
- 登録した素材はアプリの管理領域へコピーされます。重要な素材の原本は別途バックアップしてください。
- 使用する素材の著作権、肖像権、利用規約などは、利用者自身の責任で確認してください。
- 本アプリはOBS Studioの非公式ツールです。OBS Projectによる提供・保証・サポートを受ける製品ではありません。
- 初期リリースでは予期しない不具合が残っている可能性があります。本番配信の前にテストすることをおすすめします。

## 利用とクレジットについて

個人・法人を問わず、配信、動画制作、イベントなどで商用利用できます。利用報告や事前の許可は必要ありません。

配信概要欄、動画説明欄、制作物のクレジットなどに、アプリ名とリンクを添えていただけると開発の励みになります（任意です）。

> 使用ツール: [配信ピタポン](https://github.com/sorilin/stream-pitapon)

このクレジット表記はお願いであり、利用条件ではありません。アプリ自体を改変・再配布する場合は、MITライセンスに従って著作権表示とライセンス文を保持してください。

## 開発

Node.js 22以降をインストールして、次を実行します。

```powershell
npm install
npm start
```

構文チェック:

```powershell
npm run check
```

自動テスト:

```powershell
npm test
```

構文チェックとテストをまとめて実行:

```powershell
npm run verify
```

GitHub Actionsでも、`main` へのpushとPull Requestごとに自動実行されます。

Windowsインストーラーとポータブル版の生成:

```powershell
npm run dist
```

成果物は `release` フォルダに作成されます。

配布ファイル名は、日本語名を正しく扱えない環境との互換性を考慮して `Stream-PitaPon-...exe` になります。インストール後のアプリ表示名は「配信ピタポン」です。

## GitHub Releases

`v0.1.0` のようなタグをGitHubへpushすると、GitHub ActionsがWindows版をビルドしてReleaseへインストーラーとポータブル版を添付します。

```powershell
git tag v0.1.0
git push origin v0.1.0
```

## データ保存先

素材と設定はElectronのユーザーデータフォルダへ保存します。Windowsでは通常 `%APPDATA%\\obs-media-frame` 以下です。リストから素材を削除すると、管理領域のコピーも削除されます。

## ライセンス

本プロジェクトは[MIT License](LICENSE)で公開しています。商用利用、改変、再配布が可能です。再配布時には著作権表示とライセンス文を保持してください。

## English

HaiShin PitaPon is a Windows utility that fits dropped images and videos inside a fixed OBS Browser Source while preserving their aspect ratio.

### Usage notes

- Test your media in OBS before going live. Video playback depends on the codecs supported by the OBS embedded browser.
- Keep the app running while streaming. Closing it stops the local Browser Source page.
- Keep separate backups of important original media files.
- You are responsible for confirming the copyright, portrait rights, and usage terms of your media.
- This is an unofficial tool and is not provided, endorsed, or supported by the OBS Project.

Commercial use is allowed. No prior permission or usage report is required. Optional credit is warmly appreciated:

> Tool: [配信ピタポン / HaiShin PitaPon](https://github.com/sorilin/stream-pitapon)

Credit is appreciated but not required. This project is distributed under the [MIT License](LICENSE). If you modify or redistribute the software itself, retain the copyright notice and license text as required by that license.
