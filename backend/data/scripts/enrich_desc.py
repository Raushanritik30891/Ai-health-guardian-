import json
import os

path = r'c:\Users\hrthi\Downloads\ahg-v3\backend\data\medicines.json'
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for med in data.get('medicines', []):
    if 'description' not in med:
        b_name = med.get('brand_name', '')
        g_name = med.get('generic_name', '')
        cat = med.get('category', '')
        uses = ', '.join(med.get('uses', [])[:2]) if med.get('uses') else 'various conditions'
        med['description'] = f"{b_name} is a medical formulation containing {g_name} as its active salt. It is classified under {cat} and is primarily prescribed for the management or treatment of {uses}."

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Enriched description for medicines.")
