import os
import mimetypes
from http.server import BaseHTTPRequestHandler, HTTPServer

STATIC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?")[0]
        if path in ("", "/"):
            path = "/index.html"
        full = os.path.normpath(os.path.join(STATIC, path.lstrip("/")))
        # static papkasidan tashqariga chiqishni taqiqlash
        if not full.startswith(STATIC) or not os.path.isfile(full):
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"404 Not Found")
            return
        ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
        with open(full, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", ctype + "; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    HTTPServer(("0.0.0.0", port), Handler).serve_forever()
