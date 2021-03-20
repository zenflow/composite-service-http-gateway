import { ServiceConfig } from "composite-service";
import * as HttpProxyMiddleware from "http-proxy-middleware";
import serveStatic from "serve-static";

/**
 * Configuration for an http gateway service
 */
export interface HttpGatewayConfig extends Omit<ServiceConfig, "command" | "ready"> {
  /**
   * Port to listen on.
   */
  port: number | string;

  /**
   * Host to listen on.
   * Defaults to `0.0.0.0`.
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

export interface HttpGatewayProxyHandlerConfig extends HttpProxyMiddleware.Options {}

export interface HttpGatewayStaticHandlerConfig extends serveStatic.ServeStaticOptions {
  /**
   * Root directory to serve files from
   */
  root: string;
}
