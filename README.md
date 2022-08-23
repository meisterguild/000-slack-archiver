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

# 1. チャンネルリストの取得

以下を実行します。

```
docker compose run --rm app node channellist.js
```

`channellist.jsonc`が出力されます。

# 2. アーカイブの取得

アーカイブは`channellist.jsonc`に記載されたチャンネルを対象に行います。

`channellist.jsonc`が出力された状態で以下

```
docker compose run --rm app node channellist.js
```

または

```
docker compose run --rm app node channellist.js <JSONCファイルパス>
```

を実行します。

10000 件の投稿があるチャンネルで約 15 分かかり、約 1GB のファイルが作成されます。
