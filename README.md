
# 使い方

- 起動
  - Release より exe をダウンロードして実行して下さい。
  - 起動後、設定ファイルを含む `neko_filer_settings`フォルダが生成されます。

# 基本操作

## フォルダの移動
- 一般的なファイラと同様、以下の操作でフォルダを移動します。
  - アドレスバーにパスを入力する
  - フォルダをダブルクリック
  - フォルダにフォーカスを合わせて Enter を押下
- ファイルのパスを入力することで、指定したファイルを含むフォルダへ移動しつつ、指定したファイルへフォーカスを移すことができます。
- 余白をダブルクリックすることで一つ上のフォルダへ移動します。

## キー操作

- キー操作は、`neko_filer_settings/key_bind.json5` を参照
  - アプリ内に、参照,設定の機能を追加予定
- 同一キーに複数コマンドを指定した場合、どの機能を動かすかのメニューが表示されます。

### デフォルトのキーバインド(一部)
- ある程度、一般的な走査に合わせています。

- `Ctrl + T`
  - 新規タブ
- `Ctrl + W`
  - タブを閉じる
- `Ctrl + Tab`,`Ctrl + Shift + →`
  - タブの移動

- `Ctrl + Shift + ↑`
  - 一つ上の階層へ移動

- `Ctrl + L`
  - アドレスバーへ移動

- `Spaceキー`
  - フォーカスアイテムの選択


- `Ctrl + C`
  - ファイルをクリップボードへコピー
  - ファイルのコピーを作成
  - 反対ペインへファイルをコピー
- `Ctrl + X`
  - ファイルをクリップボードへ切り取り
  - 反対ペインへファイルを移動
- `Ctrl + V`
  - クリップボードからファイルを貼り付け
- `Ctrl + Alt + C`
  - ファイルのフルパスをコピー
- `Ctrl + D`,`Delete`
  - ファイルの削除
- `Ctrl + N`
  - ファイルの作成
  - フォルダの作成
  - ファイル名の変更


# 配色指定
- 以下の設定ファイルを編集することで、タブの色,ファイル名の色を変更できます。
  - 正規表現でマッチさせます。
* `neko_filer_settings/tab_color.json5`
* `neko_filer_settings/file_name_color.json5`

# その他機能

- 前回状態の保持
- 区切り文字の切り替え
- 一括リネーム
- コピーの作成(コピー後のファイル名を指定)
- 貼り付け時は、Enter不要でアクセス


# 内部設計など

## 設計
- ユーザーによる機能拡張は、各自でスクリプトを書く事で対応が可能。
  - e.g. 削除前に確認ダイアログを出す、など。
  - このため、ファイルのコピーなども、スクリプトへ処理を委譲している。


## 環境

- PowerShellスクリプトを使う都合上、現状は Windows のみ対応
  - Mac,Linux でも、ファイル表示は可能かも？
  - Shellスクリプトを使うようにすれば、Linux対応などは可能なはず。



# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
