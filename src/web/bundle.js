const url = 'http://localhost:3000/youtube';

const parseVideoId = (url) => {
    const videoId = url.split('v=')[1];
    return videoId;
}

const listFormats = () => {
    const videoId = parseVideoId($('#url').val());
    $.get(`${url}/${videoId}/formats`, (data) => {
        console.log(data);
    });
}

$(document).ready(() => {
    console.log('Hello from bundle.js');

});
