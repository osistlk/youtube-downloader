const Koa = require("koa");
const Router = require("@koa/router");
const ytdl = require("@distube/ytdl-core");
const { randomUUID } = require("crypto");
const fs = require("fs");

// constants
const PORT = 3000;
const MAX_DOWNLOADS = 5;
const MAX_RETRIES = 3;

const app = new Koa();
const router = new Router();

// state
const pending = new Set();
const completed = new Set();
const failed = new Set();
const expired = new Array();
const log = new Array();
let download_count = 0;

// utilities
const filterFormats = (formats, type) => {
  return formats.filter((format) =>
    type === "audio"
      ? format.hasAudio && !format.hasVideo
      : format.hasVideo && !format.hasAudio,
  );
};

const uniqueFormats = (formats, sortKey) => {
  return Array.from(new Set(formats.map((format) => format.itag)))
    .map((itag) => formats.find((format) => format.itag === itag))
    .sort((a, b) =>
      sortKey === "audioBitrate"
        ? b[sortKey] - a[sortKey]
        : parseInt(b[sortKey].replace("p", ""), 10) -
          parseInt(a[sortKey].replace("p", ""), 10),
    );
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

const setupEventListeners = () => {
  setInterval(checkPendingQueue, 1000);
  setInterval(displayServerStatus, 1000);
};

const displayServerStatus = () => {
  process.stdout.write("\x1Bc");
  process.stdout.write("Server is running at http://localhost:3000\n");
  process.stdout.write(`Pending: ${Object.keys(pending).length}\n`);
  process.stdout.write(`Active: ${download_count}\n`);
  process.stdout.write(`Completed: ${Object.keys(completed).length}\n`);
  process.stdout.write(`Failed: ${Object.keys(failed).length}\n`);
  process.stdout.write(`Expired: ${expired.length}\n`);
  process.stdout.write(`History: ${Object.keys(log).length}\n`);
  process.stdout.write(
    `Total: ${Object.keys(pending).length + Object.keys(completed).length + Object.keys(failed).length + expired.length}\n`,
  );
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
        delete pending[id];
        log[id] = { videoId, itag, output };
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
  if (pending[id].retries > 0) {
    pending[id].retries -= 1;
    console.log(`Retries left for ${videoId}.${itag}: ${pending[id].retries}`);
  } else {
    console.log(
      `No retries left for ${videoId}.${itag}. Removing from the pending queue.`,
    );
    delete pending[id];
    expired.push({ id, videoId, itag });
    download_count -= 1; // Decrement download count when removing from the pending queue
  }
};

const checkPendingQueue = () => {
  if (download_count < MAX_DOWNLOADS) {
    const oldestItemId = Object.keys(pending).shift();
    if (oldestItemId) {
      const { videoId, itag, retries } = pending[oldestItemId];
      console.log(`Processing ${videoId}.${itag} with ${retries} retries left`);
      if (retries > 0) {
        downloadVideo({ id: oldestItemId, videoId, itag });
      } else {
        console.log(
          `No retries left for ${videoId}.${itag}. Removing from the pending queue.`,
        );
        delete pending[oldestItemId];
        expired.push({ id: oldestItemId, videoId, itag });
      }
    }
  }
};

// routes
router.get("/youtube/:id/formats", async (ctx) => {
  const videoId = ctx.params.id;
  const info = await ytdl.getInfo(videoId);
  const audioFormats = filterFormats(info.formats, "audio");
  const videoFormats = filterFormats(info.formats, "video");

  ctx.body = {
    audioFormats: uniqueFormats(audioFormats, "audioBitrate"),
    videoFormats: uniqueFormats(videoFormats, "qualityLabel"),
  };
});

router.get("/youtube/:id/download/:itag", async (ctx) => {
  const { videoId, itag } = ctx.params;
  const { stream, extension } = await getStreamAndExtension(videoId, itag);
  ctx.set(
    "Content-Disposition",
    `attachment; filename="${videoId}.${itag}.${extension}"`,
  );
  ctx.body = stream;
});

router.get("/youtube/:videoId/pending/:itag", async (ctx) => {
  const { videoId, itag } = ctx.params;
  console.log(`Adding ${videoId}.${itag} to the pending queue.`);
  const id = randomUUID();
  const timestamp = new Date().toISOString();
  const retries = MAX_RETRIES;
  pending[id] = { videoId, itag, timestamp, retries };
  ctx.body = {
    message: "Added to the pending queue.",
    id,
    videoId,
    itag,
    timestamp,
    retries,
  };
});

router.get("/pending", async (ctx) => {
  ctx.body = pending;
});

router.get("/completed", async (ctx) => {
  ctx.body = completed;
});

router.get("/failed", async (ctx) => {
  ctx.body = failed;
});

router.get("/expired", async (ctx) => {
  ctx.body = expired;
});

router.get("/log", async (ctx) => {
  ctx.body = log;
});

// cors
app.use(router.routes()).use(router.allowedMethods());

// app start
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  setupEventListeners();
});
