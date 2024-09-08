const { Select } = require("enquirer");

(async () => {
    // Display a welcome banner
    console.log(`
    *******************************
    *  Youtube Downloader  *
    *******************************
    `);

    let run = true;

    while (run) {
        let mainMenu = new Select({
            name: "action",
            message: "Choose an option",
            choices: [
                { message: "Download video", name: "video", value: "#00FF00" },
                { message: "Download playlist", name: "playlist", value: "#FFFF00" },
                { message: "Exit", value: "exit" },
            ],
        });
        const answer = await mainMenu.run();

        switch (answer) {
            case "exit":
                run = false;
                console.log("\nGoodbye!");
                break;
            case "video":
                console.log(1);
                break;
            case "playlist":
                console.log(2);
                break;

            default:
                break;
        }
    }
})();
