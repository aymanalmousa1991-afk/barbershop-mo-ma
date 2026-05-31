with open("src/sections/AdminDashboard.tsx","r",encoding="utf8") as f:
    c = f.read()

old_import_end = "import { PasswordChangeDialog } from './PasswordChangeDialog';"
new_import_end = "import { PasswordChangeDialog } from './PasswordChangeDialog';\nimport { AdminPhotoManagement } from './AdminPhotoManagement';\nimport { AdminReports } from './AdminReports';"

c = c.replace(old_import_end, new_import_end)

with open("src/sections/AdminDashboard.tsx","w",encoding="utf8") as f:
    f.write(c)
print("AdminDashboard imports updated")
