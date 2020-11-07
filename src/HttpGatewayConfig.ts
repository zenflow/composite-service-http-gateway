import { ServiceConfig } from "composite-service";
import * as HttpProxyMiddleware from "http-proxy-middleware";
import serveStatic from "serve-static";

export interface HttpGatewayConfig {
  dependencies?: ServiceConfig["dependencies"];
  port: number;
  host?: string;
  routes: { [path: string]: HttpGatewayRouteConfig };
}

export type HttpGatewayRouteConfig = HttpGatewayProxyRouteConfig | HttpGatewayStaticRouteConfig;

export interface HttpGatewayProxyRouteConfig {
  proxy: HttpGatewayProxyConfig;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface HttpGatewayProxyConfig extends HttpProxyMiddleware.Options {}

export interface HttpGatewayStaticRouteConfig {
  static: HttpGatewayStaticConfig;
}
export interface HttpGatewayStaticConfig extends serveStatic.ServeStaticOptions {
  dir: string;
}
