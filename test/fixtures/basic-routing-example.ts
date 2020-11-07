import { join } from "path";
import { startCompositeService, onceTcpPortUsed } from "composite-service";
import { configureHttpGateway } from "../../src";

const [port, otherPort] = [3000, 3001];

startCompositeService({
  logLevel: "debug",
  services: {
    other: {
      command: ["node", join(__dirname, "other-service.js")],
      env: { PORT: otherPort },
      ready: () => onceTcpPortUsed(otherPort),
    },
    gateway: configureHttpGateway({
      dependencies: ["other"],
      port,
      routes: {
        "/foo/bar": { proxy: { target: { port: otherPort, host: "localhost" } } },
        "/foo": { static: { dir: join(__dirname, "static"), index: ["index.txt"] } },
        // this next route can't be reached, since it's path is inside the "/foo" path above
        "/foo/baz": { proxy: { target: { port: otherPort, host: "localhost" } } },
        // this next route *can* be reached, since it's *not* inside the "/foo" path above (or any other)
        "/foobaz": {
          proxy: {
            target: { port: otherPort, host: "localhost" },
            pathRewrite: { "^/foobaz": "" },
          },
        },
        "/": { static: { dir: join(__dirname, "static"), index: ["index.txt"] } },
      },
    }),
  },
});
