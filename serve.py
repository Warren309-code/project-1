#!/usr/bin/env python3
"""Static dev server with aggressive no-cache headers, so CSS/JS edits
are always picked up without a manual browser hard-refresh.

Also mirrors Vercel's cleanUrls: a request for /register (no extension)
is served from register.html if it exists, so the local site behaves
like the production build. A request for the explicit .html path is
301-redirected to the clean URL, again matching production."""
import http.server, socketserver, sys, os

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]

        # .html request -> 301 to the clean URL (matches Vercel cleanUrls)
        if path.endswith(".html") and os.path.isfile(path.lstrip("/")):
            clean = path[:-5]
            self.send_response(301)
            self.send_header("Location", clean)
            self.end_headers()
            return

        # clean URL with no extension -> serve <path>.html if it exists
        if "." not in os.path.basename(path) and not path.endswith("/"):
            candidate = path.lstrip("/") + ".html"
            if os.path.isfile(candidate):
                self.path = "/" + candidate
        super().do_GET()

    def __init__(self, *a, **k):
        super().__init__(*a, directory=".", **k)

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("0.0.0.0", port), Handler) as httpd:
    print(f"serving on http://localhost:{port} (no-cache)")
    httpd.serve_forever()
