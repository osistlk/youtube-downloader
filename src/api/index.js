const Koa = require("koa");
const Router = require("@koa/router");
const ytdl = require("@distube/ytdl-core");

const app = new Koa();
const router = new Router();

router.get("/video/:id/formats", async (ctx) => {
  const videoId = ctx.params.id;
  // get the video info
  const info = await ytdl.getInfo(videoId);
  // filter out the audio formats
  const audioFormats = info.formats.filter(
    (format) => format.hasAudio && !format.hasVideo,
  );
  const videoFormats = info.formats.filter(
    (format) => format.hasVideo && !format.hasAudio,
  );

  // remove duplicates and sort by itag
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

router.get("/video/:id/download/:itag", async (ctx) => {
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

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});
