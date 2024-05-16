const ytpl = require("ytpl")

async function main() {
    const playlistUrl = 'https://www.youtube.com/playlist?list=PLRWvNQVqAeWIcz0Ky6pnrKkqsp3MA7o_n'
    const playlist = await ytpl(playlistUrl)
    const items = playlist.items.map(item => item.shortUrl)
    console.log(items)
}

main()
