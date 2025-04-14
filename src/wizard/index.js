const fs = require("fs");
const { TEMP_DIR, greet, mainMenuPrompt } = require("./constants");
const {
  handleVideoMenuSelection,
  handlePlaylistMenuSelection,
} = require("./module");

(async () => {
  greet();
  let run = true;
  while (run) {
    const mainMenuAnswer = await mainMenuPrompt.run();
    switch (mainMenuAnswer) {
      case "exit":
        run = false;
        console.log("\nGoodbye!");
        break;
      case "clean":
        if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true });
        run = false;
        console.log("\nCache cleaned!");
        break;
      case "video":
        await handleVideoMenuSelection();
        run = false;
        console.log("\nGoodbye!");
        break;
      case "playlist":
        await handlePlaylistMenuSelection();
        break;
      default:
        break;
    }
  }
})();
