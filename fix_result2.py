import re

path = r'C:\Users\hrthi\Downloads\ahg-v3\frontend\src\pages\check\ResultPage.jsx'
with open(path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Fix 1: Replace broken minus sign in open/close toggle
# The original was: {open ? '\u2212' : '+'} which got corrupted
content = content.replace("{open ? '\ufffd^'' : '+'}", "{open ? '-' : '+'}")
content = content.replace("{open ? '\xfe^'' : '+'}", "{open ? '-' : '+'}")

# Fix 2: Replace broken middle dot in breadcrumb
# Original: ` \u00B7 ${med.strength}` got corrupted  
content = content.replace("` A\xfe ${med.strength}`", "` - ${med.strength}`")
content = content.replace("` A\ufffd ${med.strength}`", "` - ${med.strength}`")

# Fix 3: Replace the broken Hindi TTS template string with plain English
broken_tts = re.search(
    r'const ttsTxt = isHi\s*\n\s*\? `\$\{med\.brandName\}\. [^\n]+`',
    content
)
if broken_tts:
    start = broken_tts.start()
    end = broken_tts.end()
    print(f"Found broken ttsTxt at {start}-{end}")
    clean_tts = """const ttsTxt = isHi
    ? `${med.brandName}. Upyog: ${med.uses?.join(', ')}.`
    : `${med.brandName}. Uses: ${med.uses?.join(', ')}.`"""
    content = content[:start] + clean_tts + content[end:]
else:
    print("ttsTxt pattern not found")

# Fix 4: replace broken emoji in DosageBlock label (pill emoji got broken)
content = content.replace("dY'S {isHi", "'Dosage Guide'}\n      </p>")
content = content.replace("d?\"S {isHi", "'Dosage Guide'}\n      </p>")

# Fix 5: The sparkles emoji in ExplanationBlock
content = content.replace("\ufffd\ufffd\" {isHi ? 'AI", "\"AI Explanation\" }")
content = content.replace(r"  ?o\" {isHi ? 'AI", "")

# Write the fixed content
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"Done! File size: {len(content)}")

# Verify no remaining broken chars in JSX expressions
import sys
lines = content.split('\n')
for i, line in enumerate(lines):
    if '\ufffd' in line or '\xfe' in line:
        sys.stderr.write(f"Line {i+1} still has broken chars: {line[:100]}\n")
