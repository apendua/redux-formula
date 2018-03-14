const fs = require('fs');
const mkdirp = require('mkdirp'); // eslint-disable-line

[
  'plugins',
  'presets',
].forEach((name) => {
  mkdirp(name, () => {
    fs.readdir(`./lib/Compiler/${name}`, (err, files) => {
      if (err) {
        console.error(err); // eslint-disable-line
      }
      files.forEach((file) => {
        console.log(`create file: ${name}/${file}`); // eslint-disable-line
        fs.writeFileSync(`./${name}/${file}`, `module.exports = require('../lib/${name}/${file}');\n`);
      });
    });
  });
});

[
  'Compiler',
  'Scope',
].forEach((name) => {
  console.log(`create file: ${name}.js`); // eslint-disable-line
  fs.writeFileSync(`./${name}.js`, `module.exports = require('../lib/Compiler/${name}.js');\n`);
});
