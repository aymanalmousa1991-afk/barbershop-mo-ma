with open("src/App.tsx","r",encoding="utf8") as f:
    c = f.read()

# Add about section
old_render = """      case 'services':
        return <Services onNavigate={handleNavigate} />;"""

new_render = """      case 'about':
        return <AboutPage onNavigate={handleNavigate} />;
      case 'photos':
        return <PhotoGallery />;
      case 'services':
        return <Services onNavigate={handleNavigate} />;"""

c = c.replace(old_render, new_render)

# Add imports for new pages (before function AppContent)
old_imports = "import { Footer } from '@/sections/Footer';"
new_imports = "import { Footer } from '@/sections/Footer';\nimport { AboutPage } from '@/sections/AboutPage';\nimport { PhotoGallery } from '@/sections/PhotoGallery';"
c = c.replace(old_imports, new_imports)

# Update showFooter to include new pages
old_footer = "const showFooter = !['admin', 'admin-dashboard'].includes(currentPage);"
new_footer = "const showFooter = !['admin', 'admin-dashboard', 'photos'].includes(currentPage);"
c = c.replace(old_footer, new_footer)

# Make admin route not accessible for non-admins
old_admin_case = """      case 'admin':
        if (isAuthenticated) {
          return <AdminDashboard onNavigate={handleNavigate} />;
        }
        return <AdminLogin onNavigate={handleNavigate} />;"""

new_admin_case = """      case 'admin':
      case 'admin-dashboard':
        if (isAuthenticated) {
          return <AdminDashboard onNavigate={handleNavigate} />;
        }
        return <AdminLogin onNavigate={handleNavigate} />;"""

c = c.replace(old_admin_case, new_admin_case)

# Remove duplicate case for admin-dashboard
old_dup = """      case 'admin-dashboard':
        if (isAuthenticated) {
          return <AdminDashboard onNavigate={handleNavigate} />;
        }
        return <AdminLogin onNavigate={handleNavigate} />;"""

if old_dup in c:
    c = c.replace(old_dup, "")
    print("Removed duplicate admin-dashboard case")

with open("src/App.tsx","w",encoding="utf8") as f:
    f.write(c)
print("App.tsx updated")
