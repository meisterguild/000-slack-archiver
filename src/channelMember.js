const { WebClient } = require("@slack/web-api");
const fs = require("fs");
const parse = require("csv-parse/sync");
const program = require("commander");
const JSONC = require("jsonc-parser");

const TOKEN = process.env.TOKEN;

const client = new WebClient(TOKEN);

program.parse(process.argv);
let channelListPath = "./channellist.jsonc";
if (program.args.length > 0) {
  channelListPath = program.args[0];
}
let memberListPath = "./slack-meisterguild-members_filtered.csv";
if (program.args.length > 1) {
  memberListPath = program.args[1];
}

(async () => {
  const channelList = JSONC.parse(fs.readFileSync(channelListPath, "utf8"));
  const membersList = parse.parse(fs.readFileSync(memberListPath, "utf8"), {
    columns: false,
  });

  const promises = channelList.map(async (channel) => {
    return {
      channelName: channel[1],
      private: channel[2],
      members: await getChannelMembers(channel[0], membersList),
    };
  });

  Promise.all(promises).then((result) => {
    fs.writeFile("chennelMember.json", JSON.stringify(result), function (err) {
      if (err) {
        console.log(err);
      }
    });
  });
})();

async function getChannelMembers(channelID, membersList) {
  const members = await client.conversations.members({
    channel: channelID,
  });

  return members.members.map(function (member) {
    for (let i = 0; i < membersList.length; i++) {
      if (membersList[i][5] === member) {
        return membersList[i][6];
      }
    }
    return member;
  });
}
