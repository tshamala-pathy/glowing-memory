from pathlib import Path

p = Path(r'C:\Users\Pathy\glowing-memory\frontend\src\pages\Profile.js')
lines = p.read_text(encoding='utf-8').splitlines(True)
out = []
skip = False
for line in lines:
    if "if (activeTab === 'overview_legacy_unused')" in line:
        skip = True
        continue
    if skip:
        if "if (activeTab === 'messages')" in line:
            skip = False
            out.append(line)
        continue
    out.append(line)
p.write_text(''.join(out), encoding='utf-8')
print('done')
