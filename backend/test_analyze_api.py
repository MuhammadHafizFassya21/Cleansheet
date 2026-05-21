import http.client
import uuid

HOST = "localhost"
PORT = 8000
PATH = "/api/analyze/"

boundary = "----WebKitFormBoundary" + uuid.uuid4().hex
headers = {"Content-Type": f"multipart/form-data; boundary={boundary}"}

def build_body(field_name, filename, content, content_type="text/csv"):
    lines = []
    lines.append(f"--{boundary}")
    lines.append(f"Content-Disposition: form-data; name=\"{field_name}\"; filename=\"{filename}\"")
    lines.append(f"Content-Type: {content_type}")
    lines.append("")
    lines.append(content)
    return "\r\n".join(lines)

body = build_body("file", "sample.csv", "name,email,phone\nBudi,budi@mail,08123456789\nRina,rina@example,08123456790\n", "text/csv")
body += "\r\n--" + boundary + "--\r\n"

conn = http.client.HTTPConnection(HOST, PORT, timeout=20)
try:
    conn.request("POST", PATH, body.encode("utf-8"), headers)
    resp = conn.getresponse()
    data = resp.read().decode("utf-8", "replace")
    print("status", resp.status)
    print(data)
finally:
    conn.close()
