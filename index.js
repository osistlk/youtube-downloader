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

async function downloadAndProcessVideos(ytVideoUrls) {
  console.log("Downloads starting...");

  const processedVideos = await Promise.all(
    ytVideoUrls.map((videoUrl) => downloadAndProcessVideo(videoUrl)),
  );

  console.log("Downloads and processing completed.");
  console.log("All done.");

  return processedVideos;
}

async function main() {
  try {
    const playlistUrl =
      "https://www.youtube.com/playlist?list=PLRWvNQVqAeWLPYrIW3bUWik62khdhk2Ro";
    const videoUrls = await fetchPlaylistShortURLs(playlistUrl);

    console.log("Video URLs:", videoUrls);
    await downloadAndProcessVideos(videoUrls);
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

main();
