const net = require("net");
const fs = require("fs");
const zlib = require("zlib");
let dir = process.argv[3];

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    let [requestLine, ...rest] = data.toString().split("\r\n");
    let rawHeaders = rest.slice(0, rest.length - 2).join("\r\n");
    let body = rest[rest.length - 1];
    let [method, path, version] = requestLine.split(" ");

    let headers = new Headers(rawHeaders);
    let UA = headers.get("User-Agent");

    if (path == "/") return socket.write("HTTP/1.1 200 OK\r\n\r\n");

    let splitted = path.split("/");

    if (splitted[1] == "files") {
      let fileName = splitted.at(-1);
      if (method === "POST") {
        let stream = fs.createWriteStream(dir + fileName);
        stream.write(body);
        stream.end();
        return socket.write("HTTP/1.1 201 Created\r\n\r\n");
      }
      if (fs.existsSync(dir + fileName)) {
        let stream = fs.createReadStream(dir + fileName);
        stream.on("data", (chunk) => {
          let headers = new Headers({
            "Content-Type": "application/octet-stream",
            "Content-Length": chunk.length,
          });
          socket.write("HTTP/1.1 200 OK\r\n" + headers.toString() + "\r\n\r\n" + chunk);
        });
        return;
      }
      else {
        return socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      }
    }

    if (splitted[1] == "user-agent") {
      let responeHeaders = new Headers({
        "Content-Type": "text/plain",
        "Content-Length": UA.length,
      });
      return socket.write("HTTP/1.1 200 OK\r\n" + responeHeaders.toString() + "\r\n\r\n" + UA);
    }
    if (splitted[1] == "echo") {
      if (!splitted[2]) return socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      let responseHeaders = new Headers({
        "Content-Type": "text/plain",
        "Content-Length": splitted[2].length,
      });
      let encoding = null;
      let validEncodings = ["gzip"]
      if (headers.has("Accept-Encoding")) {
        encoding = headers.get("Accept-Encoding").split(", ").find((encoding) => validEncodings.includes(encoding));
      }
      if (encoding === "gzip") {
        let encoded = zlib.gzipSync(splitted[2]);
        responseHeaders = new Headers({
          "Content-Type": "text/plain",
          "Content-Length": encoded.length,
          "Content-Encoding": "gzip",
        });
        socket.write("HTTP/1.1 200 OK\r\n" + responseHeaders.toString() + "\r\n\r\n");
        return socket.write(encoded);
      }

      return socket.write("HTTP/1.1 200 OK\r\n" + responseHeaders.toString() + "\r\n\r\n" + splitted[2]);
    }

    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
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
  has(name) {
    return this.headers[name] !== undefined
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