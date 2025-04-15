const Koa = require("koa");
const Router = require("@koa/router");
const { randomUUID } = require("crypto");

// constants
const PORT = 3000;
const MAX_RETRIES = 3;

const app = new Koa();
const router = new Router();

// state
const pending = new Set();

// routes
router.get("/youtube/:videoId/pending/:itag", async (ctx) => {
  const { videoId, itag } = ctx.params;
  console.log(`Adding ${videoId}.${itag} to the pending queue.`);
  const id = randomUUID();
  const timestamp = new Date().toISOString();
  const retries = MAX_RETRIES;
  pending[id] = { videoId, itag, timestamp, retries };
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
