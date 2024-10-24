const Koa = require("koa");
const Router = require("@koa/router");

const { setupRoutes } = require("./routes");
const { setupEventListeners } = require("./events");

const app = new Koa();
const router = new Router();

setupRoutes(router);
setupEventListeners();

app.use(router.routes()).use(router.allowedMethods());

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
