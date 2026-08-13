# BD Brand Market — Final Build

## Setup
1. Create the Supabase Auth user from Supabase Dashboard → Authentication → Users.
2. Upload these files to the GitHub Pages repository:
   - index.html
   - style.css
   - app.js
3. Keep your `logo.jpg` in the same folder if you have one.
4. Open the GitHub Pages site and log in with the Supabase user.

## Included
- Supabase email/password login
- Session-protected application
- Employee CRUD + search
- Click employee name → full attendance history
- Attendance: In, Out, Hours, Overtime, Advance, Status, Note
- Manual attendance entry
- Register image OCR helper with editable results
- Stock register
- Reports + CSV export
- Mobile responsive UI
- Browser back/forward navigation
- Existing backup employees/attendance can be migrated into Supabase

## Security
The browser contains only the Supabase publishable key. Database tables use RLS and require an authenticated Supabase user. Never put a Supabase service-role/secret key in frontend files.
