const path = require("path");
const fs = require("fs");

const { Select } = require("enquirer");

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

const mainMenuPrompt = new Select({
  name: "action",
  message: "Choose an option",
  choices: [
    { message: "Download video", name: "video", value: "#00FF00" },
    { message: "Download playlist", name: "playlist", value: "#FFFF00" },
    { message: "Clean cache", name: "clean" },
    { message: "Exit", value: "exit" },
  ],
});

module.exports = { TEMP_DIR, OUTPUT_DIR, greet, mainMenuPrompt };
