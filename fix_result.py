import re, sys

path = r'C:\Users\hrthi\Downloads\ahg-v3\frontend\src\pages\check\ResultPage.jsx'
with open(path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

print(f"File size: {len(content)}", file=sys.stderr)

# The broken section is from char ~5100 to ~5500
# It is the end of the DosageBlock max_daily_dose JSX code merged with ExplanationBlock comment
# We need to:
# 1. Find the start of the broken ternary: {isHi ? [corrupted_string]...LLM Explanation Block
# 2. Replace it with the correct closing of DosageBlock then ExplanationBlock cleanly

broken_pattern = re.compile(
    r'\{isHi \? .*?// .*?LLM Explanation Block.*?function ExplanationBlock',
    re.DOTALL
)

clean_replacement = """{isHi ? 'Max per day' : 'Max per day'}
            </p>
            <p className="text-xs font-bold text-amber-900">{d.max_daily_dose}</p>
          </div>
        </div>
      )}
      {d.special_risk_groups?.length > 0 && (
        <div>
          <p className="text-[9px] font-black text-red-400 uppercase mb-1">
            {isHi ? 'Inke Liye Savdhani' : 'Extra Care Needed For'}
          </p>
          <div className="flex flex-wrap gap-1">
            {d.special_risk_groups.slice(0,4).map((g,i) => (
              <span key={i} className="bg-red-50 text-red-700 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-red-100">{g}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// AI Explanation Block
function ExplanationBlock"""

new_content = broken_pattern.sub(clean_replacement, content, count=1)
if new_content == content:
    print("WARNING: No replacement made!", file=sys.stderr)
else:
    print("Replacement made successfully!", file=sys.stderr)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print(f"Done! New size: {len(new_content)}", file=sys.stderr)
