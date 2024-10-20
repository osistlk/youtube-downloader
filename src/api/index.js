const Koa = require('koa');
const Router = require('@koa/router');

const app = new Koa();
const router = new Router();

router.get('/video/:id/formats', (ctx) => {
    const videoId = ctx.params.id;
    ctx.body = { videoFormats: [], videoId: videoId };
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});
