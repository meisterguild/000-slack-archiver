slack チャンネルの使い方によっては生成されるバックアップのファイルサイズが膨大なものになったりするかもしれません。ツールの実行は自己責任でお願いします。

# 必要なもの

- Slack の AccessToken
- Docker

## Token に必要な Permission

- channels:history
- groups:history
- im:history
- mpim:history
- files:read
- channels:read
- groups:read
- mpim:read
- im:read

# 0. 準備

`.env.sample`をコピーして`.env`を作成します。`TOKEN`を記載します。

以下を実行します。

```
docker compose build
docker compose run --rm app npm install
```

# 1. チャンネルリストの取得

以下を実行します。

```
docker compose run --rm app node src/channellist.js
```

`channellist.jsonc`が出力されます。

# 2. アーカイブの取得

アーカイブは`channellist.jsonc`に記載されたチャンネルを対象に行います。

`channellist.jsonc`が出力された状態で以下

```
docker compose run --rm app node src/archive.js
```

または

```
docker compose run --rm app node src/archive.js <JSONCファイルパス>
```

を実行します。

10000 件の投稿があるチャンネルで約 15 分かかり、約 1GB のファイルが作成されます。

# 3. チャンネルに所属するメンバーを取得

メンバーの取得は`channellist.jsonc`に記載されたチャンネルを対象に行います。かつメンバー ID と名前の紐づけは`slack-meisterguild-members_filtered.csv`を参照します。

`channellist.jsonc`および`slack-meisterguild-members_filtered.csv`がある状態で以下

```
docker compose run --rm app node src/channelMember.js
```

または

```
docker compose run --rm app node src/channelMember.js <JSONCファイルパス> <CSVファイルパス>
```

を実行します。

`channelMember.json`に出力されます。
