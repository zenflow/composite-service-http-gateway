import { ServiceConfig } from "composite-service";
import * as HttpProxyMiddleware from "http-proxy-middleware";
import serveStatic from "serve-static";

export interface HttpGatewayConfig {
  /**
   * Value to use for the [`ServiceConfig`s] `dependencies` property
   */
  dependencies?: ServiceConfig["dependencies"];

  /**
   * Port to listen on.
   */
  port: number;

  /**
   * Host to listen on.
   * Defaults to `localhost`.
   */
  host?: string;

  /**
   * Ordered collection of routes, where the key is an absolute URL path,
   * and the value is configuration of how to handle requests to that path and all it's sub-paths.
   *
   * The order of entries is significant because requests will be handled by the *first* matching route.
   * Therefore, if you have a route for `'/'`, it should be come last.
   */
  routes: { [path: string]: HttpGatewayRouteConfig };
}

export type HttpGatewayRouteConfig =
  | { proxy: HttpGatewayProxyHandlerConfig }
  | { static: HttpGatewayStaticHandlerConfig };

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface HttpGatewayProxyHandlerConfig extends HttpProxyMiddleware.Options {}

export interface HttpGatewayStaticHandlerConfig extends serveStatic.ServeStaticOptions {
  /**
   * Root directory to serve files from
   */
  root: string;
}
