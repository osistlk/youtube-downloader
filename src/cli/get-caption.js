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
    const languageCode = process.argv[3];
    // if itag is not provided, exit
    if (!languageCode) {
        console.error("Please provide a languageCode.");
        process.exit(1);
    }

    // download video based on itag
    const id = ytdl.getURLVideoID(url);
    const info = await ytdl.getInfo(id);
    const caption = info.player_response.captions.playerCaptionsTracklistRenderer.captionTracks.find((caption) => caption.languageCode == languageCode);
    const title = info.videoDetails.title;
    const sanitizedTitle = sanitize(title);
    const filename = `${sanitizedTitle}.caption${caption.vssId}`;
    const output = `./${filename}`;

    console.log(`Downloading ${title}...`);
    const stream = ytdl.downloadFromInfo(info, { lang: languageCode });

    let downloaded = 0;
    const total = caption.contentLength;

    stream.on("progress", (chunkLength, downloadedBytes, totalBytes) => {
        downloaded += chunkLength;
        const percent = ((downloaded / total) * 100).toFixed(2);
        process.stdout.write(`Downloading: ${percent}%\r`);
    });
    stream.pipe(fs.createWriteStream(output));

    await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
    });
    console.log(`Downloaded to ${output}`);
})();
