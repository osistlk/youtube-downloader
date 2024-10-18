(async () => {
  const ytdl = require("@distube/ytdl-core");

  const fs = require("fs");

  // read youtube url from parameter
  const url = process.argv[2];
  // if url is not provided, exit
  if (!url) {
    console.error("Please provide a URL.");
    process.exit(1);
  }

  const id = ytdl.getURLVideoID(url);
  const info = await ytdl.getInfo(id);
  const audioFormats = info.formats.filter(
    (format) => format.hasAudio && !format.hasVideo,
  );
  // remove duplicates and sort by itag
  const uniqueAudioFormats = Array.from(
    new Set(audioFormats.map((format) => format.itag)),
  )
    .map((itag) => audioFormats.find((format) => format.itag === itag))
    .sort((a, b) => b.itag - a.itag);

  console.log("Available audio formats:");
  uniqueAudioFormats.forEach((format) => {
    const contentLengthMB = (format.contentLength / (1024 * 1024)).toFixed(2);
    console.log(
      `itag: ${format.itag}, container: ${format.container}, audioBitrate: ${format.audioBitrate}, audioSampleRate: ${format.audioSampleRate}, audioCodec: ${format.audioCodec}, contentLength: ${contentLengthMB} MB`,
    );
  });
})();
