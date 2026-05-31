import os, re

BASE = "server"
files = {
    "server.cjs": ["CANCELLATION", "PHOTOS", "home-content", "/api/admin/report", "/api/admin/photos", "multer"],
    "adminRoutes.cjs": ["appointments/all", "barbers"],
}
for f, checks in files.items():
    path = os.path.join(BASE, f)
    c = open(path, "r", encoding="utf8").read()
    print(f"\n=== {f} ({len(c)} chars) ===")
    for check in checks:
        print(f"  {check}: {'✅' if check in c else '❌'}")

print("\n\n=== FRONTEND FILES CHECK ===")
check_files = [
    "src/sections/AboutPage.tsx",
    "src/sections/PhotoGallery.tsx",
    "src/sections/AdminPhotoManagement.tsx",
    "src/sections/AdminReports.tsx",
]
for f in check_files:
    exists = os.path.exists(f)
    if exists:
        size = os.path.getsize(f)
        print(f"  {f}: ✅ ({size} bytes)")
    else:
        print(f"  {f}: ❌ NOT FOUND")

# Check imports
print("\n\n=== APP.TSX IMPORTS CHECK ===")
app = open("src/App.tsx", "r", encoding="utf8").read()
for imp in ["AboutPage", "PhotoGallery"]:
    print(f"  import {imp}: {'✅' if imp in app else '❌'}")

print("\n\n=== NAVBAR CHECK ===")
nav = open("src/sections/Navbar.tsx", "r", encoding="utf8").read()
for check in ["useAuth", "isAuthenticated", "'about'", "'photos'", "Admin"]:
    print(f"  {check}: {'✅' if check in nav else '❌'}")

print("\n\n=== ADMIN DASHBOARD CHECK ===")
dash = open("src/sections/AdminDashboard.tsx", "r", encoding="utf8").read()
for check in ["AdminPhotoManagement", "AdminReports", "barberFilter", "barbersAgenda", "_date"]:
    print(f"  {check}: {'✅' if check in dash else '❌'}")

print("\n\n=== BOOKING CHECK ===")
book = open("src/sections/Booking.tsx", "r", encoding="utf8").read()
for check in ["wassen", "wenkbrauwen"]:
    print(f"  {check} in services: {'✅' if check in book else '❌'}")

print("\n\n=== DB CHECK ===")
db = open("server/database.cjs", "r", encoding="utf8").read()
for check in ["home_content", "photos", "cancellation_tokens"]:
    print(f"  CREATE TABLE {check}: {'✅' if check in db else '❌'}")
