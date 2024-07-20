const {
  downloadVideo,
  downloadAudio,
  processWithFFmpeg,
} = require("./download_yt");
const { fetchPlaylistShortURLs } = require("./read_playlist");

async function downloadAndProcessVideo(videoUrl) {
  try {
    const [video, audio] = await Promise.all([
      downloadVideo(videoUrl),
      downloadAudio(videoUrl),
    ]);

    if (!video || !audio) {
      throw new Error(`Failed to download video or audio for ${videoUrl}`);
    }

    return processWithFFmpeg(video.path, audio.path, video.title);
  } catch (error) {
    console.error(`Error processing ${videoUrl}:`, error);
    throw error;
  }
}

async function downloadAndProcessVideos(ytVideoUrls, batchSize = 2) {
  console.log("Downloads starting...");

  const processedVideos = [];
  let batchCount = 0;

  for (const videoUrl of ytVideoUrls) {
    const processedVideo = await downloadAndProcessVideo(videoUrl);
    processedVideos.push(processedVideo);
    batchCount++;

    if (batchCount === batchSize) {
      console.log(`Batch of ${batchSize} videos processed.`);
      batchCount = 0;
    }
  }

  console.log("Downloads and processing completed.");
  console.log("All done.");

  return processedVideos;
}

async function main() {
  try {
    const playlistUrl =
      "https://www.youtube.com/watch?v=5PmmtbBgNLI&list=PLRWvNQVqAeWJdepCh2Etmib0drGAHWxAy";
    const videoUrls = await fetchPlaylistShortURLs(playlistUrl);
    console.log("Video URLs:", videoUrls);
    await downloadAndProcessVideos(videoUrls);
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

(async () => {
  console.time("codeDuration");
  await main();
  console.timeEnd("codeDuration");
  return 0;
})();
