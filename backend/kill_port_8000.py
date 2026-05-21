import subprocess
import sys

print('Checking netstat for :8000...')
try:
    out = subprocess.check_output(['netstat', '-ano'], text=True, stderr=subprocess.DEVNULL)
except Exception as e:
    print('Failed to run netstat:', e)
    sys.exit(1)

pids = set()
for line in out.splitlines():
    if ':8000' in line:
        parts = line.split()
        if parts:
            pid = parts[-1]
            if pid.isdigit():
                pids.add(pid)

if not pids:
    print('No processes found using port 8000')
    sys.exit(0)

for pid in pids:
    print('Killing PID', pid)
    try:
        subprocess.check_call(['taskkill', '/PID', pid, '/F'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print('Killed', pid)
    except subprocess.CalledProcessError:
        print('Failed to kill', pid)

print('Done')
