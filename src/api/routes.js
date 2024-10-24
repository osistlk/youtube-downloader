const ytdl = require("@distube/ytdl-core");
const { randomUUID } = require("crypto");
const { queue, history, log } = require("./state");

const MAX_RETRIES = 3;

const setupRoutes = (router) => {
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

  router.get("/youtube/:videoId/queue/:itag", async (ctx) => {
    const { videoId, itag } = ctx.params;
    console.log(`Adding ${videoId}.${itag} to queue.`);
    const id = randomUUID();
    const timestamp = new Date().toISOString();
    const retries = MAX_RETRIES;
    queue[id] = { videoId, itag, timestamp, retries };
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

  router.get("/log", async (ctx) => {
    ctx.body = log;
  });
};

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

module.exports = { setupRoutes };
