const { downloadVideo, downloadAudio, processWithFFmpeg } = require("./download_yt")
const { fetchPlaylistShortURLs } = require("./read_playlist")

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

async function main() {
    const playlistUrl = 'https://www.youtube.com/playlist?list=PLRWvNQVqAeWLPYrIW3bUWik62khdhk2Ro'
    const videoUrls = await fetchPlaylistShortURLs(playlistUrl)

    console.log('Video URLs:', videoUrls)
    await downloadAndProcessVideos(videoUrls)
}

main()
