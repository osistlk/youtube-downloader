const { downloadAndMergeVideo } = require("./download_yt");

const videos = [
    'https://www.youtube.com/watch?v=OJZIjmzOOFE&list=PLRWvNQVqAeWJarmdncJk0jFhijoqi3PDo&index=6&pp=iAQB',
    'https://www.youtube.com/watch?v=9VOmk-Q_1vM&list=PLRWvNQVqAeWJarmdncJk0jFhijoqi3PDo&index=7&pp=iAQB',
    'https://www.youtube.com/watch?v=LpaAi4QHtqM&list=PLRWvNQVqAeWJarmdncJk0jFhijoqi3PDo&index=8&pp=iAQB',
    'https://www.youtube.com/watch?v=Bgi01v9CVJc&list=PLRWvNQVqAeWJarmdncJk0jFhijoqi3PDo&index=9&pp=iAQB',
    'https://www.youtube.com/watch?v=m_p2ro6uOcI&list=PLRWvNQVqAeWJarmdncJk0jFhijoqi3PDo&index=10&pp=iAQB'
];

videos.forEach(videoUrl => {
    console.log('Download starting...');
    const download = downloadAndMergeVideo(videoUrl);
    download.then(() => console.log('Download complete!'));
});
