from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class TestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/test':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "message": "Servidor funcionando"}).encode())
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'{"error": "Not found"}')
    
    def log_message(self, format, *args):
        pass

def run():
    server = HTTPServer(('localhost', 8000), TestHandler)
    print("Servidor de prueba en http://localhost:8000")
    print("Prueba: http://localhost:8000/test")
    server.serve_forever()

if __name__ == "__main__":
    run()