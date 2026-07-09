import http.server
import socketserver
import os
import time
import json

PORT = 8000

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'X-Auth-Token, Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.end_headers()

    def do_POST(self):
        # 1. MOTOR DE SUBIDA DE IMÁGENES
        if 'upload.php' in self.path:
            content_type = self.headers.get('Content-Type', '')
            if 'multipart/form-data' in content_type:
                boundary = content_type.split("boundary=")[1].encode('utf-8')
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                parts = body.split(b'--' + boundary)
                
                target_name = ""
                file_data = None
                original_filename = "image.png"
                
                for part in parts:
                    if b'name="target"' in part:
                        try:
                            target_name = part.split(b'\r\n\r\n')[1].split(b'\r\n')[0].decode('utf-8').strip()
                        except Exception:
                            pass
                    elif b'name="imagen"' in part:
                        try:
                            if b'filename="' in part:
                                original_filename = part.split(b'filename="')[1].split(b'"')[0].decode('utf-8')
                            file_content = part.split(b'\r\n\r\n', 1)[1]
                            file_data = file_content[:-2]
                        except Exception:
                            pass
                
                if file_data:
                    ext = original_filename.split('.')[-1].lower() if '.' in original_filename else 'png'
                    if ext not in ['png', 'jpg', 'jpeg', 'webp']: ext = 'png'
                        
                    if target_name and target_name != "": final_filename = target_name
                    else: final_filename = f"news_{int(time.time())}.{ext}"
                        
                    destination = os.path.join('.', final_filename)
                    with open(destination, 'wb') as f:
                        f.write(file_data)
                    
                    self.send_response(200)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    respuesta_json = f'{{"status":"success","message":"[Simulador] Imagen guardada","filename":"{final_filename}"}}'
                    self.wfile.write(respuesta_json.encode('utf-8'))
                    return
            self.send_response(400)
            self.end_headers()
            return
            
        # 2. MOTOR DE BORRADO DE IMÁGENES (GARBAGE COLLECTOR)
        if 'delete_image.php' in self.path:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body.decode('utf-8'))
                filename = data.get('filename', '')
                # Protegemos que solo borre fotos de noticias
                if filename.startswith('news_'):
                    filepath = os.path.join('.', os.path.basename(filename))
                    if os.path.exists(filepath):
                        os.remove(filepath)
                        print(f"🗑️ [Simulador] Foto eliminada: {filename}")
                self.send_response(200)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status":"success"}')
            except Exception as e:
                self.send_response(500)
                self.end_headers()
            return

        super().do_POST()

# Forzamos que el servidor lea la raíz del proyecto para que la PWA encuentre el Logo
admin_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(admin_dir)
os.chdir(root_dir)

with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
    print(f"\n=======================================================")
    print(f" SERVIDOR DE SIMULACIÓN Y BORRADO INICIADO")
    print(f"=======================================================")
    print(f"-> Web pública:  http://localhost:{PORT}")
    print(f"-> Panel Admin:  http://localhost:{PORT}/admin/index.html")
    print(f"=======================================================\n")
    httpd.serve_forever()