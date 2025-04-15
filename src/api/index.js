const Koa = require("koa");
const Router = require("@koa/router");
const { randomUUID } = require("crypto");

// constants
const PENDING_QUEUE_INTERVAL = 500;
const PORT = 3000;
const MAX_PENDING = 3;
const MAX_RETRIES = 3;

const app = new Koa();
const router = new Router();

// state
const pending = [];
const seen = {};
const history = [];

// routes
router.get("/youtube/:videoId/pending/:itag", async (ctx) => {
  const { videoId, itag } = ctx.params;
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

router.get("/history", async (ctx) => {
  ctx.body = history;
});

// cors
app.use(router.routes()).use(router.allowedMethods());

// app start
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// process pending tasks
setInterval(() => {
  if (pending.length > 0) {
    const task = pending.shift();
    if (seen[task.videoId]) {
      console.log(
        `Task for video ${task.videoId} is already being processed. Skipping.`,
      );
      return;
    }
    seen[task.videoId] = true;
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
      delete seen[task.videoId];
    }, processingTime);
  }
}, PENDING_QUEUE_INTERVAL);
