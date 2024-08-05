const net = require("net");

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    let [requestLine, rawHeaders, body] = data.toString().split("\r\n\r\n");
    let [method, path, version] = requestLine.split(" ");

    let splitted = path.split("/");
    if (splitted[1] == "echo") {
      let responeHeaders = new Headers({
        "Content-Type": "text/plain",
        "Content-Length": splitted[2].length,
      });
      socket.write("HTTP/1.1 200 OK\r\n" + responeHeaders.toString() + "\r\n\r\n" + splitted[2]);
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }
  });
  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");

class Headers {
  constructor(headers = {}) {
    this.headers = (typeof headers) == "string" ? this._parseRawHeaders(headers) : headers;
  }
  get(name) {
    return this.headers[name];
  }
  set(name, value) {
    this.headers[name] = value;
  }
  toString() {
    return Object.keys(this.headers).map((name) => `${name}: ${this.headers[name]}`).join("\r\n");
  }
  _parseRawHeaders(rawHeaders) {
    let headers = {};
    rawHeaders.split("\r\n").forEach((header) => {
      let [name, value] = header.split(": ");
      headers[name] = value;
    });
    return headers;
  }
}