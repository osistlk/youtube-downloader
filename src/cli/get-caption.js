const fs = require('fs');
const ytdl = require('@distube/ytdl-core');
const sanitize = require('sanitize-filename');

(async () => {
    const url = process.argv[2];
    const languageCode = process.argv[3];

    if (!url || !languageCode) {
        console.error("Please provide a URL and a language code.");
        process.exit(1);
    }

    const id = ytdl.getURLVideoID(url);
    const info = await ytdl.getInfo(id);
    const caption = info.player_response.captions.playerCaptionsTracklistRenderer.captionTracks.find((caption) => caption.languageCode == languageCode);
    const title = info.videoDetails.title;
    const sanitizedTitle = sanitize(title);
    const filename = `${sanitizedTitle}.caption${caption.vssId}.vtt`;
    const output = `./${filename}`;

    console.log(`Downloading ${title}...`);
    const stream = ytdl.downloadFromInfo(info, { lang: languageCode, format: 'vtt' });

    let downloaded = 0;
    const total = caption.contentLength;

    stream.on("progress", (chunkLength, downloadedBytes, totalBytes) => {
        downloaded += chunkLength;
        let percent = ((downloaded / total) * 100).toFixed(2);
        if (isNaN(percent) || !isFinite(percent)) {
            process.stdout.write(`Downloading: pending...\r`);
        } else {
            process.stdout.write(`Downloading: ${percent}%\r`);
        }
    });
    stream.pipe(fs.createWriteStream(output));

    await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
    });
    console.log(`Downloaded to ${output}`);
})();
