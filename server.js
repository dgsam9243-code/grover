// Minimal zero-dependency static server.
// Camera/mic access requires a secure context, and http://localhost counts as one.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 5173;
const ROOT = path.join(__dirname, "public");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
};

http
  .createServer((req, res) => {
    // Dev-only: the lab saves small JPEG snapshots of analysed frames, for checking readings by eye.
    if (req.method === "POST" && req.url.startsWith("/lab-frame?name=")) {
      const name = decodeURIComponent(req.url.split("=")[1]).replace(/[^\w.-]/g, "_");
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        fs.mkdirSync(path.join(__dirname, "tools", "frames"), { recursive: true });
        fs.writeFileSync(path.join(__dirname, "tools", "frames", name), Buffer.concat(chunks));
        res.writeHead(200).end("saved");
      });
      return;
    }
    // Dev-only: the sensor lab (public/lab.html) saves its recorded readings here.
    if (req.method === "POST" && req.url.startsWith("/lab-data")) {
      const file = (new URL(req.url, "http://x").searchParams.get("file") ?? "lab-data.json").replace(/[^\w.-]/g, "_");
      let body = "";
      req.on("data", (c) => { body += c; if (body.length > 20e6) req.destroy(); });
      req.on("end", () => {
        try {
          JSON.parse(body);
          fs.writeFileSync(path.join(__dirname, "tools", file), body);
          res.writeHead(200).end("saved");
        } catch {
          res.writeHead(400).end("bad json");
        }
      });
      return;
    }
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    let file = path.normalize(path.join(ROOT, urlPath === "/" ? "index.html" : urlPath));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end();
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404).end("Not found");
        return;
      }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`Grover running at http://localhost:${PORT}`));
