$path = "c:\Users\hrthi\Downloads\ahg-v3\frontend\src\pages\check\ResultPage.jsx"
(Get-Content $path) -replace '" Check For Me\\ Personalized Safety', '"Check For Me" Personalized Safety' | Set-Content $path
