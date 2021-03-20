import {
  HttpGatewayConfig,
  HttpGatewayRouteConfig,
  HttpGatewayProxyHandlerConfig,
  HttpGatewayStaticHandlerConfig,
} from "./HttpGatewayConfig";

export interface NormalizedHttpGatewayConfig extends HttpGatewayConfig {
  port: number;
  host: string;
  routes: { [path: string]: HttpGatewayRouteConfig };
}

export function validateAndNormalizeConfig(input: HttpGatewayConfig): NormalizedHttpGatewayConfig {
  if (!input.port) {
    throw new ConfigValidationError("`port` is required");
  }
  const port = Number(input.port);
  if (!Number.isInteger(port)) {
    throw new ConfigValidationError("`port` must be an integer");
  }

  const host = input.host || "0.0.0.0";
  if (typeof host !== "string") {
    throw new ConfigValidationError("`host` must be a string");
  }

  if (!input.routes || !Object.entries(input.routes).length) {
    throw new ConfigValidationError("`routes` must be an object with at least one entry");
  }
  const routes: { [path: string]: HttpGatewayRouteConfig } = {};
  for (const [path, config] of Object.entries(input.routes)) {
    validateRoutePath(path);
    validateRouteConfig(path, config);
    routes[path] = config;
  }

  return { ...input, port, host, routes };
}

function validateRoutePath(path: string) {
  const hint = `See ${JSON.stringify(path)}.`;
  if (path[0] !== "/") {
    throw new ConfigValidationError(`Route path must start have leading slash. ${hint}`);
  }
  if (path.length > 1 && path[path.length - 1] === "/") {
    throw new ConfigValidationError(`Route path must not have trailing slash. ${hint}`);
  }
}

function validateRouteConfig(path: string, config: HttpGatewayRouteConfig) {
  const hint = `See route ${JSON.stringify(path)}.`;
  const configEntries = Object.entries(config);
  if (configEntries.length !== 1) {
    throw new ConfigValidationError(`Route config object must have a single entry. ${hint}`);
  }
  const [handlerId, handlerConfig] = configEntries[0];
  if (!["proxy", "static"].includes(handlerId)) {
    throw new ConfigValidationError(
      `Handler ID must be "proxy" or "static", but got "${handlerId}". ${hint}`
    );
  }
  if (!(handlerConfig instanceof Object)) {
    throw new ConfigValidationError(`Handler config must be an object. ${hint}`);
  }
  if ("proxy" in config) {
    validateProxyHandlerConfig(config.proxy, hint);
  }
  if ("static" in config) {
    validateStaticHandlerConfig(config.static, hint);
  }
}

function validateProxyHandlerConfig(config: HttpGatewayProxyHandlerConfig, hint: string) {
  if (!config.target) {
    throw new ConfigValidationError(`\`target\` is required for proxy handler config. ${hint}`);
  }
}

function validateStaticHandlerConfig(config: HttpGatewayStaticHandlerConfig, hint: string) {
  if (!config.root) {
    throw new ConfigValidationError(`\`root\` is required for static handler config. ${hint}`);
  }
}

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ConfigValidationError.prototype);
  }
}

ConfigValidationError.prototype.name = ConfigValidationError.name;
