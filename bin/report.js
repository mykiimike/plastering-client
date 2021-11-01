const sc = require('subcommander');
const fs = require('fs');
const readline = require("readline");
const axios = require("axios");
const { GetWalletToken, InitNetwork, RouteNetwork, InitWallet } = require("../index")
const Table = require('cli-table');

sc.command('report', {
  desc: 'Retrieve Plastering on IP or Network',
  callback: async function (options) {
    InitNetwork(options);
    const wallet = InitWallet(options);

    const post = { query: options[0] }

    const ret = await axios.post(RouteNetwork("report"), post, GetWalletToken(wallet));
    if (ret) {

      // instantiate
      var table = new Table({
        head: ['ID', 'IP', 'Last', 'Tags']
      });

      var count = 0;
      for (var line of ret.data.list) {
        table.push([
          count++,
          line.ip,
          line.last,
          line.hits.join(" ")
        ])
      }
      console.log(`* Share token ${ret.data.token}`)
      console.log(`* Share URL ${options.server}/report?query=${encodeURIComponent(ret.data.token)}`)
      console.log(table.toString());
    }
    else {
      console.log(ret);
    }
  }
});
