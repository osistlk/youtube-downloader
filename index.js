const ytpl = require('ytpl')
const { downloadVideo, downloadAudio, processWithFFmpeg } = require("./download_yt")

async function downloadAndProcessVideos(ytVideoUrls) {
    let videoPromises = []
    let audioPromises = []

    console.log('Downloads starting...')
    for (const videoUrl of ytVideoUrls) {
        videoPromises.push(downloadVideo(videoUrl))
        audioPromises.push(downloadAudio(videoUrl))
    }

    const videos = await Promise.all(videoPromises)
    const audios = await Promise.all(audioPromises)
    console.log('Downloads completed.')

    // if videos and audios are not equal in length, something went wrong
    if (ytVideoUrls.length !== audios.length) {
        throw new Error('Mismatch in video and audio downloads.')
    }

    console.log('Processing with FFmpeg...')

    const processedVideos = []
    for (let i = 0; i < ytVideoUrls.length; i++) {
        const videoPath = videos[i].path
        const audioPath = audios[i].path
        const videoTitle = videos[i].title
        const processedVideo = await processWithFFmpeg(videoPath, audioPath, videoTitle)
        processedVideos.push(processedVideo)
    }

    console.log('Processing completed.')
    console.log('All done.')
}

let videoUrls = []

const playlistUrl = 'https://www.youtube.com/playlist?list=PLOUuFeCTxO5jVOsKtY3q2Otl33vXHyd-H'
ytpl(playlistUrl).then(playlist => {
    videoUrls = playlist.items.map(item => item.url)

    if (!playlistUrl && videoUrls.length === 0) {
        // If not using a playlist, you can manually add video URLs
        videoUrls = [
            'https://www.youtube.com/watch?v=nm28m4gEOkI',
            'https://www.youtube.com/watch?v=kx8yLdUJbqs',
            'https://www.youtube.com/watch?v=xwU_MpVXpM4'
        ]
    }

    console.log('Video URLs:', videoUrls)
    downloadAndProcessVideos(videoUrls).catch(console.error)
})
