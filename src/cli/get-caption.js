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

  if (!caption) {
    console.error(`No caption found for language code: ${languageCode}`);
    process.exit(1);
  }

  const title = info.videoDetails.title;
  const sanitizedTitle = sanitize(title);
  const filename = `${sanitizedTitle}.caption${caption.vssId}.json`; // TimedText JSON
  const output = `./${filename}`;

  console.log(`Downloading ${title}...`);
  const captionUrl = caption.baseUrl;

  const response = await fetch(captionUrl, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    console.error(`Failed to fetch: ${response.status} ${response.statusText}`);
    process.exit(1);
  }
  const vttData = await response.text();
  if (!vttData || vttData.trim().length === 0) {
    console.error("Downloaded caption file is empty.");
    process.exit(1);
  }

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
