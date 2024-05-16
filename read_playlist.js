const ytpl = require("ytpl")

/**
 * Fetches short URLs for each video in given YouTube playlist and logs them to the console.
 * @param {string} playlistUrl - The URL of the targeted YouTube playlist.
 */
async function fetchPlaylistShortURLs(playlistUrl) {
    try {
        // Parse the specified playlist into an object structure with videos as properties
        const parsedPlaylist = await ytpl(playlistUrl);

        // Extract only the shortened URLs, ignoring other metadata about individual videos
        const urlsArray = parsedPlaylist.items.map(video => video.shortUrl);

        // Log all extracted short URLs to the console
        console.log(urlsArray);
    } catch (error) {
        // Handle any errors that may occur during parsing or processing
        console.error(`An error occurred while fetching playlist data: ${error}`);
    }
}

fetchPlaylistShortURLs('https://www.youtube.com/playlist?list=PLRWvNQVqAeWIcz0Ky6pnrKkqsp3MA7o_n');
