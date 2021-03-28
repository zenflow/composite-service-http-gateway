import { join } from "path";
import serializeJavascript from "serialize-javascript";
import { ServiceConfig } from "composite-service";
import { HttpGatewayConfig } from "./HttpGatewayConfig";
import { validateAndNormalizeConfig } from "./validateAndNormalizeConfig";

export function configureHttpGateway(config: HttpGatewayConfig): ServiceConfig {
  const { port, host, routes, onReady, ...rest } = validateAndNormalizeConfig(config);
  return {
    ...rest,
    command: ["node", join(__dirname, "..", "server", "server.js")],
    env: {
      NODE_ENV: "production",
      ...rest.env,
      PORT: String(port),
      HOST: host,
      GATEWAY_ROUTES: serializeJavascript(routes, { unsafe: true }),
    },
    ready: async (ctx) => {
      await ctx.onceOutputLine((line) => line.startsWith("Started @ "));
      await onReady();
    },
  };
}
