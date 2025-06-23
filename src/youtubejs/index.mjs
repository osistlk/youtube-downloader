import { Innertube } from 'youtubei.js';

const youtubeVideoUrl = 'https://www.youtube.com/watch?v=i_X48Sw9dqI';
const videoId = youtubeVideoUrl.split('v=')[1].split('&')[0];

try {
    const innertube = await Innertube.create();
    const videoInfo = await innertube.getInfo(videoId);
} catch (error) {
    console.error('Failed to get video info:', error);
}
