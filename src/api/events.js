const fs = require("fs");
const ytdl = require("@distube/ytdl-core");
const { queue, history, expired } = require("./state");

const MAX_DOWNLOADS = 5;
let download_count = 0;

const setupEventListeners = () => {
  setInterval(checkQueue, 1000);
  setInterval(displayServerStatus, 1000);
};

const displayServerStatus = () => {
  process.stdout.write("\x1Bc");
  process.stdout.write("Server is running at http://localhost:3000\n");
  process.stdout.write(`Queue size: ${Object.keys(queue).length}\n`);
  process.stdout.write(`History size: ${Object.keys(history).length}\n`);
  process.stdout.write(`Expired size: ${expired.length}\n`);
  process.stdout.write(`Current downloads: ${download_count}\n`);
};

const downloadVideo = async ({ id, videoId, itag }) => {
  try {
    console.log(`Downloading ${videoId}.${itag}`);
    const { stream, extension } = await getStreamAndExtension(videoId, itag);
    const outputDir = "./downloads";
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const output = `${outputDir}/${videoId}.${itag}.${extension}`;
    download_count += 1; // Increment download count when starting a download
    stream
      .pipe(fs.createWriteStream(output))
      .on("finish", () => {
        delete queue[id];
        history[id] = { videoId, itag, output };
        console.log(`Download finished for ${videoId}.${itag}.${extension}`);
        download_count -= 1; // Decrement download count when download finishes
      })
      .on("error", (err) => handleDownloadError(err, id, videoId, itag));
  } catch (err) {
    console.error(`Error downloading ${videoId}.${itag}:`, err);
    download_count -= 1; // Decrement download count if an error occurs
  }
};

const handleDownloadError = (err, id, videoId, itag) => {
  console.error(`Error downloading ${videoId}.${itag}:`, err);
  if (queue[id].retries > 0) {
    queue[id].retries -= 1;
    console.log(`Retries left for ${videoId}.${itag}: ${queue[id].retries}`);
  } else {
    console.log(`No retries left for ${videoId}.${itag}. Removing from queue.`);
    delete queue[id];
    expired.push({ id, videoId, itag });
    download_count -= 1; // Decrement download count when removing from queue
  }
};

const checkQueue = () => {
  if (download_count < MAX_DOWNLOADS) {
    const oldestItemId = Object.keys(queue).shift();
    if (oldestItemId) {
      const { videoId, itag, retries } = queue[oldestItemId];
      console.log(`Processing ${videoId}.${itag} with ${retries} retries left`);
      if (retries > 0) {
        downloadVideo({ id: oldestItemId, videoId, itag });
      } else {
        console.log(`No retries left for ${videoId}.${itag}. Removing from queue.`);
        delete queue[oldestItemId];
        expired.push({ id: oldestItemId, videoId, itag });
      }
    }
  }
};

const getStreamAndExtension = async (videoId, itag) => {
  const info = await ytdl.getInfo(videoId);
  const extension = info.formats.find(
    (format) => format.itag == itag,
  ).container;
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const stream = ytdl(url, { quality: itag });
  return { stream, extension };
};

module.exports = { setupEventListeners };
