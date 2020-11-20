import { join } from "path";
import serializeJavascript from "serialize-javascript";
import { ServiceConfig, onceOutputLineIncludes } from "composite-service";
import { HttpGatewayConfig } from "./HttpGatewayConfig";
import { validateAndNormalizeConfig } from "./validateAndNormalizeConfig";

export function configureHttpGateway(config: HttpGatewayConfig): ServiceConfig {
  const { dependencies, port, host, routes } = validateAndNormalizeConfig(config);
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
