const url = 'http://localhost:3000/youtube';

const parseVideoId = (url) => {
    const videoId = url.split('v=')[1];
    return videoId;
}

parseFormatsResponse = (data) => {
    const audioFormats = data.audioFormats;
    const videoFormats = data.videoFormats;
    return { audioFormats, videoFormats };
}

const listFormats = () => {
    const videoId = parseVideoId($('#url').val());
    $.get(`${url}/${videoId}/formats`, (data) => {
        const { audioFormats, videoFormats } = parseFormatsResponse(data);
        console.log('Audio Formats:', audioFormats);
        console.log('Video Formats:', videoFormats);
        $('#audioFormats').empty();
        $('#videoFormats').empty();
        audioFormats.forEach((format) => {
            $('#audioFormats').append(`<li>${format.audioBitrate}</li>`);
        });
        videoFormats.forEach((format) => {
            $('#videoFormats').append(`<li>${format.qualityLabel}</li>`);
        });
    });
}

$(document).ready(() => {
    console.log('Hello from bundle.js');

});
