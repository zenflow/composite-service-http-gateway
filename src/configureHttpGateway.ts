import { join } from "path";
import serializeJavascript from "serialize-javascript";
import { ServiceConfig, onceOutputLineIncludes } from "composite-service";
import { HttpGatewayConfig } from "./HttpGatewayConfig";
import { validateAndNormalizeConfig } from "./validateAndNormalizeConfig";

export function configureHttpGateway(config: HttpGatewayConfig): ServiceConfig {
  const { port, host, routes, ...rest } = validateAndNormalizeConfig(config);
  return {
    ...rest,
    command: ["node", join(__dirname, "..", "server.js")],
    env: {
      NODE_ENV: "production",
      ...rest.env,
      PORT: String(port),
      HOST: host,
      ROUTES: serializeJavascript(routes, { unsafe: true }),
    },
    ready: (ctx) => onceOutputLineIncludes(ctx.output, "Started @ "),
  };
}
