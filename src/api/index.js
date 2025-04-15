const Koa = require("koa");
const Router = require("@koa/router");
const { koaBody } = require("koa-body");
const ytdl = require("@distube/ytdl-core");
const { randomUUID } = require("crypto");
const fs = require("fs");
const path = require("path");

// dependencies
const app = new Koa();
const router = new Router();

// state
const pending = [];
const seen = {};
const history = [];

// routes
router.put('/ffmeg/pending', async (ctx) => {
  ctx.body = { message: "ffmeg pending route" };
});

router.post("/youtube/pending", async (ctx) => {
  try {
    // validate the request body
    if (!ctx.request.body) {
      ctx.status = 400;
      ctx.body = { message: "Request body is required." };
      return;
    }
    // validate the task parameters
    const { videoId, itag } = ctx.request.body;
    if (!videoId || !itag) {
      ctx.status = 400;
      ctx.body = { message: "videoId and itag are required." };
      return;
    }
    const id = randomUUID();
    const timestamp = new Date().toISOString();
    const pendingTask = { id, videoId, itag, timestamp };
    console.log(`Adding ${videoId}.${itag} to the pending queue.`);
    pending.push(pendingTask);
    ctx.status = 201;
    ctx.body = {
      message: "Added to the pending queue.",
      id,
      videoId,
      itag,
      timestamp,
    };
  } catch (error) {
    console.error("Error while adding task to pending queue:", error);
    ctx.status = 500;
    ctx.body = { message: "Internal server error." };
  }
});

router.get("/pending", async (ctx) => {
  ctx.body = pending;
});

router.delete("/pending/:id", async (ctx) => {
  const { id } = ctx.params;
  const index = pending.findIndex((task) => task.id === id);
  if (index === -1) {
    ctx.status = 404;
    ctx.body = { message: "Task not found." };
    return;
  }
  pending.splice(index, 1);
  ctx.body = { message: "Task removed successfully." };
});

router.get("/seen", async (ctx) => {
  ctx.body = Object.keys(seen);
});

router.get("/history", async (ctx) => {
  ctx.body = history;
});

// body & cors
app.use(koaBody({ multipart: true }));
app.use(router.routes()).use(router.allowedMethods());

// app start
app.listen(3000, () => {
  console.log(`Server is running at http://localhost:3000`);
});

// process pending tasks
setInterval(async () => {
  if (pending.length > 0) {
    const task = pending.shift();
    const taskKey = `${task.videoId}-${task.itag}`; // Unique key for each task

    if (seen[taskKey]) {
      console.log(
        `Task for video ${task.videoId} with itag ${task.itag} is already being processed, skipping.`,
      );
      return;
    }
    if (
      history.some((t) => t.videoId === task.videoId && t.itag === task.itag)
    ) {
      console.log(
        `Task for video ${task.videoId} with itag ${task.itag} is already completed, skipping.`,
      );
      return;
    }
    seen[taskKey] = true;
    console.log(
      `Processing task: ${task.id} for video ${task.videoId} with itag ${task.itag}`,
    );

    const outputFileName = `${task.videoId}_${task.itag}.mp4`;
    const outputPath = path.join(__dirname, "../../downloads", outputFileName);

    try {
      // Fetch video info
      const info = await ytdl.getInfo(
        `https://www.youtube.com/watch?v=${task.videoId}`,
      );
      const format = ytdl.chooseFormat(info.formats, { quality: task.itag });

      if (!format) {
        throw new Error(`No format found for itag ${task.itag}`);
      }

      // Create a write stream to save the file
      const writeStream = fs.createWriteStream(outputPath);

      // Download the video stream
      ytdl
        .downloadFromInfo(info, { format })
        .pipe(writeStream)
        .on("finish", () => {
          console.log(`Task ${task.id} completed successfully.`);
          task.completedTimestamp = new Date().toISOString();
          history.push(task);
          delete seen[taskKey]; // Clear the specific task from `seen`
        })
        .on("error", (error) => {
          console.error(`Error processing task ${task.id}:`, error.message);
          task.error = error.message;
          task.failedTimestamp = new Date().toISOString();
          delete seen[taskKey]; // Clear the specific task from `seen`
        });
    } catch (error) {
      console.error(`Error processing task ${task.id}:`, error.message);
      task.error = error.message;
      task.failedTimestamp = new Date().toISOString();
      delete seen[taskKey]; // Clear the specific task from `seen`
    }
  }
});
