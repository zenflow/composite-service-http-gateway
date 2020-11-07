import { join } from "path";
import serializeJavascript from "serialize-javascript";
import { ServiceConfig, onceOutputLineIncludes } from "composite-service";
import { HttpGatewayConfig } from "./HttpGatewayConfig";

export function configureHttpGateway(config: HttpGatewayConfig): ServiceConfig {
  // TODO: validate & normalize route paths  (and config in general)
  // TODO: default host should be 0.0.0.0?
  const { dependencies, port, host = "localhost", routes } = config;
  return {
    dependencies,
    command: ["node", join(__dirname, "..", "server.js")],
    env: {
      PORT: String(port),
      HOST: host,
      ROUTES: serializeJavascript(routes, { unsafe: true }),
      NODE_ENV: "production",
    },
    ready: (ctx) => onceOutputLineIncludes(ctx.output, "Started @ "),
  };
}
