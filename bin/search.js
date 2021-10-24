

const sc = require('subcommander');
const fs = require('fs');
const axios = require("axios");
const { GetNetwork, InitNetwork, RouteNetwork } = require("../index")

sc.command('search', {
  desc: 'Search information about an IPv4/IPv6',
  callback: async function (options) {
    InitNetwork(options);

    const ip = options[0];
    if (!ip) {
      console.log("Specify ip to search")
      process.exit(-1);
    }
    
    const ret = await axios.get(RouteNetwork(`search?query=${ip}`))
    console.log(ret.data)
  }
});
