const fs = require('fs')
const ytpl = require('ytpl')
const ytdl = require('@distube/ytdl-core')

const playlistUrl = 'https://www.youtube.com/playlist?list=PLRWvNQVqAeWIcz0Ky6pnrKkqsp3MA7o_n'
const videoUrls = ytpl(playlistUrl).then(playlist => {
    return playlist.items.map(item => item.url)
})

console.log('Video URLs:', videoUrls)

videoUrls.slice(0, 1).forEach(videoUrl => {
    ytdl(videoUrl).pipe(fs.createWriteStream(`./output/${videoUrl}.mp4`))
})
