import re

path = r'c:\Users\hrthi\Downloads\ahg-v3\frontend\src\pages\check\ResultPage.jsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('" Check For Me\\ Personalized Safety', '"Check For Me" Personalized Safety Check')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
