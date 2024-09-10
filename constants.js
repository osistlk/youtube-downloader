const path = require("path");
const fs = require("fs");

// eslint-disable-next-line no-undef
const TEMP_DIR = path.join(__dirname, "temp");
// eslint-disable-next-line no-undef
const OUTPUT_DIR = path.join(__dirname, "output");

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

const GREETING = `
  *******************************
  *  Youtube Downloader  *
  *******************************
  `;
const greet = () => {
  console.log(GREETING);
};

module.exports = { TEMP_DIR, OUTPUT_DIR, greet };
