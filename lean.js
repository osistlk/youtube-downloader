const fs = require("fs");
const ytpl = require("ytpl");
const ytdl = require("@distube/ytdl-core");
const { sanitizeFilename } = require("./download_yt");

const playlistUrl =
  "https://www.youtube.com/playlist?list=PLRWvNQVqAeWIcz0Ky6pnrKkqsp3MA7o_n";
ytpl(playlistUrl).then((playlist) => {
  const videoUrls = playlist.items.map((item) => item.url);
  console.log("Video URLs:", videoUrls);
  videoUrls.forEach((videoUrl) => {
    ytdl.getBasicInfo(videoUrl).then((videoInfo) => {
      console.log(videoInfo.videoDetails.title);
      ytdl(videoUrl).pipe(
        fs.createWriteStream(
          `./output/${sanitizeFilename(videoInfo.videoDetails.title)}.mp4`,
        ),
      );
    });
  });
});
