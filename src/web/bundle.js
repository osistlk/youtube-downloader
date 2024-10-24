// simple jQuery app

updateApp = () => {
    $.get("http://localhost:3000/youtube/t9atoY_vkQc/formats", (data) => {
        $("#app").html('hello world');
    });
}

$(document).ready(() => {
    updateApp();
    setInterval(updateApp, 360000);
});
