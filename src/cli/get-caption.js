const fs = require("fs");
const ytdl = require("@distube/ytdl-core");
const sanitize = require("sanitize-filename");

(async () => {
  const url = process.argv[2];
  const languageCode = process.argv[3];

  if (!url || !languageCode) {
    console.error("Please provide a URL and a language code.");
    process.exit(1);
  }

  const id = ytdl.getURLVideoID(url);
  const info = await ytdl.getInfo(id);
  const caption =
    info.player_response.captions.playerCaptionsTracklistRenderer.captionTracks.find(
      (caption) => caption.languageCode == languageCode,
    );

  const title = info.videoDetails.title;
  const sanitizedTitle = sanitize(title);
  const filename = `${sanitizedTitle}.caption${caption.vssId}.ttml`; // TimedText XML
  const output = `./${filename}`;

  console.log(`Downloading ${title}...`);
  const captionUrl = caption.baseUrl;

  const response = await fetch(captionUrl);
  const vttData = await response.text();

  if (
    !vttData ||
    vttData.trim().length === 0 ||
    vttData.includes("<Error>") ||
    vttData.toLowerCase().includes("malformed")
  ) {
    console.error("Downloaded caption file is empty or malformed.");
    process.exit(1);
  }
  fs.writeFileSync(output, vttData);
  console.log(`Downloaded to ${output}`);
})();
