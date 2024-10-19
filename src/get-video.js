(async () => {
  const fs = require("fs");
  const ytdl = require("@distube/ytdl-core");
  const sanitize = require("sanitize-filename");

  // read youtube url from parameter
  const url = process.argv[2];
  // if url is not provided, exit
  if (!url) {
    console.error("Please provide a URL.");
    process.exit(1);
  }

  // read video itag from parameter
  const itag = process.argv[3];
  // if itag is not provided, exit
  if (!itag) {
    console.error("Please provide an itag.");
    process.exit(1);
  }

  // download video based on itag
  const id = ytdl.getURLVideoID(url);
  const info = await ytdl.getInfo(id);
  const format = info.formats.find((format) => format.itag == itag);
  const title = info.videoDetails.title;
  const sanitizedTitle = sanitize(title);
  const filename = `${sanitizedTitle}.video.${format.container}`;
  const output = `./${filename}`;

  console.log(`Downloading ${title}...`);
  ytdl(url, { quality: itag }).pipe(fs.createWriteStream(output));
  console.log(`Downloaded to ${output}`);
})();
