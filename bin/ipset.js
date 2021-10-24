const sc = require('subcommander');
const fs = require('fs');
const readline = require("readline");
const axios = require("axios");
const { diffLinesRaw } = require('jest-diff');

const { execSync } = require('child_process');

const { GetNetwork, InitNetwork, RouteNetwork } = require("../index")

var ipset = sc.command('ipset', {
  desc: 'Linux IPset controler'
})

function exec(cmd) {
  try {
    execSync(cmd)
  } catch (e) { }
}

ipset.command('init', {
  desc: 'Initialize Linux ipset stream controler',
  callback: async function (options) {
    InitNetwork(options);

    exec(`iptables -D INPUT -j INPUT_BL`)
    exec(`iptables -D OUTPUT -j OUTPUT_BL`)
    exec(`iptables -F INPUT_BL`)
    exec(`iptables -F OUTPUT_BL`)
    exec(`iptables -N INPUT_BL`)
    exec(`iptables -N OUTPUT_BL`)

    exec(`ipset destroy blacklistv4`)
    exec(`ipset create blacklistv4 hash:ip family inet maxelem 10000000`)

    exec(`iptables -A INPUT_BL -m set --match-set blacklistv4 src -j LOG --log-prefix "reoffending input "`)
    exec(`iptables -A INPUT_BL -m set --match-set blacklistv4 src -j DROP`)

    exec(`iptables -A OUTPUT_BL -m set --match-set blacklistv4 dst -j LOG --log-prefix "reoffending output "`)
    exec(`iptables -A OUTPUT_BL -m set --match-set blacklistv4 dst -j DROP`)

    exec(`iptables -A INPUT -j INPUT_BL`)
    exec(`iptables -A OUTPUT -j OUTPUT_BL`)

    // load blacklist
    const ipsetCurrentFile = `${options.dataDir}/current.ipset`;
    const st = fs.createWriteStream(ipsetCurrentFile);

    // touch current
    axios({
      method: 'get',
      url: RouteNetwork(`blacklist`),
      responseType: 'stream'
    }).then(function (response) {
      response.data.pipe(st);
      st.on('finish', () => {
        const list = fs.readFileSync(ipsetCurrentFile, "utf-8").split('\n')
        list.forEach((el) => {
          if (el.length > 0)
            exec(`ipset add blacklistv4 ${el}`);
        })
      })
    })
  }
})

ipset.command('stream', {
  desc: 'Linux ipset stream controler',
  callback: async function (options) {
    InitNetwork(options);

    const ipsetCurrentFile = `${options.dataDir}/current.ipset`;
    const ipsetNextFile = `${options.dataDir}/next.ipset`;

    function update() {
      const st = fs.createWriteStream(ipsetNextFile);

      // touch current
      try {
        fs.statSync(ipsetCurrentFile)
      } catch (e) { fs.writeFileSync(ipsetCurrentFile, "") }

      axios({
        method: 'get',
        url: RouteNetwork(`blacklist`),
        responseType: 'stream'
      }).then(function (response) {
        response.data.pipe(st);

        st.on('finish', () => {
          console.error(`dequeue ends`)

          var differences = diffLinesRaw(
            fs.readFileSync(ipsetCurrentFile, "utf-8").split('\n'),
            fs.readFileSync(ipsetNextFile, "utf-8").split('\n')
          ); // produces diff array

          differences.forEach((a) => {
            const op = a[0];
            if (op === -1) {
              const cmd = `ipset del blacklistv4 ${a[1]}`;
              console.log(cmd); exec(cmd)
            }
          })

          differences.forEach((a) => {
            const op = a[0];
            if (op === 1) {
              const cmd = `ipset add blacklistv4 ${a[1]}`;
              console.log(cmd); exec(cmd)
            }
          })

          // remove and swap
          fs.unlinkSync(ipsetCurrentFile);
          fs.renameSync(ipsetNextFile, ipsetCurrentFile)


          setTimeout(update, 60 * 1000)
        })
      });
    }

    update();

  }
})
