const { WebClient } = require("@slack/web-api");
const fs = require("fs");
const https = require("https");
var archiver = require("archiver");
const program = require("commander");
const JSONC = require("jsonc-parser");

const TOKEN = process.env.TOKEN;
const HISTORY_LIMIT = process.env.HISTORY_LIMIT;
const OUTPUTDIR = process.env.OUTPUTDIR;
const OURPUTZIP = process.env.OURPUTZIP;

const client = new WebClient(TOKEN);

const fileGetOptions = {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + TOKEN,
  },
  json: true,
};

program.parse(process.argv);
let channelListPath = "./channellist.jsonc";
if (program.args.length > 0) {
  channelListPath = program.args[0];
}

(async () => {
  channelList = JSONC.parse(fs.readFileSync(channelListPath, "utf8"));

  const promises = channelList.map(async (channel) => {
    const initCount = channel[2] ?? 0;
    const initCursor = channel[3] ?? null;
    return await archiveChannel(channel[0], channel[1], initCount, initCursor);
  });

  Promise.all(promises).then(() => {
    var archive = archiver.create("zip", {});
    var output = fs.createWriteStream(OURPUTZIP);
    archive.pipe(output);
    archive.glob(OUTPUTDIR + "**/*");

    archive.finalize();
    output.on("close", function () {
      var archive_size = archive.pointer();
      console.log(`complete! total size : ${archive_size} bytes`);
    });
  });
})();

async function archiveChannel(channelID, channelName, initCount, initCursor) {
  console.log(channelName);
  let count = initCount;
  let cursor = initCursor;

  const outputdir = OUTPUTDIR + channelName + "/";
  await fs.promises.mkdir(outputdir, { recursive: true });

  while (1) {
    const history = await client.conversations
      .history({
        cursor: cursor,
        channel: channelID,
        limit: HISTORY_LIMIT,
      })
      .catch((err) => console.error(err));

    let messages = history.messages.map((message) => {
      // 非同期で利用するパラメータを持たせておく
      return {
        message: message,
        count: count,
      };
    });

    const promises = messages.map(async (m) => {
      const message = m.message;
      const count = m.count;
      // 添付ファイルを保存
      const filedir = fileDir(outputdir, count, message.ts);
      message.files?.forEach((file) =>
        downloadFile(file, filedir, fileGetOptions).catch((err) =>
          console.error(err)
        )
      );

      if (message.reply_count > 0) {
        // リプライを持つものはリプライAPIを叩く
        const replies = await client.conversations
          .replies({
            channel: channelID,
            ts: message.ts,
          })
          .catch((err) => console.error(err));
        // 先頭にはリプライ元が含まれている
        message.replies = replies.messages.slice(1);
        message.replies.forEach((reply) => {
          const filedir = fileDir(outputdir, count, reply.ts);
          reply.files?.forEach((file) =>
            downloadFile(file, filedir, fileGetOptions).catch((err) =>
              console.error(err)
            )
          );
        });
      }

      return {
        message: message,
        count: count,
        next_cursor: history.response_metadata.next_cursor,
      };
    });

    Promise.all(promises).then((result) => {
      const messages = result.map((r) => r.message);
      const cursor = result[0].next_cursor;
      const count = result[0].count;

      Array.prototype.push.apply(messages, [cursor]);
      output(outputdir, count, messages);
      console.log(channelName + "/" + countPath(count) + "/");
    });

    cursor = history.response_metadata.next_cursor;

    if (history.response_metadata.next_cursor === undefined) {
      break;
    }

    count++;
  }
}

async function output(outputdir, count, data) {
  const filedir = outputdir + countPath(count) + "/";
  await fs.promises.mkdir(filedir, { recursive: true }, (err) => {});
  fs.writeFile(
    filedir + "conversations.json",
    JSON.stringify(data),
    function (err) {
      if (err) {
        console.log(err);
      }
    }
  );
}

function countPath(count) {
  return ("00000" + count).slice(-5);
}

function fileDir(outputdir, count, ts) {
  return outputdir + countPath(count) + "/" + ts + "/";
}

async function downloadFile(file, filedir, fileGetOptions) {
  // 同じnameで複数ファイルが添付されていると名前が被るのでIDの階層を付与
  filedir += file.id + "/";
  const filepath = filedir + file.name;
  await fs.promises.mkdir(filedir, { recursive: true }, (err) => {});
  const f = fs.createWriteStream(filepath);
  if (file.url_private_download === undefined) {
    fs.writeFile(filedir + "file.json", JSON.stringify(file), function (err) {
      if (err) {
        console.log(err);
      }
    });
    return;
  }
  https
    .request(file.url_private_download, fileGetOptions, (res) => {
      res.pipe(f);
    })
    .end();
}
