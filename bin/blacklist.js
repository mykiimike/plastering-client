const sc = require('subcommander');
const fs = require('fs');
const readline = require("readline");
const axios = require("axios");
const { GetNetwork, InitNetwork, RouteNetwork } = require("../index")

sc.command('blacklist', {
  desc: 'Retrieve the Plastering blacklist',
  callback: async function (options) {
    InitNetwork(options);

    axios({
      method: 'get',
      url: RouteNetwork("blacklist"),
      responseType: 'stream'
    }).then(function (response) {
      const rl = readline.createInterface({
        input: response.data
      });
      rl.on('line', async (input) => {
        console.log(`${input}`)
      });
    });
  }
});
