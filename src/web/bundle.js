// simple jQuery app

updateApp = () => {
    $.get("http://localhost:3000/youtube/t9atoY_vkQc/formats", (data) => {
        $("#app").html(data);
    });
}

$(document).ready(() => {
    updateApp();
    setInterval(updateApp, 360000);
});
