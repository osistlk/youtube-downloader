(async () => {
  const ytdl = require("@distube/ytdl-core");

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
  const videoFormats = info.formats.filter(
    (format) => format.hasVideo && !format.hasAudio,
  );
  const captionFormats =
    info.player_response.captions.playerCaptionsTracklistRenderer
      .captionTracks || [];

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

  console.log("Available audio formats:");
  uniqueAudioFormats.forEach((format) => {
    const contentLengthMB = (format.contentLength / (1024 * 1024)).toFixed(2);
    console.log(
      `itag: ${format.itag}, container: ${format.container}, bitrate: ${format.audioBitrate}, sample rate: ${format.audioSampleRate}, codec: ${format.audioCodec}, size: ${contentLengthMB} MB`,
    );
  });
  console.log("Available video formats:");
  uniqueVideoFormats.forEach((format) => {
    const contentLengthMB = (format.contentLength / (1024 * 1024)).toFixed(2);
    console.log(
      `itag: ${format.itag}, container: ${format.container}, bitrate: ${format.bitrate}, codec: ${format.videoCodec}, quality: ${format.qualityLabel}, fps: ${format.fps}, size: ${contentLengthMB} MB`,
    );
  });
  console.log("Available captions:");
  captionFormats.forEach((caption) => {
    console.log(
      `language: ${caption.languageCode}, name: ${caption.name.simpleText}`,
    );
  });
})();
