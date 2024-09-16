const { Select, Input, Confirm } = require("enquirer");
const ytdl = require("@distube/ytdl-core");
const ytpl = require("ytpl");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const { TEMP_DIR, OUTPUT_DIR } = require("./constants");
const sanitize = require("sanitize-filename");

async function handleURL(youtubeVideoUrl) {
  const id = ytdl.getURLVideoID(youtubeVideoUrl);
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

  const videoFilePath = sanitize(
    `${title}_video.${videos.find((video) => video.itag === videoAnswer).container}`,
  );
  const audioFilePath = sanitize(
    `${title}_audio.${audios.find((audio) => audio.itag === audioAnswer).container}`,
  );
  const outputFilePath = sanitize(
    `${title}.${videos.find((video) => video.itag === videoAnswer).container}`,
  );

  const videoOutput = path.join(TEMP_DIR, videoFilePath);
  const audioOutput = path.join(TEMP_DIR, audioFilePath);
  const finalOutput = path.join(OUTPUT_DIR, outputFilePath);

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
    const ffmpegCommand = ffmpeg()
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

async function handleVideoMenuSelection() {
  const prompt = new Input({
    message: "Video URL:",
  });
  const answer = await prompt.run();
  await handleURL(answer);
}

async function handlePlaylistMenuSelection() {
  const prompt = new Input({
    message: "Playlist URL:",
  });
  const answer = await prompt.run();

  const id = await ytpl.getPlaylistID(answer);
  const playlist = await ytpl(id);
  const videos = playlist.items;
  for (const video of videos) {
    await handleURL(video.url);
  }
}

module.exports = { handleVideoMenuSelection, handlePlaylistMenuSelection };
