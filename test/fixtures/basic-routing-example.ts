import { promisify } from "util";
import { startCompositeService } from "composite-service";
import { configureHttpGateway } from "../../src";

const [port, otherPort] = [3000, 3001];

const delay = promisify(setTimeout);

startCompositeService({
  logLevel: "debug",
  services: {
    other: {
      command: ["node", `${__dirname}/other-service.js`],
      env: { PORT: otherPort },
      ready: (ctx) => ctx.onceTcpPortUsed(otherPort),
    },
    gateway: configureHttpGateway({
      dependencies: ["other"],
      port,
      onReady: async () => {
        console.log("onReady start");
        await delay(250);
        console.log("onReady end");
      },
      routes: {
        "/foo/bar": { proxy: { target: { port: otherPort, host: "localhost" } } },
        "/foo": { static: { root: `${__dirname}/static`, index: ["index.txt"] } },
        // this next route can't be reached, since it's path is inside the "/foo" path above
        "/foo/baz": { proxy: { target: { port: otherPort, host: "localhost" } } },
        // this next route *can* be reached, since it's *not* inside the "/foo" path above (or any other)
        "/foobaz": {
          proxy: {
            target: { port: otherPort, host: "localhost" },
            pathRewrite: { "^/foobaz": "" },
          },
        },
        "/": { static: { root: `${__dirname}/static`, index: ["index.txt"] } },
      },
    }),
  },
});
