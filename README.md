# BD Brand Market — Garments Factory
Static GitHub Pages factory management system.

## Features
- Dashboard
- Employee add / edit / delete / search
- Manual attendance: status, In, Out, hours, overtime, advance
- Monthly salary report
- Stock with stock in/out and low-stock alert
- Reports
- JSON backup / restore
- Mobile responsive UI and animations
- Attendance Register Scanner using browser-side Tesseract.js
- OCR result can be reviewed and corrected before adding employees

## Register Scanner limitation
Handwritten Bangla names and attendance marks are difficult for browser OCR. The scanner is therefore designed as an assisted workflow: upload the register image, review detected name/ID rows, correct them, then save. Attendance values can always be entered manually from the same Attendance screen.

## GitHub Pages
Settings → Pages → Deploy from a branch → `main` → `/(root)`.
Keep your existing `logo.jpg` in the repository root.
