const ytpl = require('ytpl');
const { downloadVideo, downloadAudio, processWithFFmpeg } = require("./download_yt");


async function downloadAndProcessVideos(playlistUrl) {
    const playlist = await ytpl(playlistUrl);
    const videoUrls = playlist.items.map(item => item.url);

    const processedVideos = [];
    for (const videoUrl of videoUrls) {
        const videoPath = await downloadVideo(videoUrl);
        const audioPath = await downloadAudio(videoUrl);
        const processedVideo = await processWithFFmpeg(videoPath, audioPath);
        processedVideos.push(processedVideo);
    }

    console.log('Processing completed.');
    console.log('All done.');
}

const playlistUrl = 'https://www.youtube.com/playlist?list=PLRWvNQVqAeWIcz0Ky6pnrKkqsp3MA7o_n';
downloadAndProcessVideos(playlistUrl).catch(console.error);
