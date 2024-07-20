const fs = require("fs-extra");
const path = require("path");
const { performance } = require("perf_hooks");
const ytdl = require("@distube/ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const cliProgress = require("cli-progress");

// create new progress bar container
const multi = new cliProgress.MultiBar(
  {
    clearOnComplete: false,
    hideCursor: true,
    format: `Downloading {id} |{bar}| {percentage}% || ETA: {eta}s || Elapsed: {duration}s`,
  },
  cliProgress.Presets.shades_classic,
);

// ANSI escape codes for colors
const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
};

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

function displayMessage(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function sanitizeFilename(name) {
  return name
    .replace(/[^a-z0-9\s]/gi, "_")
    .replace(/_+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function displayVideoStats(file) {
  ffmpeg.ffprobe(file, (err, data) => {
    if (err) {
      console.error("Error in ffprobe:", err);
      return;
    }

    displayMessage(`Video Statistics for ${file}:`, "cyan");
    console.log(
      `Format: ${data.format.format_name}, Duration: ${data.format.duration}s, Size: ${data.format.size} bytes`,
    );

    data.streams.forEach((stream, index) => {
      if (stream.codec_type === "video") {
        console.log(
          `Video Stream ${index + 1}: Codec: ${stream.codec_name}, Resolution: ${stream.width}x${stream.height}`,
        );
      } else if (stream.codec_type === "audio") {
        console.log(
          `Audio Stream ${index + 1}: Codec: ${stream.codec_name}, Bitrate: ${stream.bit_rate}, Sample rate: ${stream.sample_rate}`,
        );
      }
    });
  });
}

async function downloadAndMergeVideo(url) {
  try {
    displayMessage("Starting download and merge process...", "cyan");

    displayMessage("Loading download link info...", "yellow");
    const info = await ytdl.getInfo(url);
    displayMessage("Download link info loaded.", "green");

    const title = sanitizeFilename(info.videoDetails.title);
    const videoDurationInSeconds = parseFloat(info.videoDetails.lengthSeconds);

    const videoFormat = ytdl.chooseFormat(info.formats, {
      quality: "highestvideo",
      filter: "videoonly",
    });
    const audioFormat = ytdl.chooseFormat(info.formats, {
      quality: "highestaudio",
      filter: "audioonly",
    });

    if (!videoFormat || !audioFormat) {
      displayMessage("Suitable video or audio format not found.", "red");
      return;
    }

    const videoOutput = path.join(TEMP_DIR, `${title}_video.mp4`);
    const audioOutput = path.join(TEMP_DIR, `${title}_audio.webm`);
    const finalOutput = path.join(OUTPUT_DIR, `${title}.mp4`);

    const videoStream = ytdl
      .downloadFromInfo(info, { format: videoFormat })
      .pipe(fs.createWriteStream(videoOutput));
    const audioStream = ytdl
      .downloadFromInfo(info, { format: audioFormat })
      .pipe(fs.createWriteStream(audioOutput));

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

    const startTime = performance.now();

    ffmpeg()
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
      .on("error", (err) => {
        console.error("Error during merging:", err);
      })
      .on("progress", (progress) => {
        console.clear();
        let currentTime = progress.timemark
          .split(":")
          .reduce((acc, time) => 60 * acc + +time);
        let percentage = (currentTime / videoDurationInSeconds * 100).toFixed(
          2,
        );

        if (percentage >= 0) {
          let elapsedTime = (performance.now() - startTime) / 1000;
          let formattedTime;

          if (elapsedTime < 60) {
            formattedTime = `${Math.floor(elapsedTime)}s`;
          } else {
            formattedTime = `${Math.floor(elapsedTime / 60)}m`;
          }

          // eslint-disable-next-line no-undef
          process.stdout.write(
            `Merging progress: ${percentage}% - Elapsed time: ${formattedTime}\r`,
          );
        }
      })
      .on("end", () => {
        displayMessage("\nMerging completed.", "green");
        let totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`Total time taken: ${totalTime}s`);
        displayVideoStats(finalOutput);
        fs.unlinkSync(videoOutput);
        fs.unlinkSync(audioOutput);
      })
      .saveToFile(finalOutput);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function downloadVideo(url) {
  const videoInfo = await ytdl.getInfo(url);
  const videoId = videoInfo.videoDetails.videoId;
  const videoTitle = sanitizeFilename(videoInfo.videoDetails.title);
  const videoPath = path.join("temp", `${videoTitle}.mp4`);
  const video = { id: videoId, title: videoTitle, path: videoPath };

  return new Promise((resolve, reject) => {
    ytdl(url, { quality: "highestvideo", filter: "videoonly" })
      .pipe(fs.createWriteStream(videoPath))
      .on("finish", () => resolve(video))
      .on("error", reject);
  });
}

async function downloadAudio(url) {
  const videoInfo = await ytdl.getInfo(url);
  const videoId = videoInfo.videoDetails.videoId;
  const videoTitle = sanitizeFilename(videoInfo.videoDetails.title);
  const audioPath = path.join("temp", `${videoTitle}.mp4a`);
  const audio = { id: videoId, title: videoTitle, path: audioPath };

  return new Promise((resolve, reject) => {
    ytdl(url, { quality: "highestaudio", filter: "audioonly" })
      .pipe(fs.createWriteStream(audioPath))
      .on("finish", () => resolve(audio))
      .on("error", reject);
  });
}

async function processWithFFmpeg(videoPath, audioPath, videoTitle = videoPath) {
  const outputPath = path.join("output", `${sanitizeFilename(videoTitle)}.mp4`);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
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
      .input(audioPath)
      .audioCodec("aac")
      .save(outputPath)
      .on("end", async () => {
        await fs.remove(videoPath);
        await fs.remove(audioPath);
        resolve(outputPath);
      })
      .on("error", reject);
  });
}
// Add this at the end of your script file
module.exports = {
  downloadAndMergeVideo,
  downloadVideo,
  downloadAudio,
  processWithFFmpeg,
  sanitizeFilename,
};
