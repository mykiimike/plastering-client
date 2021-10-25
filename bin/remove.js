

const sc = require('subcommander');
const fs = require('fs');
const axios = require("axios");

const { InitWallet, InitNetwork, RouteNetwork, GetWalletToken } = require("../index")

var remove = sc.command('remove', {
  desc: 'Administrative remove IPv4/IPv6 from Global Database'
})

remove.command('address', {
  desc: 'Using single address',
  callback: async function (options) {
    InitNetwork(options);

    const wallet = InitWallet(options);

    const ip = options[0];
    if (!ip) {
      console.log("Specify ip to remove")
      process.exit(-1);
    }
    
    const ret = await axios.post(RouteNetwork(`remove`), [ip], GetWalletToken(wallet));
    console.log(ret.data)
  }
});

