const Koa = require("koa");
const Router = require("@koa/router");
const { randomUUID } = require("crypto");
const { koaBody } = require("koa-body");

// constants
const PENDING_QUEUE_INTERVAL = 500;
const PORT = 3000;
const MAX_PENDING = 3;
const MAX_RETRIES = 3;

// dependencies
const app = new Koa();
const router = new Router();

// state
const pending = [];
const seen = {};
const history = [];

// routes
router.post("/youtube/pending", async (ctx) => {
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
  const retries = MAX_RETRIES;
  const pendingTask = { id, videoId, itag, timestamp, retries };
  if (pending.length >= MAX_PENDING) {
    console.log(
      `Pending queue is full. Cannot add task for video ${videoId} with itag ${itag}.`,
    );
    ctx.status = 503;
    ctx.body = {
      message: "Pending queue is full. Please try again later.",
      maxPending: MAX_PENDING,
    };
    return;
  }
  console.log(`Adding ${videoId}.${itag} to the pending queue.`);
  pending.push(pendingTask);
  ctx.status = 201;
  ctx.body = {
    message: "Added to the pending queue.",
    id,
    videoId,
    itag,
    timestamp,
    retries,
  };
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
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// process pending tasks
setInterval(() => {
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
    // simulate task processing
    const processingTime =
      Math.floor(Math.random() * (15000 - 1000 + 1)) + 1000;
    setTimeout(() => {
      console.log(`Task ${task.id} processed in ${processingTime}ms.`);
      task.completedTimestamp = new Date().toISOString();
      history.push(task);
      delete seen[taskKey]; // Clear the specific task from `seen`
    }, processingTime);
  }
}, PENDING_QUEUE_INTERVAL);
