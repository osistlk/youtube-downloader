(async () => {
  const fs = require("fs");
  const ytdl = require("@distube/ytdl-core");
  const sanitize = require("sanitize-filename");

  // read youtube url from parameter
  const url = process.argv[2];
  // if url is not provided, exit
  if (!url) {
    console.error("Please provide a URL.");
    process.exit(1);
  }

  // read audio itag from parameter
  const itag = process.argv[3];
  // if itag is not provided, exit
  if (!itag) {
    console.error("Please provide an itag.");
    process.exit(1);
  }

  const rawCookies = {
    "Request Cookies": {
      "__Secure-1PAPISID": "i-uYk0QaLrwpB9rh/AlQFsOt2ZbPVt1jQI",
      "__Secure-1PSID":
        "g.a0001ggkJQHyO9CNF1Z7u1FOXvya2ltcTZBasX-EIPtXqGnnmf-7oGQ4xAzWaYKOJl1Z_H5TtgACgYKARYSARcSFQHGX2MiShN5V17KJqBILihNlyfkGBoVAUF8yKp_dHhdpRXvwjtMb7geHSRt0076",
      "__Secure-1PSIDCC":
        "AKEyXzXlsryTUy5uPdOZbFxG7SvETPzIRqd6hQ6CKrCIoS9yO4Q3e_wL1HpNc2bjLbX1coIz-g",
      "__Secure-1PSIDTS":
        "sidts-CjEBmkD5Sxz8B_iV2nj3mtpIa-HuVbEA_87A14JtvAKZde7w63e9BkgFjZEjTocBQRo2EAA",
      "__Secure-3PAPISID": "i-uYk0QaLrwpB9rh/AlQFsOt2ZbPVt1jQI",
      "__Secure-3PSID":
        "g.a0001ggkJQHyO9CNF1Z7u1FOXvya2ltcTZBasX-EIPtXqGnnmf-7dOFfLW3hqoBDAb0UaJfWmAACgYKAe4SARcSFQHGX2MiXbwBp9SooZgFpxwe0j7SZBoVAUF8yKpCDK7zZjJ6pSJCbrG65dI20076",
      "__Secure-3PSIDCC":
        "AKEyXzVMVB9J6CuebsYgaL_W4u3t1HMffteupazdJrn8-Lo7Kulqo63x1TgPASgmrXV48-apN7M",
      "__Secure-3PSIDTS":
        "sidts-CjEBmkD5Sxz8B_iV2nj3mtpIa-HuVbEA_87A14JtvAKZde7w63e9BkgFjZEjTocBQRo2EAA",
      "__Secure-ROLLOUT_TOKEN": "CNebyJKkzr6LygEQ4_fav7S0igMYo8O48ZarkAM=",
      APISID: "CpJcox08eWUAvx3Y/AjoPS6_nNHqfwlTzn",
      HSID: "AvVKetb6bwSUnSwo7",
      LOGIN_INFO:
        "AFmmF2swRQIgRaa_SDOmaOxKC1bvUDPKZlt5T05jsbUzEwXxHyHZIyYCIQC93U8_DkCLCkfPoAMVxP3ErcRTULRVABkzx1niHhwEwQ:QUQ3MjNmd2VvalVUSGZ1c1lJZnlGV05nQWVueVNRMGJlNmJGTXctaGVYaU1oc3EyWHJtelZPZ2VyZGRUQWN2UVduRG5pOTVGZk1VYVR5bHdFYzdSblhLbkY1Z1BRd0dkdXJqb3Brb2w5WlZEZWNYSkRUWmpnV2hVdUt6eGRmZTVDdmhWZFBCYUx5aGRmc3JCQTNTd3UwbTJVc2E2bVE3Z2dR",
      PREF: "tz=America.New_York&f4=4000000&f6=40000000&f5=30000&f7=100",
      SAPISID: "i-uYk0QaLrwpB9rh/AlQFsOt2ZbPVt1jQI",
      SID: "g.a0001ggkJQHyO9CNF1Z7u1FOXvya2ltcTZBasX-EIPtXqGnnmf-7gGgupjQ8UYWMI0RSka0pvwACgYKAUkSARcSFQHGX2MipJiYHgSeVFJlyj_kbdTfZRoVAUF8yKqqPic_gXd9yIihM2lHH4oO0076",
      SIDCC:
        "AKEyXzVAgDUjTi05cYzX0hTjJiOEinORpFxbK35aKOdE7goOImqqnGmtLD2hSk6fBqFLR_56q4Q",
      SSID: "ALZYW0hyVgCtFI30-",
      VISITOR_INFO1_LIVE: "eiSacQ5S4hI",
      VISITOR_PRIVACY_METADATA: "CgJVUxIEGgAgHw==",
      YSC: "Xig1SE98WOI",
    },
  };
  const cookies = Object.entries(rawCookies["Request Cookies"]).map(
    ([name, value]) => ({
      name,
      value,
    }),
  );
  const agent = ytdl.createAgent(cookies);

  // download audio based on itag
  const id = ytdl.getURLVideoID(url, { agent });
  const info = await ytdl.getInfo(id, { agent });
  const format = info.formats.find(
    (format) =>
      format.itag == itag &&
      format.mimeType.includes("audio") &&
      (!format.audioTrack ||
        (format.audioTrack.displayName &&
          (format.audioTrack.displayName.toLowerCase().includes("english") ||
            format.audioTrack.displayName.toLowerCase().includes("original")))),
  );
  if (!format) {
    console.error("No audio format found for the provided itag.");
    process.exit(1);
  }
  const title = info.videoDetails.title;
  const sanitizedTitle = sanitize(title);
  const filename = `${sanitizedTitle}.audio.${format.container}`;
  const output = `./${filename}`;

  console.log(`Downloading audio from ${title}...`);
  const stream = ytdl.downloadFromInfo(info, {
    format,
    agent,
  });

  let downloaded = 0;
  const total = format.contentLength;

  stream.on("progress", (chunkLength, downloadedBytes, totalBytes) => {
    downloaded += chunkLength;
    const percent = ((downloaded / total) * 100).toFixed(2);
    process.stdout.write(`Downloading: ${percent}%\r`);
  });
  stream.pipe(fs.createWriteStream(output));

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
  console.log(`Downloaded to ${output}`);
})();
