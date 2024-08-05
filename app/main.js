const net = require("net");

const server = net.createServer((socket) => {
  socket.write("HTTP/1.1 200 OK\r\n\r\n");
  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");
