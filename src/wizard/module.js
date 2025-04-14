const { Select, Input, Confirm } = require("enquirer");
const ytdl = require("@distube/ytdl-core");
const ytpl = require("ytpl");
const ffmpeg = require("fluent-ffmpeg");
const sanitize = require("sanitize-filename");

const path = require("path");
const fs = require("fs");

const { TEMP_DIR, OUTPUT_DIR } = require("./constants");

async function handleURL(youtubeVideoUrl) {
  let id;
  try {
    id = ytdl.getURLVideoID(youtubeVideoUrl);
  } catch (error) {
    console.error("Invalid YouTube URL. Please try again.");
    process.exit(1);
  }
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
      videoCodec: format.videoCodec,
      bitrate: format.bitrate,
      size: format.contentLength,
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
      audioCodec: format.audioCodec,
      sampleRate: format.audioSampleRate,
      size: format.contentLength,
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
      message: `${video.itag} - ${video.qualityLabel}${video.fps ? `@${video.fps}` : ""} - ${video.container} - ${video.videoCodec} - ${video.bitrate} bitrate - ${(video.size / (1024 * 1024)).toFixed(0)} MB`,
      name: video.itag,
    };
  });

  const videoPrompt = new Select({
    name: "video container",
    message: "Select a video format",
    choices: videoChoices,
  });

  const selectedVideoContainer = uniqueVideos[videoPrompt.initial]?.container;

  const audioChoices = uniqueAudios
    .filter((audio) => audio.container === selectedVideoContainer)
    .map((audio) => {
      return {
        message: `${audio.itag} - ${audio.audioBitrate} bitrate - ${audio.container} - ${audio.audioCodec} - ${audio.sampleRate} sample rate - ${(audio.size / (1024 * 1024)).toFixed(0)} MB`,
        name: audio.itag,
      };
    });
  const audioPrompt = new Select({
    name: "audio container",
    message: "Select a audio format",
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

  const clockEmojis = [
    "🕛",
    "🕐",
    "🕑",
    "🕒",
    "🕓",
    "🕔",
    "🕕",
    "🕖",
    "🕗",
    "🕘",
    "🕙",
    "🕚",
  ];
  let clockIndex = 0;
  let videoDownloaded = 0;
  let audioDownloaded = 0;
  let videoContentLength = videoFormat.contentLength;
  let audioContentLength = audioFormat.contentLength;
  const videoStream = ytdl(youtubeVideoUrl, { quality: videoAnswer })
    .on("progress", (_, downloaded, total) => {
      videoDownloaded = downloaded;
      videoContentLength = total;
      const videoPercent = (
        (videoDownloaded / videoContentLength) *
        100
      ).toFixed(0);
      const clock = clockEmojis[clockIndex];
      clockIndex = (clockIndex + 1) % clockEmojis.length;

      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`${clock} Video Download: ${videoPercent}%`);
      process.stdout.cursorTo(40);
      process.stdout.write(
        `Audio Download: ${((audioDownloaded / audioContentLength) * 100).toFixed(0) || "0.00"}%`,
      );
    })
    .on("error", (error) => {
      console.error("Error downloading video stream.");
    })
    .pipe(fs.createWriteStream(videoOutput));
  const audioStream = ytdl(youtubeVideoUrl, { quality: audioAnswer })
    .on("progress", (_, downloaded, total) => {
      audioDownloaded = downloaded;
      audioContentLength = total;
      const audioPercent = (
        (audioDownloaded / audioContentLength) *
        100
      ).toFixed(0);
      const clock = clockEmojis[clockIndex];
      clockIndex = (clockIndex + 1) % clockEmojis.length;

      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      const videoPercent = (
        (videoDownloaded / videoContentLength) *
        100
      ).toFixed(0);
      process.stdout.write(
        `${clock} Video Download: ${videoPercent || "0.00"}%`,
      );
      process.stdout.cursorTo(40);
      process.stdout.write(`Audio Download: ${audioPercent}%`);
    })
    .on("error", (error) => {
      console.error("Error downloading audio stream.");
    })
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
  console.log();
  console.timeEnd("Download time");

  console.time("FFmpeg time");
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
      .on("progress", (progress) => {
        const percent = Math.floor(Number(progress.percent));
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(
          `FFmpeg progress: ${percent > 0 ? percent.toFixed(0) : 0}%\n`,
        );
      })
      .run();
    await new Promise(
      (resolve) => {
        ffmpegCommand.on("end", () => {
          fs.unlinkSync(videoOutput);
          fs.unlinkSync(audioOutput);
          resolve();
        });
      },
      (reject) => {
        ffmpegCommand.on("error", () => {
          console.error("Error with FFmpeg command.");
          fs.unlinkSync(videoOutput);
          fs.unlinkSync(audioOutput);
          reject();
        });
      },
    );
  } else {
    const ffmpegCommand = ffmpeg()
      .input(videoOutput)
      .input(audioOutput)
      .videoCodec("copy")
      .audioCodec("copy")
      .output(finalOutput)
      .on("progress", (progress) => {
        const percent = Math.floor(Number(progress.percent));
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(
          `FFmpeg progress: ${percent > 0 ? percent.toFixed(0) : 0}%\n`,
        );
      })
      .run();
    await new Promise(
      (resolve) => {
        ffmpegCommand.on("end", () => {
          fs.unlinkSync(videoOutput);
          fs.unlinkSync(audioOutput);
          resolve();
        });
      },
      (reject) => {
        ffmpegCommand.on("error", () => {
          console.error("Error with FFmpeg command.");
          fs.unlinkSync(videoOutput);
          fs.unlinkSync(audioOutput);
          reject();
        });
      },
    );
  }
  console.timeEnd("FFmpeg time");
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
