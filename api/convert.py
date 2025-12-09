from http.server import BaseHTTPRequestHandler
import json
import os
from markitdown import MarkItDown
from supabase import create_client, Client
import tempfile

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # 1. Parse Request Body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)
            file_path = data.get('filePath')

            if not file_path:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'filePath is required'}).encode('utf-8'))
                return

            # 2. Setup Supabase Client
            # Note: Env vars must be set in Vercel project settings (and .env.local for local dev)
            url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
            key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') # Use service role key to access storage if RLS restricts
            
            # Fallback for local dev if SERVICE_ROLE_KEY not set, try anon key (might fail if bucket is private)
            if not key:
                key = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
            
            if not url or not key:
                raise Exception("Supabase credentials missing")

            supabase: Client = create_client(url, key)

            # 3. Download File
            # Create a localized temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file_path)[1]) as temp_file:
                # Download from 'documents' bucket
                res = supabase.storage.from_('documents').download(file_path)
                temp_file.write(res)
                temp_file_path = temp_file.name

            try:
                # 4. Convert using MarkItDown
                md = MarkItDown()
                result = md.convert(temp_file_path)
                markdown_content = result.text_content
            finally:
                 # Cleanup temp file
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)

            # 5. Return Response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'content': markdown_content}).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            error_msg = str(e)
            self.wfile.write(json.dumps({'error': error_msg}).encode('utf-8'))
