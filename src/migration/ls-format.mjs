import { Innertube } from "youtubei.js";
import { writeFile } from "fs/promises";

const videoId = "x3NpZxqLoHQ"; // Example video ID
const cookie =
  "VISITOR_INFO1_LIVE=eiSacQ5S4hI; VISITOR_PRIVACY_METADATA=CgJVUxIEGgAgHw%3D%3D; PREF=tz=America.New_York&f4=4000000&f6=40000000&f5=30000&f7=100; __Secure-1PSIDTS=sidts-CjEBmkD5S9jPh3NxsJk7EwU94To9Ae20_BPfqcsgBzYZJbIHWWfnusUItDveSRPdsA7HEAA; __Secure-3PSIDTS=sidts-CjEBmkD5S9jPh3NxsJk7EwU94To9Ae20_BPfqcsgBzYZJbIHWWfnusUItDveSRPdsA7HEAA; HSID=AvVKetb6bwSUnSwo7; SSID=ALZYW0hyVgCtFI30-; APISID=CpJcox08eWUAvx3Y/AjoPS6_nNHqfwlTzn; SAPISID=i-uYk0QaLrwpB9rh/AlQFsOt2ZbPVt1jQI; __Secure-1PAPISID=i-uYk0QaLrwpB9rh/AlQFsOt2ZbPVt1jQI; __Secure-3PAPISID=i-uYk0QaLrwpB9rh/AlQFsOt2ZbPVt1jQI; SID=g.a0001ggkJQHyO9CNF1Z7u1FOXvya2ltcTZBasX-EIPtXqGnnmf-7gGgupjQ8UYWMI0RSka0pvwACgYKAUkSARcSFQHGX2MipJiYHgSeVFJlyj_kbdTfZRoVAUF8yKqqPic_gXd9yIihM2lHH4oO0076; __Secure-1PSID=g.a0001ggkJQHyO9CNF1Z7u1FOXvya2ltcTZBasX-EIPtXqGnnmf-7oGQ4xAzWaYKOJl1Z_H5TtgACgYKARYSARcSFQHGX2MiShN5V17KJqBILihNlyfkGBoVAUF8yKp_dHhdpRXvwjtMb7geHSRt0076; __Secure-3PSID=g.a0001ggkJQHyO9CNF1Z7u1FOXvya2ltcTZBasX-EIPtXqGnnmf-7dOFfLW3hqoBDAb0UaJfWmAACgYKAe4SARcSFQHGX2MiXbwBp9SooZgFpxwe0j7SZBoVAUF8yKpCDK7zZjJ6pSJCbrG65dI20076; LOGIN_INFO=AFmmF2swRQIgRaa_SDOmaOxKC1bvUDPKZlt5T05jsbUzEwXxHyHZIyYCIQC93U8_DkCLCkfPoAMVxP3ErcRTULRVABkzx1niHhwEwQ:QUQ3MjNmd2VvalVUSGZ1c1lJZnlGV05nQWVueVNRMGJlNmJGTXctaGVYaU1oc3EyWHJtelZPZ2VyZGRUQWN2UVduRG5pOTVGZk1VYVR5bHdFYzdSblhLbkY1Z1BRd0dkdXJqb3Brb2w5WlZEZWNYSkRUWmpnV2hVdUt6eGRmZTVDdmhWZFBCYUx5aGRmc3JCQTNTd3UwbTJVc2E2bVE3Z2dR; SIDCC=AKEyXzU7dS_aasJ2tDHkN4hyW0UMmz0-_GsDD9tIljD2E8QY-rjze_n6mgAPNCiOXswH5MWb6kc; __Secure-1PSIDCC=AKEyXzUG_LFCWAPzZfBcSUhwSlZpH0auASOCa1-52bHqWsgkTQthK-oq1gl2IAFPrdI6OKCbVQ; __Secure-3PSIDCC=AKEyXzVfARGnjt8rfpSLthVe4xyvy861f0M6uuwuToq_JVGAHFgOhj9fdGPFOLVYgoHR6tuOl1U; __Secure-ROLLOUT_TOKEN=CNebyJKkzr6LygEQ4_fav7S0igMYo8O48ZarkAM%3D; YSC=Xig1SE98WOI";

const innertube = await Innertube.create({ cookie });
const videoInfo = await innertube.getInfo(videoId, { client: "TV" });

try {
  const outPath = `./${videoId}.json`;
  await writeFile(outPath, JSON.stringify(videoInfo, null, 2), "utf8");
  console.log(`Wrote video info to ${outPath}`);
} catch (err) {
  console.error("Failed to write video info:", err);
}
