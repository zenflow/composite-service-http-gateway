# composite-service-http-gateway

Configurable http gateway service for use with [`composite-service`](https://github.com/zenflow/composite-service#readme)

[![npm version](https://img.shields.io/npm/v/composite-service-http-gateway)](http://npmjs.com/package/composite-service-http-gateway)
[![CI status](https://img.shields.io/github/workflow/status/zenflow/composite-service-http-gateway/CI?logo=GitHub&label=CI)](https://github.com/zenflow/composite-service-http-gateway/actions?query=branch%3Amaster)
[![dependencies status](https://img.shields.io/david/zenflow/composite-service-http-gateway)](https://david-dm.org/zenflow/composite-service-http-gateway)
[![Code Climate maintainability](https://img.shields.io/codeclimate/maintainability-percentage/zenflow/composite-service-http-gateway?logo=Code%20Climate)](https://codeclimate.com/github/zenflow/composite-service-http-gateway)
[![Known Vulnerabilities](https://snyk.io/test/github/zenflow/composite-service-http-gateway/badge.svg?targetFile=package.json)](https://snyk.io/test/github/zenflow/composite-service-http-gateway?targetFile=package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)

## Install

```
$ npm install composite-service composite-service-http-gateway
```

## Usage

Call `configureHttpGateway` with a [`HttpGatewayConfig`](./src/HttpGatewayConfig.ts) object
to get a `ServiceConfig` object you can use in your `CompositeServiceConfig`.

```js
const { startCompositeService } = require("composite-service");
const { configureHttpGateway } = require("composite-service-http-gateway");

const apiPort = process.env.API_PORT || 8000;
const webPort = process.env.API_PORT || 8001;
const port = process.env.PORT || 3000;

startCompositeService({
  services: {
    api: {
      cwd: `${__dirname}/api`,
      command: "node server.js",
      env: { PORT: apiPort },
      ready: ctx => ctx.onceTcpPortUsed(apiPort),
    },
    web: {
      cwd: `${__dirname}/web`,
      command: `next start --port ${webPort}`,
      ready: ctx => ctx.onceTcpPortUsed(webPort),
    },
    gateway: configureHttpGateway({
      dependencies: ["api", "web"],
      port,
      routes: {
        "/admin": { static: { root: `${__dirname}/admin/build` } },
        "/api": { proxy: { target: `http://localhost:${apiPort}` } },
        "/": { proxy: { target: `http://localhost:${webPort}` } },
      },
    }),
  },
});
```

The [`HttpGatewayConfig`](./src/HttpGatewayConfig.ts) object defines
a `port`, a `host` (optional), a collection of `routes`, and an `onReady` hook (optional).
Any additional properties will be included in the returned `ServiceConfig` (except `command` or `ready`).

### Routes

The central property of `HttpGatewayConfig` is `routes`.
In this object, each key is an absolute URL path,
and each value is configuration of how to handle requests to that path and all it's sub-paths.
*Note that the order of entries is significant because
requests will be handled by the *first* matching route,
hence putting the `/` route last in the example above.*

### Handlers

There are currently two "handlers", or ways requests can be handled:

| # | identifier | middleware | description
| --- | --- | --- | ---
| 1 | `proxy` | [`http-proxy-middleware`](https://github.com/chimurai/http-proxy-middleware#readme) | Proxy to another http service, typically a sibling composed service
| 2 | `static` | [`serve-static`](https://github.com/expressjs/serve-static#readme) | Serve static files from the filesystem

Handler config objects are mostly just passed along to the underlying middleware,
so *please refer to the above-linked middleware documentation for details on configuration options*.

That said, the following handler config defaults are updated for convenience:

| handler | config | original default | updated default | reason |
| --- | --- | --- | --- | ---
| `proxy` | `logLevel` | `"info"` | `"warn"` | reduce noise
| `proxy` | `ws` | `false` | `true` | support WebSocket connections out-of-the-box

### Using functions in handler configuration

Non-json-serializable values like functions and regular expressions can be used in handler configuration
thanks to [`serialize-javascript`](https://github.com/yahoo/serialize-javascript).
This however comes with caveats:
1. Functions must be pure (i.e. must not refer to variables outside it's definition)
2. `require()`s inside a function will be resolved from`node_modules/composite-service-http-gateway/server/server.js` (3 levels)
