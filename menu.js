/* eslint-disable no-case-declarations */
const { Select, Input, Confirm } = require("enquirer");
const ytdl = require("@distube/ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

// Directories
// eslint-disable-next-line no-undef
const TEMP_DIR = path.join(__dirname, "temp");
// eslint-disable-next-line no-undef
const OUTPUT_DIR = path.join(__dirname, "output");

// Ensure temp and output directories exist
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
}
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

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
                    message: "Video URL:",
                });
                const answer = await prompt.run();

                const id = ytdl.getURLVideoID(answer);
                const info = await ytdl.getInfo(id);
                const title = info.videoDetails.title;

                const formats = info.formats.filter(
                    (format) => format.hasAudio || format.hasVideo,
                );
                const videoFormats = formats.filter(
                    (format) => !format.hasAudio && format.hasVideo,
                );
                const audioFormats = formats.filter(
                    (format) => format.hasAudio && !format.hasVideo,
                );

                const videoQualities = Array.from(
                    new Set(videoFormats.map((format) => format.qualityLabel)),
                ).sort((a, b) => {
                    const na = Number(a.replace("p", ""));
                    const nb = Number(b.replace("p", ""));
                    return na > nb ? -1 : na < nb ? 1 : 0;
                });
                const videoContainers = Array.from(
                    new Set(videoFormats.map((format) => format.container)),
                ).sort();
                const audioBitrates = Array.from(
                    new Set(audioFormats.map((format) => format.audioBitrate)),
                ).sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));
                const audioContainers = Array.from(
                    new Set(audioFormats.map((format) => format.container)),
                ).sort();

                const videoQualityPrompt = new Select({
                    name: "video format",
                    message: "Select a video quality (higher is better/larger)",
                    choices: videoQualities,
                });
                const videoContainerPrompt = new Select({
                    name: "video container",
                    message: "Select a video container (I prefer mp4/h264)",
                    choices: videoContainers,
                });
                const audioBitratePrompt = new Select({
                    name: "audio bitrate",
                    message: "Select a audio bitrate (higher is better/larger)",
                    choices: audioBitrates.map((bitrate) => "" + bitrate),
                });
                const audioContainerPrompt = new Select({
                    name: "audio container",
                    message: "Select a audio container (I prefer mp4a/aac",
                    choices: audioContainers,
                });

                const useHardwareAccelerationPrompt = new Confirm({
                    name: "hw",
                    message: "Enable hardware acceleration (for FFmpeg)?",
                });

                const videoQualityAnswer = await videoQualityPrompt.run();
                const videoContainerAnswer = await videoContainerPrompt.run();
                const audioBitrateAnswer = await audioBitratePrompt.run();
                const audioContainerAnswer = await audioContainerPrompt.run();
                const useHardwareAccelerationAnswer =
                    await useHardwareAccelerationPrompt.run();

                const videoOutput = path.join(
                    TEMP_DIR,
                    `${title}_video.${videoContainerAnswer}`,
                );
                const audioOutput = path.join(
                    TEMP_DIR,
                    `${title}_audio.${audioContainerAnswer}a`,
                );
                const finalOutput = path.join(
                    OUTPUT_DIR,
                    `${title}.${videoContainerAnswer}`,
                );

                let videoFormat = ytdl.chooseFormat(videoFormats, {
                    qualityLabel: videoQualityAnswer,
                    container: videoContainerAnswer,
                });
                let audioFormat = ytdl.chooseFormat(audioFormats, {
                    audioBitrate: audioBitrateAnswer,
                    container: audioContainerAnswer,
                });

                const videoStream = ytdl
                    .downloadFromInfo(info, { format: videoFormat })
                    .pipe(fs.createWriteStream(videoOutput));
                const audioStream = ytdl
                    .downloadFromInfo(info, { format: audioFormat })
                    .pipe(fs.createWriteStream(audioOutput));

                console.log("Downloading...");
                console.time("Download time");
                await Promise.all([
                    new Promise((resolve, reject) => {
                        videoStream.on("finish", resolve);
                        videoStream.on("error", reject);
                    }),
                    new Promise((resolve, reject) => {
                        audioStream.on("finish", resolve);
                        audioStream.on("error", reject);
                    }),
                ]);
                console.timeEnd("Download time");

                if (useHardwareAccelerationAnswer) {
                    const ffmpegCommand = await ffmpeg()
                        .input(videoOutput)
                        .inputOptions(
                            "-y",
                            "-vsync",
                            "0",
                            "-hwaccel",
                            "cuda",
                            "-hwaccel_output_format",
                            "cuda",
                        )
                        .videoCodec("h264_nvenc")
                        .input(audioOutput)
                        .audioCodec("aac")
                        .output(finalOutput)
                        .on("end", () => {
                            fs.unlinkSync(videoOutput);
                            fs.unlinkSync(audioOutput);
                        });
                    ffmpegCommand.run();
                }

                break;
            case "playlist":
                console.log(2);
                break;

            default:
                break;
        }
    }
})();
