# BD Brand Market — Attendance v3

- Operator / Helper আলাদা
- Present / Absent + date-wise save
- Add Employee
- **Edit Employee**
- Delete Employee
- Search
- Register photo scanner
- Bengali + English OCR (Tesseract.js)
- OCR result save করার আগে editable
- Print → Save as PDF

গুরুত্বপূর্ণ: হাতে লেখা বাংলা OCR 100% নির্ভুল নয়। তাই scanner result সরাসরি final data হিসেবে save করে না; আগে edit/verify করা যায়। OCR library শুধু Scanner চাপলে load হয়, তাই app-এর মূল dashboard CDN-এর জন্য আটকে থাকে না।
