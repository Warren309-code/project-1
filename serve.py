#!/usr/bin/env python3
"""Static dev server with aggressive no-cache headers, so CSS/JS edits
are always picked up without a manual browser hard-refresh."""
import http.server, socketserver, sys

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def __init__(self, *a, **k):
        super().__init__(*a, directory=".", **k)

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("0.0.0.0", port), Handler) as httpd:
    print(f"serving on http://localhost:{port} (no-cache)")
    httpd.serve_forever()
