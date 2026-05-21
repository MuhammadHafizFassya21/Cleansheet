import http.client
import uuid
from pathlib import Path

p = Path("../sample-data/sample_customer_dirty_data.csv")
if not p.exists():
    raise FileNotFoundError(p)

content = p.read_text(encoding="utf-8")
boundary = "----WebKitFormBoundary" + uuid.uuid4().hex
headers = {"Content-Type": f"multipart/form-data; boundary={boundary}"}

body = []
body.append(f"--{boundary}")
body.append(f"Content-Disposition: form-data; name=\"file\"; filename=\"{p.name}\"")
body.append("Content-Type: text/csv")
body.append("")
body.append(content)
body.append(f"--{boundary}--")
raw_body = "\r\n".join(body) + "\r\n"

conn = http.client.HTTPConnection("127.0.0.1", 8000, timeout=30)
conn.request("POST", "/api/analyze/", raw_body.encode("utf-8"), headers)
resp = conn.getresponse()
print("status", resp.status)
print(resp.read().decode("utf-8", "replace"))
conn.close()
