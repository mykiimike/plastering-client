const sc = require('subcommander');
const fs = require('fs');
const readline = require("readline");
const axios = require("axios");
const { GetNetwork, InitNetwork, RouteNetwork } = require("../index")

sc.command('blacklist', {
  desc: 'Generate the blacklist',
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

      if (options.format === 'ipset') {
        console.log(`iptables -D INPUT -j INPUT_BL`)
        console.log(`iptables -D OUTPUT -j OUTPUT_BL`)
        console.log(`iptables -F INPUT_BL`)
        console.log(`iptables -F OUTPUT_BL`)
        console.log(`iptables -N INPUT_BL`)
        console.log(`iptables -N OUTPUT_BL`)

        console.log(`ipset destroy blacklistv4`)
        console.log(`ipset create blacklistv4 hash:ip family inet maxelem 10000000`)

        rl.on('line', (input) => {
          console.log(`ipset add blacklistv4 ${input}`)
        });

        response.data.on('end', () => {
          console.log(`iptables -A INPUT_BL -m set --match-set blacklistv4 src -j LOG --log-prefix "reoffending input "`)
          console.log(`iptables -A INPUT_BL -m set --match-set blacklistv4 src -j DROP`)

          console.log(`iptables -A OUTPUT_BL -m set --match-set blacklistv4 dst -j LOG --log-prefix "reoffending output "`)
          console.log(`iptables -A OUTPUT_BL -m set --match-set blacklistv4 dst -j DROP`)

          console.log(`iptables -A INPUT -j INPUT_BL`)
          console.log(`iptables -A OUTPUT -j OUTPUT_BL`)
          console.error(`dequeue ends`)
        })
      }
      else {
        rl.on('line', async (input) => {
          console.log(`${input}`)
        });
      }

    });
  }
}).option('format', {
  abbr: 'f',
  desc: 'Format blacklist (ipset/raw)',
  default: 'ipset'
});
