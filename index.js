const { downloadAndMergeVideo } = require("./download_yt");

const videos = [
    'https://www.youtube.com/watch?v=vNTxnYm81n8&list=PLRWvNQVqAeWI4Fpgkl3gMg2Rnx0dZ_s0r&index=1&pp=iAQB',
    'https://www.youtube.com/watch?v=AJqiXQbB7rY&list=PLRWvNQVqAeWI4Fpgkl3gMg2Rnx0dZ_s0r&index=2&pp=iAQB',
    'https://www.youtube.com/watch?v=9NsghRtIZAw&list=PLRWvNQVqAeWI4Fpgkl3gMg2Rnx0dZ_s0r&index=3&pp=iAQB',
    'https://www.youtube.com/watch?v=C54-nSAihho&list=PLRWvNQVqAeWI4Fpgkl3gMg2Rnx0dZ_s0r&index=4&pp=iAQB',
    'https://www.youtube.com/watch?v=nf8gzXKx1RA&list=PLRWvNQVqAeWI4Fpgkl3gMg2Rnx0dZ_s0r&index=5&pp=iAQB',
    'https://www.youtube.com/watch?v=jRIkN_bywoM&list=PLRWvNQVqAeWI4Fpgkl3gMg2Rnx0dZ_s0r&index=6&pp=iAQB',
    'https://www.youtube.com/watch?v=_gNZR5IEsAA&list=PLRWvNQVqAeWI4Fpgkl3gMg2Rnx0dZ_s0r&index=7&pp=iAQB',
    'https://www.youtube.com/watch?v=cjFE4h2MUQI&list=PLRWvNQVqAeWI4Fpgkl3gMg2Rnx0dZ_s0r&index=8&pp=iAQB',
    'https://www.youtube.com/watch?v=Rz6tvy_KP4I&list=PLRWvNQVqAeWI4Fpgkl3gMg2Rnx0dZ_s0r&index=9&pp=iAQB',
    'https://www.youtube.com/watch?v=ppozUaQN-tM&list=PLRWvNQVqAeWI4Fpgkl3gMg2Rnx0dZ_s0r&index=10&pp=iAQB'
];

videos.forEach(videoUrl => {
    console.log('Download starting...');
    const download = downloadAndMergeVideo(videoUrl);
    download.then(() => console.log('Download complete!'));
});
