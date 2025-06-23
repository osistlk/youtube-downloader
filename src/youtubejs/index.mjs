import { Innertube } from 'youtubei.js';

const youtubeVideoUrl = 'https://www.youtube.com/watch?v=XanoreTMPco';
const videoId = youtubeVideoUrl.split('v=')[1].split('&')[0];

console.log('Video ID:', videoId);

try {
    const innertube = await Innertube.create();
    const videoInfo = await innertube.getInfo(videoId);
} catch (error) {
    console.error('Failed to get video info:', error);
}
