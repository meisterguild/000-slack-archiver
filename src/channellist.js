const { WebClient } = require("@slack/web-api");
const fs = require("fs");

const TOKEN = process.env.TOKEN;

const client = new WebClient(TOKEN);

(async () => {
  let cursor = null;
  let channelIDList = [];
  while (1) {
    const list = await client.conversations.list({
      cursor: cursor,
      types: "public_channel,private_channel",
    });

    const iDList = list.channels?.map((channel) => [channel.id, channel.name]);

    Array.prototype.push.apply(channelIDList, iDList);

    if (list.response_metadata.next_cursor === "") {
      break;
    }

    cursor = list.response_metadata.next_cursor;
  }

  fs.writeFile(
    "channellist.jsonc",
    JSON.stringify(channelIDList),
    function (err) {
      if (err) {
        console.log(err);
      }
    }
  );
})();
