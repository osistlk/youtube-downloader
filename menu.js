const { Select, Input } = require("enquirer");
const ytdl = require("@distube/ytdl-core");


(async () => {
    // Display a welcome banner
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
                { message: "Exit", value: "exit" },
            ],
        });
        const answer = await prompt.run();

        switch (answer) {
            case "exit":
                run = false;
                console.log("\nGoodbye!");
                break;
            case "video":
                const prompt = new Input({
                    message: 'Video URL:'
                });
                const answer = await prompt.run();
                const id = ytdl.getURLVideoID(answer);
                const info = await ytdl.getInfo(id);
                const formats = info.formats.filter(format => format.hasAudio || format.hasVideo);
                const videoFormats = formats.filter(format => !format.hasAudio && format.hasVideo);
                const audioFormats = formats.filter(format => format.hasAudio && !format.hasVideo);
                const videoFormatPropt = new Select({
                    name: 'video format',
                    message: 'Select a video format',
                    choices: videoFormats.map(format => format.qualityLabel)
                });
                const videoFormatAnswer = await videoFormatPropt.run();
                break;
            case "playlist":
                console.log(2);
                break;

            default:
                break;
        }
    }
})();
