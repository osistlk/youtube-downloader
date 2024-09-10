const { Select } = require("enquirer");
const fs = require("fs");
const { TEMP_DIR } = require("./constants");
const { handleVideoMenuSelection } = require("./module");

(async () => {
  console.log(`
    *******************************
    *  Youtube Downloader  *
    *******************************
    `);

  let run = true;

  while (run) {
    const prompt = new Select({
      name: "action",
      message: "Choose an option",
      choices: [
        { message: "Download video", name: "video", value: "#00FF00" },
        { message: "Download playlist", name: "playlist", value: "#FFFF00" },
        { message: "Clean cache", name: "clean" },
        { message: "Exit", value: "exit" },
      ],
    });
    const answer = await prompt.run();

    switch (answer) {
      case "exit":
        run = false;
        console.log("\nGoodbye!");
        break;
      case "clean":
        if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true });
        break;
      case "video":
        await handleVideoMenuSelection();
        break;
      case "playlist": // TODO handle playlist URL
        console.log(2);
        break;

      default:
        break;
    }
  }
})();
