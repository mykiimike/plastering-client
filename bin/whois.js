

const sc = require('subcommander');
const fs = require('fs');
const axios = require("axios");
const { GetWalletToken, InitNetwork, RouteNetwork, InitWallet } = require("../index")

sc.command('whois', {
  desc: 'Fast & Furious Whois Search',
  callback: async function (options) {
    InitNetwork(options);
    const wallet = InitWallet(options);
    const domainOrIp = options[0];
    if (!domainOrIp) {
      console.log("Specify domainOrIp to search")
      process.exit(-1);
    }
    
    const ret = await axios.get(RouteNetwork(`dns/whois/${domainOrIp}`), GetWalletToken(wallet))
    if (ret) {
      if(ret.data.error) {
        console.log(`API error: ${ret.data.error}`)
        process.exit(-1)
      }
      else if(ret.data.pending === true) {
        console.log("Gathering domain information, try later")
        process.exit(-1)
      }
      process.stdout.write(ret.data.text)
    }
    
  }
});
