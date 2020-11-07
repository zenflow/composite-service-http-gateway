const { createServer } = require("http");

const server = createServer((req, res) => {
  const { url } = req;
  res.end(JSON.stringify({ url }));
});

server.listen(process.env.PORT);
