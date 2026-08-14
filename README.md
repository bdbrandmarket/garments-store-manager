# BD Brand Market — Garments Factory Manager

Fresh responsive GitHub Pages build with Supabase Auth + database.

Files: index.html, style.css, app.js. Keep your existing `logo.jpg` beside them.

Required tables: `employees`, `attendance`, `stock_items`. Use the supplied `supabase-schema.sql` to create them and authenticated-user RLS policies.

Features: login, employee CRUD/search, employee attendance history, manual attendance (in/out/hours/overtime/advance), register OCR helper, stock, salary report, CSV export, mobile sidebar, hash navigation/back button, animations.

OCR is a helper for handwritten registers and must be verified before saving.
