const sc = require('subcommander');
const fs = require('fs');
const readline = require("readline");
const axios = require("axios");
const { GetWalletToken, InitNetwork, RouteNetwork, InitWallet } = require("../index")
const Table = require('cli-table');

var trigger = sc.command('trigger', {
  desc: 'Triggers on detection'
});

trigger.command('add', {
  desc: 'Add IP/CIDR to trigger',
  callback: async function (options) {
    InitNetwork(options);
    const wallet = InitWallet(options);
    const post = { cidr: options[0], description: options[1] }
    const ret = await axios.postCheck(RouteNetwork("trigger/add"), post, GetWalletToken(wallet, options));
    console.log(ret)
  }
});

trigger.command('del', {
  desc: 'Delete ID',
  callback: async function (options) {
    InitNetwork(options);
    const wallet = InitWallet(options);
    const post = { id: options[0] }
    const ret = await axios.postCheck(RouteNetwork("trigger/del"), post, GetWalletToken(wallet, options));
    console.log(ret)
  }
});

trigger.command('list', {
  desc: 'List contextual triggers',
  callback: async function (options) {
    InitNetwork(options);
    const wallet = InitWallet(options);
    const ret = await axios.postCheck(RouteNetwork("trigger/list"), null, GetWalletToken(wallet, options));
    if (ret) {

      // instantiate
      var table = new Table({
        head: ['ID', 'Name', 'Unit', 'CIDR']
      });

      const ipvUnit = {
        ipv4: 0,
        ipv6: 0
      }

      for (var line of ret.list) {
        table.push([
          line.id,
          line.description || '',
          line.unit,
          `${line.start}/${line.mask}`
        ])

        if (line.start.indexOf(":") > 0) ipvUnit.ipv6 += line.unit;
        else ipvUnit.ipv4 += line.unit;
      }
      console.log(table.toString());

      console.log(`Total IPv4 Bits Unit: ${ipvUnit.ipv4}`)
      console.log(`Total IPv6 Bits Unit: ${ipvUnit.ipv6}`)
    }
  }
});
