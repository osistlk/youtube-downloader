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
})();
