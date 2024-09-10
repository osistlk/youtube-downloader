const { Select, Input, Confirm } = require("enquirer");
const ytdl = require("@distube/ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
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
        if (fs.existsSync(TEMP_DIR))
          fs.rmdirSync(TEMP_DIR, { recursive: true, force: true });
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

async function handleVideoMenuSelection() {
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

  const videos = videoFormats.map((format) => {
    return {
      itag: format.itag,
      qualityLabel: format.qualityLabel,
      fps: format.fps,
      container: format.container,
    };
  });

  const useHardwareAccelerationPrompt = new Confirm({
    name: "hw",
    message:
      "Enable hardware acceleration for FFmpeg (only supports CUDA & mp4)?",
  });

  const useHardwareAccelerationAnswer =
    await useHardwareAccelerationPrompt.run();

  const videoItags = new Set(videos.map((video) => video.itag));
  const uniqueVideos = Array.from(videoItags)
    .map((itag) =>
      videos.find((video) => {
        if (useHardwareAccelerationAnswer) {
          return video.itag === itag && video.container === "mp4";
        }
        return video.itag === itag;
      }),
    )
    .filter((video) => !!video)
    .sort();

  const audios = audioFormats.map((format) => {
    return {
      itag: format.itag,
      audioBitrate: format.audioBitrate,
      container: format.container,
    };
  });

  const audioItags = new Set(audios.map((audio) => audio.itag));
  const uniqueAudios = Array.from(audioItags)
    .map((itag) =>
      audios.find((audio) => {
        if (useHardwareAccelerationAnswer) {
          return audio.itag === itag && audio.container === "mp4";
        }
        return audio.itag === itag;
      }),
    )
    .filter((audio) => !!audio)
    .sort();

  const videoChoices = uniqueVideos.map((video) => {
    return {
      message: `${video.qualityLabel}${video.fps ? `@${video.fps}` : ""} - ${video.container}`,
      name: video.itag,
    };
  });

  const videoPrompt = new Select({
    name: "video container",
    message: "Select a video format (I prefer mp4/h264)",
    choices: videoChoices,
  });

  const audioChoices = uniqueAudios.map((audio) => {
    return {
      message: `${audio.audioBitrate} bitrate - ${audio.container}`,
      name: audio.itag,
    };
  });

  const audioPrompt = new Select({
    name: "audio container",
    message: "Select a audio format (I prefer mp4/aac",
    choices: audioChoices,
  });

  const videoAnswer = await videoPrompt.run();
  const audioAnswer = await audioPrompt.run();

  const videoOutput = path.join(
    TEMP_DIR,
    `${title}_video.${videos.find((video) => video.itag === videoAnswer).container}`,
  );
  const audioOutput = path.join(
    TEMP_DIR,
    `${title}_audio.${audios.find((audio) => audio.itag === audioAnswer).container}`,
  );
  const finalOutput = path.join(
    OUTPUT_DIR,
    `${title}.${videos.find((video) => video.itag === videoAnswer).container}`,
  );

  let videoFormat = ytdl.chooseFormat(videoFormats, {
    itag: videoAnswer,
  });
  let audioFormat = ytdl.chooseFormat(audioFormats, {
    itag: audioAnswer,
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
}
