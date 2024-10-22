const Koa = require("koa");
const Router = require("@koa/router");
const ytdl = require("@distube/ytdl-core");
const { v4: uuidv4 } = require("uuid");
const EventEmitter = require("events");
const fs = require("fs");

const app = new Koa();
const router = new Router();
const eventEmitter = new EventEmitter();
const queue = {};
const history = {};
const expired = [];

router.get("/youtube/:id/formats", async (ctx) => {
  const videoId = ctx.params.id;
  const info = await ytdl.getInfo(videoId);
  const audioFormats = info.formats.filter(
    (format) => format.hasAudio && !format.hasVideo,
  );
  const videoFormats = info.formats.filter(
    (format) => format.hasVideo && !format.hasAudio,
  );

  const uniqueAudioFormats = Array.from(
    new Set(audioFormats.map((format) => format.itag)),
  )
    .map((itag) => audioFormats.find((format) => format.itag === itag))
    .sort((a, b) => b.audioBitrate - a.audioBitrate);

  const uniqueVideoFormats = Array.from(
    new Set(videoFormats.map((format) => format.itag)),
  )
    .map((itag) => videoFormats.find((format) => format.itag === itag))
    .sort((a, b) => {
      const getWidth = (qualityLabel) =>
        parseInt(qualityLabel.replace("p", ""), 10);
      return getWidth(b.qualityLabel) - getWidth(a.qualityLabel);
    });

  ctx.body = {
    audioFormats: uniqueAudioFormats,
    videoFormats: uniqueVideoFormats,
  };
});

router.get("/youtube/:id/download/:itag", async (ctx) => {
  const videoId = ctx.params.id;
  const itag = ctx.params.itag;
  const basicInfo = await ytdl.getInfo(videoId);
  const extension = basicInfo.formats.find(
    (format) => format.itag == itag,
  ).container;
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const stream = ytdl(url, { quality: itag });
  ctx.set(
    "Content-Disposition",
    `attachment; filename="${videoId}.${itag}.${extension}"`,
  );
  ctx.body = stream;
});

router.get("/youtube/:id/queue/:itag", async (ctx) => {
  const videoId = ctx.params.id;
  const itag = ctx.params.itag;
  const id = uuidv4();
  const timestamp = new Date().toISOString();
  const retries = 3;
  queue[id] = { videoId, itag, timestamp, retries };
  eventEmitter.emit("queueAdded", { id, videoId, itag, timestamp, retries });
  ctx.body = {
    message: "Added to queue.",
    id,
    videoId,
    itag,
    timestamp,
    retries,
  };
});

router.get("/queue", async (ctx) => {
  ctx.body = queue;
});

router.get("/history", async (ctx) => {
  ctx.body = history;
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});

// Add event listeners
eventEmitter.on("queueAdded", async (data) => {
  console.log("New item added to queue:", data);
  eventEmitter.emit("historyAdded", data);
  // Download itag format to disk
  const { videoId, itag } = data;
  const basicInfo = await ytdl.getInfo(videoId);
  const extension = basicInfo.formats.find(
    (format) => format.itag == itag,
  ).container;
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const stream = ytdl(url, { quality: itag });
  const outputDir = "./downloads";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const output = `${outputDir}/${videoId}.${itag}.${extension}`;
  stream
    .pipe(fs.createWriteStream(output))
    .on("finish", () => {
      // Remove job from queue
      delete queue[data.id];
      // Add to history
      history[data.id] = { ...data, output };
      console.log(`Download finished for ${videoId}.${itag}.${extension}`);
    })
    .on("error", (err) => {
      console.error(`Error downloading ${videoId}.${itag}.${extension}:`, err);
      if (queue[data.id].retries > 0) {
        queue[data.id].retries -= 1;
        console.log(
          `Retries left for ${videoId}.${itag}.${extension}: ${queue[data.id].retries}`,
        );
      } else {
        console.log(
          `No retries left for ${videoId}.${itag}.${extension}. Removing from queue.`,
        );
        delete queue[data.id];
        expired.push(data);
      }
    });
});
