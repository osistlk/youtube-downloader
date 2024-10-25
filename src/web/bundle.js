const url = "http://localhost:3000/youtube";

const parseVideoId = (url) => {
  const videoId = url.split("v=")[1];
  return videoId;
};

parseFormatsResponse = (data) => {
  const audioFormats = data.audioFormats;
  const videoFormats = data.videoFormats;
  return { audioFormats, videoFormats };
};

const listFormats = () => {
  const videoId = parseVideoId($("#url").val());
  $.get(`${url}/${videoId}/formats`, (data) => {
    const { audioFormats, videoFormats } = parseFormatsResponse(data);
    console.log("Audio Formats:", audioFormats);
    console.log("Video Formats:", videoFormats);
    $("#audioFormats").empty();
    $("#videoFormats").empty();
    // Create table headers
    $("#audioFormats").append(`
            <tr>
            <th>Itag</th>
            <th>Container</th>
            <th>Audio Bitrate</th>
            <th>Audio Sample Rate</th>
            <th>Audio Codec</th>
            <th>Size</th>
            </tr>
        `);
    $("#videoFormats").append(`
            <tr>
            <th>Itag</th>
            <th>Container</th>
            <th>Bitrate</th>
            <th>Video Codec</th>
            <th>Quality</th>
            <th>FPS</th>
            <th>Size</th>
            </tr>
        `);

    // Append audio formats to the table
    audioFormats.forEach((format) => {
      const contentLengthMB = isNaN(format.contentLength)
        ? ""
        : (format.contentLength / (1024 * 1024)).toFixed(2);
      $("#audioFormats").append(`
            <tr>
            <td>${format.itag || ""}</td>
            <td>${format.container || ""}</td>
            <td>${format.audioBitrate || ""}</td>
            <td>${format.audioSampleRate || ""}</td>
            <td>${format.audioCodec || ""}</td>
            <td>${contentLengthMB} MB</td>
            </tr>
            `);
    });

    // Append video formats to the table
    videoFormats.forEach((format) => {
      const contentLengthMB = isNaN(format.contentLength)
        ? ""
        : (format.contentLength / (1024 * 1024)).toFixed(2);
      $("#videoFormats").append(`
            <tr>
            <td>${format.itag || ""}</td>
            <td>${format.container || ""}</td>
            <td>${format.bitrate || ""}</td>
            <td>${format.videoCodec || ""}</td>
            <td>${format.qualityLabel || ""}</td>
            <td>${format.fps || ""}</td>
            <td>${contentLengthMB} MB</td>
            </tr>
            `);
    });
  });
};

$(document).ready(() => {
  console.log("Hello from bundle.js");
});
