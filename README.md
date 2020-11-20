# composite-service-http-gateway

Configurable http gateway service for use with [`composite-service`](https://github.com/zenflow/composite-service)

[![npm stats](https://nodei.co/npm/composite-service-http-gateway.png?compact=true)](http://npmjs.com/package/composite-service-http-gateway)

[![CI status](https://img.shields.io/github/workflow/status/zenflow/composite-service-http-gateway/CI?logo=GitHub&label=CI)](https://github.com/zenflow/composite-service-http-gateway/actions?query=branch%3Amaster)
[![dependencies status](https://img.shields.io/david/zenflow/composite-service-http-gateway)](https://david-dm.org/zenflow/composite-service-http-gateway)
[![Code Climate maintainability](https://img.shields.io/codeclimate/maintainability-percentage/zenflow/composite-service-http-gateway?logo=Code%20Climate)](https://codeclimate.com/github/zenflow/composite-service-http-gateway)
[![Known Vulnerabilities](https://snyk.io/test/github/zenflow/composite-service-http-gateway/badge.svg?targetFile=package.json)](https://snyk.io/test/github/zenflow/composite-service-http-gateway?targetFile=package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)

## Installation

```
$ npm install composite-service composite-service-http-gateway
```

## Usage

Call `configureHttpGateway` to get a `ServiceConfig` object (for your gateway service)
which you can use in your `CompositeServiceConfig`.

The `configureHttpGateway` function takes a `HttpGatewayConfig` object as it's only argument.

```js
const { startCompositeService } = require("composite-service");
const { configureHttpGateway } = require("composite-service-http-gateway");

startCompositeService({
  services: {
    api: {
      cwd: `${__dirname}/api`,
      command: "node server.js",
      env: { PORT: "3001" },
    },
    web: {
      cwd: `${__dirname}/web`,
      command: "next start --port 3002"
    },
    gateway: configureHttpGateway({
      port: process.env.PORT || 3000,
      routes: {
        "/admin": { static: { root: `${__dirname}/admin/build` } },
        "/api": { proxy: { target: "http://localhost:3001" } },
        "/": { proxy: { target: "http://localhost:3002" } },
      },
    }),
  },
});
```

Complete documentation for `HttpGatewayConfig` properties can be found in
[`HttpGatewayConfig.js`](https://github.com/zenflow/composite-service-http-gateway/blob/master/src/HttpGatewayConfig.ts).

### Routes & Handlers

The central property of `HttpGatewayConfig` is `routes`.
In this object, each key is an absolute URL path,
and each value is configuration of how to handle requests to that path and all it's sub-paths.
*Note that the order of entries is significant because
requests will be handled by the *first* matching route,
hence putting the `/` route last in the example above.*

There are currently two "handlers" (ways requests can be handled):

| # | identifier | middleware | description
| --- | --- | --- | ---
| 1 | `proxy` | [`http-proxy-middleware`](https://github.com/chimurai/http-proxy-middleware) | Proxy to another http service, typically a sibling composed service
| 2 | `static` | [`serve-static`](https://github.com/expressjs/serve-static) | Serve static files from the filesystem

Handler config objects are mostly just passed along to the underlying middleware,
so *please refer to the linked middleware documentation for details on configuration options*.

The following configuration defaults are changed:
  - For `proxy`: `{ ws: true, logLevel: "warn" }`

Non-json-serializable values like functions and regular expressions can be used in handler configuration
thanks to [`serialize-javascript`](https://github.com/yahoo/serialize-javascript).
This however comes with caveats:
1. Functions must be pure (i.e. must not refer to variables outside it's definition)
2. In functions, when `require`ing a module, the path the module will be resolved from is unfixed
(but still within the root of the project).
See issue [#1](https://github.com/zenflow/composite-service-http-gateway/issues/1).
