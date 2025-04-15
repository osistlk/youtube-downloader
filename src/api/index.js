const Koa = require("koa");
const Router = require("@koa/router");
const { randomUUID } = require("crypto");

// constants
const PORT = 3000;
const MAX_RETRIES = 3;
const MAX_PENDING = 3;
const PENDING_QUEUE_INTERVAL = 1000;

const app = new Koa();
const router = new Router();

// state
const pending = [];

// routes
router.get("/youtube/:videoId/pending/:itag", async (ctx) => {
  const { videoId, itag } = ctx.params;
  console.log(`Adding ${videoId}.${itag} to the pending queue.`);
  const id = randomUUID();
  const timestamp = new Date().toISOString();
  const retries = MAX_RETRIES;
  const pendingTask = { id, videoId, itag, timestamp, retries };
  if (pending.length >= MAX_PENDING) {
    ctx.status = 503;
    ctx.body = {
      message: "Pending queue is full. Please try again later.",
      maxPending: MAX_PENDING,
    };
    return;
  }
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
    console.log(
      `Processing task: ${task.id} for video ${task.videoId} with itag ${task.itag}`,
    );
    // simulate task processing
    setTimeout(() => {
      console.log(`Task ${task.id} completed.`);
    }, 2000);
  }
}, PENDING_QUEUE_INTERVAL);
