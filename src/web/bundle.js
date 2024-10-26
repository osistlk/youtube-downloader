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

const handleSuccess = (data) => {
  let { audioFormats, videoFormats } = parseFormatsResponse(data);
  audioFormats = audioFormats.filter(format => format.audioBitrate > 48);
  videoFormats = videoFormats.filter(format => {
    const quality = parseInt(format.qualityLabel.slice(0, -1));
    return quality > 480;
  });
  $("#audioFormats").empty();
  $("#videoFormats").empty();
  // Create table headers
  $("#audioFormats").append(`
        <tr>
        <th>Itag</th>
        <th>Container</th>
        <th>Audio Bitrate (Mbps)</th>
        <th>Average Bitrate (Mbps)</th>
        <th>Audio Sample Rate</th>
        <th>Audio Codec</th>
        <th>Size</th>
        </tr>
    `);
  $("#videoFormats").append(`
        <tr>
        <th>Itag</th>
        <th>Container</th>
        <th>Bitrate (Mbps)</th>
        <th>Average Bitrate (Mbps)</th>
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
    const averageBitrate = format.averageBitrate ? (format.averageBitrate / 1024).toFixed(2) : "";
    const audioBitrate = format.bitrate ? (format.bitrate / 1024).toFixed(2) : "";
    $("#audioFormats").append(`
        <tr>
        <td>${format.itag || ""}</td>
        <td>${format.container || ""}</td>
        <td>${audioBitrate}</td>
        <td>${averageBitrate}</td>
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
    const averageBitrate = format.averageBitrate ? (format.averageBitrate / (1024 * 1024)).toFixed(2) : "";
    const bitrate = format.bitrate ? (format.bitrate / (1024 * 1024)).toFixed(2) : "";
    $("#videoFormats").append(`
        <tr>
        <td>${format.itag || ""}</td>
        <td>${format.container || ""}</td>
        <td>${bitrate}</td>
        <td>${averageBitrate}</td>
        <td>${format.videoCodec || ""}</td>
        <td>${format.qualityLabel || ""}</td>
        <td>${format.fps || ""}</td>
        <td>${contentLengthMB} MB</td>
        </tr>
        `);
  });
};

const listFormats = () => {
  const videoId = parseVideoId($("#url").val());
  $.ajax({
    url: `${url}/${videoId}/formats`,
    method: "GET",
    success: handleSuccess
  });

};

$(document).ready(() => {
  console.log("(✿◠‿◠)");
});
