const { downloadAndMergeVideo } = require("./download_yt");

const videos = [
    'https://www.youtube.com/watch?v=sdOQ-jX0ymk'
];

videos.forEach(videoUrl => {
    console.log('Download starting...');
    const download = downloadAndMergeVideo(videoUrl);
    download.then(() => console.log('Download complete!'));
});
