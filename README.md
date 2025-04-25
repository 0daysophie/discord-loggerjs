# logger.js - Discord chat logger and exporter

Setup:

Install NodeJS

run `npm install discord.js-selfbot-v13`

Startup:

`node logger.js`

# input your token
to take your token, open discord.com/app and then open webtools(F12)
Open console section and write:
```javascript
window.webpackChunkdiscord_app.push([
  [Math.random()],
  {},
  req => {
    if (!req.c) return;
    for (const m of Object.keys(req.c)
      .map(x => req.c[x].exports)
      .filter(x => x)) {
      if (m.default && m.default.getToken !== undefined) {
        return copy(m.default.getToken());
      }
      if (m.getToken !== undefined) {
        return copy(m.getToken());
      }
    }
  },
]);
window.webpackChunkdiscord_app.pop();
console.log('%cWorked!', 'font-size: 50px');
console.log(`%cYou now have your token in the clipboard!`, 'font-size: 16px');
```
input type:

- none - will ask for server id and channel ids
- group - group dm
- dm - private dm

input channel id or if server type is selected you can type every for all channels

logs should appear in ./logs and the file names are [name]_[id].log
