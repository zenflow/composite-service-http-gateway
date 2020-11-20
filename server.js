const { createServer } = require("http");
const connect = require("connect");
const { createProxyMiddleware } = require("http-proxy-middleware");
const serveStatic = require("serve-static");
const finalhandler = require("finalhandler");

function createApp(routes) {
  const app = connect();
  for (const [routePath, routeConfig] of Object.entries(routes)) {
    const [[handlerId, handlerConfig]] = Object.entries(routeConfig);
    register[handlerId](app, routePath, handlerConfig);
  }
  app.use((req, res) => finalhandler(req, res)());
  return app;
}

const register = {
  proxy(app, path, config) {
    const proxyMiddleware = createProxyMiddleware({ ws: true, logLevel: "warn", ...config });
    registerPathHandler(app, path, (req, res) => {
      proxyMiddleware(req, res, finalhandler(req, res));
    });
  },
  static(app, path, { root, ...config }) {
    const staticMiddleware = serveStatic(root, config);
    registerPathHandler(app, path, (req, res) => {
      req.originalUrl = req.url;
      req.url = urlRemoveBasePath(req.url, path);
      staticMiddleware(req, res, finalhandler(req, res));
    });
  },
};

function registerPathHandler(app, path, middleware) {
  app.use((req, res, next) => {
    if (!isUrlInBasePath(req.url, path)) {
      return next();
    }
    middleware(req, res);
  });
}

function isUrlInBasePath(url, basePath) {
  if (basePath === "/") return true;
  if (!url.startsWith(basePath)) return false;
  const nextChar = url[basePath.length];
  return !nextChar || nextChar === "/" || nextChar === "?";
}

function urlRemoveBasePath(url, basePath) {
  if (basePath === "/") return url;
  const sliced = url.slice(basePath.length);
  return sliced[0] === "/" ? sliced : `/${sliced}`;
}

// ---

const port = Number(process.env.PORT);
const host = process.env.HOST;
const routes = eval(`(${process.env.ROUTES})`);

const app = createApp(routes);
const server = createServer(app);
server.listen(port, host, () => {
  console.log(`Started @ http://${host}:${port}/`);
});
