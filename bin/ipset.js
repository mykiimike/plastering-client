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
  console.log(cmd)
  try {
    execSync(cmd, { stdio: 'inherit' })
  } catch (e) { }
}

ipset.command('init', {
  desc: 'Initialize Linux ipset stream controler',
  callback: async function (options) {
    InitNetwork(options);

    exec(`iptables -D INPUT -j INPUT_BL`)
    exec(`iptables -D OUTPUT -j OUTPUT_BL`)
    exec(`iptables -D FORWARD -j FORWARD_BL`)

    exec(`iptables -F INPUT_BL`)
    exec(`iptables -F OUTPUT_BL`)
    exec(`iptables -F FORWARD_BL`)

    exec(`iptables -N INPUT_BL`)
    exec(`iptables -N OUTPUT_BL`)
    exec(`iptables -N FORWARD_BL`)

    // load blacklist
    const ipsetCurrentFile = `${options.dataDir}/current.ipset`;
    const st = fs.createWriteStream(ipsetCurrentFile);

    const ipsetExecFile = `${options.dataDir}/exec.ipset`;
    const execSt = fs.createWriteStream(ipsetExecFile);

    execSt.write(`create blacklistv4IP hash:ip family inet hashsize 65536 maxelem 10000000\n`)
    execSt.write(`create blacklistv4NET hash:net family inet hashsize 65536 maxelem 10000000\n`)

    // touch current
    axios({
      method: 'get',
      url: RouteNetwork(`blacklist/v4`),
      responseType: 'stream'
    }).then(function (response) {
      response.data.pipe(st);
      st.on('finish', () => {
        const list = fs.readFileSync(ipsetCurrentFile, "utf-8").split('\n')
        list.forEach((el) => {
          if (el.length === 0) return;
          const spl = el.split("/")
          if (spl.length === 1)
            execSt.write(`add blacklistv4IP ${el}\n`);
          else if (spl.length === 2)
            execSt.write(`add blacklistv4NET ${el}\n`);
        })
        st.close();
        execSt.close(() => {
          exec(`ipset flush blacklistv4IP`)
          exec(`ipset flush blacklistv4NET`)
          exec(`ipset restore -! < ${ipsetExecFile}`)

          exec(`iptables -A OUTPUT_BL -m set --match-set blacklistv4NET dst -j LOG --log-prefix "PLASTERING NET OUTPUT "`)
          exec(`iptables -A OUTPUT_BL -m set --match-set blacklistv4NET dst -j DROP`)
      
          exec(`iptables -A OUTPUT_BL -m set --match-set blacklistv4IP dst -j LOG --log-prefix "PLASTERING IP OUTPUT "`)
          exec(`iptables -A OUTPUT_BL -m set --match-set blacklistv4IP dst -j DROP`)
      
          exec(`iptables -A FORWARD_BL -m set --match-set blacklistv4NET dst,src -j LOG --log-prefix "PLASTERING NET FORWARD "`)
          exec(`iptables -A FORWARD_BL -m set --match-set blacklistv4NET dst,src -j DROP`)
      
          exec(`iptables -A FORWARD_BL -m set --match-set blacklistv4IP dst,src -j LOG --log-prefix "PLASTERING IP FORWARD "`)
          exec(`iptables -A FORWARD_BL -m set --match-set blacklistv4IP dst,src -j DROP`)
      
          exec(`iptables -A INPUT_BL -m set --match-set blacklistv4NET src -j LOG --log-prefix "PLASTERING NET INPUT "`)
          exec(`iptables -A INPUT_BL -m set --match-set blacklistv4NET src -j DROP`)
      
          exec(`iptables -A INPUT_BL -m set --match-set blacklistv4IP src -j LOG --log-prefix "PLASTERING IP INPUT "`)
          exec(`iptables -A INPUT_BL -m set --match-set blacklistv4IP src -j DROP`)
      
          exec(`iptables -A INPUT -j INPUT_BL`)
          exec(`iptables -A OUTPUT -j OUTPUT_BL`)
          exec(`iptables -A FORWARD -j FORWARD_BL`)
        });

      })
    })
  }
})

ipset.command('stream', {
  desc: 'Linux ipset stream controler',
  callback: async function (options) {
    InitNetwork(options);



    function update() {
      // load blacklist
      const ipsetCurrentFile = `${options.dataDir}/current.ipset`;
      const st = fs.createWriteStream(ipsetCurrentFile);

      const ipsetExecFile = `${options.dataDir}/exec.ipset`;
      const execSt = fs.createWriteStream(ipsetExecFile);

      execSt.write(`create blacklistv4IP_next hash:ip family inet hashsize 65536 maxelem 10000000\n`)
      execSt.write(`create blacklistv4NET_next hash:net family inet hashsize 65536 maxelem 10000000\n`)

      // touch current
      axios({
        method: 'get',
        url: RouteNetwork(`blacklist/v4`),
        responseType: 'stream'
      }).then(function (response) {
        response.data.pipe(st);
        st.on('finish', () => {
          const list = fs.readFileSync(ipsetCurrentFile, "utf-8").split('\n')
          list.forEach((el) => {
            if (el.length === 0) return;
            const spl = el.split("/")
            if (spl.length === 1)
              execSt.write(`add blacklistv4IP_next ${el}\n`);
            else if (spl.length === 2)
              execSt.write(`add blacklistv4NET_next ${el}\n`);
          })
          st.close();
          execSt.close(() => {
            exec(`ipset flush blacklistv4IP_next`)
            exec(`ipset flush blacklistv4NET_next`)
            exec(`ipset restore -! < ${ipsetExecFile}`)
            exec(`ipset swap blacklistv4IP_next blacklistv4IP`)
            exec(`ipset swap blacklistv4NET_next blacklistv4NET`)
            exec(`ipset destroy blacklistv4IP_next`)
            exec(`ipset destroy blacklistv4NET_next`)
          });

          setTimeout(update, 5 * 60 * 1000)
        })
      })
    }

    update();

  }
})

ipset.command('pm2', {
  desc: 'Build PM2 command line',
  callback: async function (options) {
    const name = options.name; delete options.name;
    const bin = `${__dirname}/index.js`
    const cmd = `pm2 start -f ${bin} --name ${name} --cwd ${process.cwd()} -- ipset stream`

    console.log(cmd)
  }
}).option('name', {
  abbr: 'n',
  desc: 'Name of the PM2 Process',
  default: `plastering-ipset`
});;