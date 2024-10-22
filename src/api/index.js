const Koa = require("koa");
const Router = require("@koa/router");
const EventEmitter = require("events");
const { setupRoutes } = require("./routes");
const { setupEventListeners } = require("./events");

const app = new Koa();
const router = new Router();
const eventEmitter = new EventEmitter();

setupRoutes(router, eventEmitter);
setupEventListeners(eventEmitter);

app.use(router.routes()).use(router.allowedMethods());

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
