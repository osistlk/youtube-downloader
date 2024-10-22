const fs = require("fs");
const ytdl = require("@distube/ytdl-core");
const { queue, history, expired } = require("./state");

const setupEventListeners = (eventEmitter) => {
  eventEmitter.on("queueAdded", async (data) => {
    console.log("New item added to queue:", data);
    eventEmitter.emit("historyAdded", data);
    await downloadVideo(data);
  });

  setInterval(checkQueue, 60000);
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
    stream
      .pipe(fs.createWriteStream(output))
      .on("finish", () => {
        delete queue[id];
        history[id] = { videoId, itag, output };
        console.log(`Download finished for ${videoId}.${itag}.${extension}`);
      })
      .on("error", (err) => handleDownloadError(err, id, videoId, itag));
  } catch (err) {
    console.error(`Error downloading ${videoId}.${itag}:`, err);
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
  }
};

const checkQueue = () => {
  for (const id in queue) {
    const { videoId, itag, retries } = queue[id];
    console.log(`Checking ${videoId}.${itag} with ${retries} retries left`);
    if (retries === 0) {
      console.log(
        `No retries left for ${videoId}.${itag}. Removing from queue.`,
      );
      delete queue[id];
      expired.push(queue[id]);
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
