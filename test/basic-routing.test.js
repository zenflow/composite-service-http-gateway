const { readFileSync } = require("fs");
const { once } = require("events");
const { spawn } = require("child_process");
const fetch = require("node-fetch");
const { StreamLineReader } = require("stream-line-reader");

const script = "test/fixtures/basic-routing-example.ts";
const indexFileText = readFileSync("test/fixtures/static/index.txt", "utf8");
const baseUrl = "http://localhost:3000";

describe("basic routing", () => {
  jest.setTimeout(15000);

  let child;
  afterEach(async () => {
    child.kill();
    await once(child, "exit");
  });

  it("works", async () => {
    child = spawn("node", ["node_modules/ts-node/dist/bin.js", script]);
    const lines = new StreamLineReader([child.stdout, child.stderr]);
    await lines.readUntil(" (debug) }"); // skip config dump
    expect(await lines.readUntil(" (debug) Started composite service")).toMatchInlineSnapshot(`
      Array [
        " (debug) Starting composite service...",
        " (debug) Starting service 'other'...",
        " (debug) Started service 'other'",
        " (debug) Starting service 'gateway'...",
        "gateway | Started @ http://localhost:3000/ (host: 0.0.0.0, port: 3000)",
        "onReady start",
        "onReady end",
        " (debug) Started service 'gateway'",
        " (debug) Started composite service",
      ]
    `);

    // route: /foo/bar
    expect(await fetchJson("/foo/bar")).toStrictEqual({ url: "/foo/bar" });
    expect(await fetchJson("/foo/bar?query")).toStrictEqual({ url: "/foo/bar?query" });
    expect(await fetchJson("/foo/bar/")).toStrictEqual({ url: "/foo/bar/" });
    expect(await fetchJson("/foo/bar/?query")).toStrictEqual({ url: "/foo/bar/?query" });
    expect(await fetchJson("/foo/bar/baz")).toStrictEqual({ url: "/foo/bar/baz" });
    expect(await fetchJson("/foo/bar/baz?query")).toStrictEqual({ url: "/foo/bar/baz?query" });

    // route: /foo
    expect(await fetchText("/foo")).toBe(indexFileText);
    expect(await fetchText("/foo?query")).toBe(indexFileText);
    expect(await fetchText("/foo/")).toBe(indexFileText);
    expect(await fetchText("/foo/?query")).toBe(indexFileText);
    expect(await fetchText("/foo/index.txt")).toBe(indexFileText);
    expect(await fetchText("/foo/index.txt?query")).toBe(indexFileText);
    await expectNotFound("/foo/does/not/exist");

    // route: /foo/baz
    await expectNotFound("/foo/baz");
    await expectNotFound("/foo/baz/foo");

    // route: /foobaz
    expect(await fetchJson("/foobaz")).toStrictEqual({ url: "/" });
    // TODO: report & fix bug in http-proxy-middleware
    //    previous line works but next line results in malformed rewritten url & consequently a 400 error from target
    // expect(await fetchJson("/foobaz?query")).toStrictEqual({ url: "/?query" });
    expect(await fetchJson("/foobaz/")).toStrictEqual({ url: "/" });
    expect(await fetchJson("/foobaz/?query")).toStrictEqual({ url: "/?query" });
    expect(await fetchJson("/foobaz/bar")).toStrictEqual({ url: "/bar" });
    expect(await fetchJson("/foobaz/bar?query")).toStrictEqual({ url: "/bar?query" });

    // route: /
    expect(await fetchText("/")).toBe(indexFileText);
    expect(await fetchText("/?query")).toBe(indexFileText);
    expect(await fetchText("/index.txt")).toBe(indexFileText);
    expect(await fetchText("/index.txt?query")).toBe(indexFileText);
    await expectNotFound("/does/not/exist");

    expect(lines.readBuffered()).toStrictEqual([]);
  });
});

async function fetchResponse(url, expectedStatus) {
  const response = await fetch(`${baseUrl}${url}`);
  if (response.status !== expectedStatus) {
    const message = `Expected http status ${expectedStatus} but got ${response.status}`;
    const debugInfo = `Response Text:\n${await response.text()}`;
    throw new Error(`${message}\n${debugInfo}`);
  }
  return response;
}

async function fetchText(url) {
  const response = await fetchResponse(url, 200);
  return await response.text();
}

async function fetchJson(url) {
  const response = await fetchResponse(url, 200);
  return await response.json();
}

async function expectNotFound(url) {
  const response = await fetchResponse(url, 404);
  const text = await response.text();
  expect(text).toContain(`>Cannot GET ${url}</`);
}
