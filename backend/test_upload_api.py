import http.client
import uuid

HOST = "localhost"
PORT = 8000
PATH = "/api/upload/"

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


tests = [
    ("valid_csv", "test.csv", "col1,col2\n1,2\n3,4", "text/csv"),
    ("invalid_ext", "test.txt", "hello world", "text/plain"),
    ("empty_csv", "empty.csv", "", "text/csv"),
    ("large_csv", "large.csv", "col1\n" + "\n".join(["1"] * (5 * 1024 * 1024 // 2)), "text/csv"),
    ("invalid_csv", "bad.csv", "not,a,csv,broken,\x00", "text/csv"),
]

for label, filename, content, ctype in tests:
    body = build_body("file", filename, content, ctype) + "\r\n--" + boundary + "--\r\n"
    conn = http.client.HTTPConnection(HOST, PORT, timeout=20)
    try:
        conn.request("POST", PATH, body.encode("utf-8", "surrogateescape"), headers)
        resp = conn.getresponse()
        data = resp.read().decode("utf-8", "replace")
        print("===", label, "===")
        print("status", resp.status)
        print(data[:500])
    except Exception as e:
        print("===", label, "ERROR ===")
        print(e)
    finally:
        conn.close()
