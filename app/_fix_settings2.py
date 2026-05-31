with open("src/sections/AdminSettings.tsx","r",encoding="utf8") as f:
    c = f.read()

# Add HomeContentEditor component at the end

old_end = """      </Dialog>
    </div>
  );
}
// Nu volgt de export"""

# Find the end of file - check if HomeContentEditor already exists
if "function HomeContentEditor" in c:
    print("HomeContentEditor already exists")
else:
    # Find the last closing brace of AdminSettings function
    # Add after the last Dialog closing
    insert_pos = c.rfind("</Dialog>")
    if insert_pos > 0:
        # Find the next closing structure
        rest = c[insert_pos:]
        
        # Add before the final return/close of the component
        new_component = """{/* HomeContentEditor component */}
function HomeContentEditor() {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await fetch(`${API_URL}/home-content`);
      const data = await res.json();
      if (data.success) setContent(data.data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveSection = async (section: string) => {
    setSaving(section);
    try {
      await fetch(`${API_URL}/admin/home-content`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, content: content[section] || '' }),
      });
      await fetchContent();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-stone-500" /></div>;
  }

  const sections = [
    { key: 'hero_title', label: 'Hero Titel', type: 'text' },
    { key: 'hero_subtitle', label: 'Hero Ondertitel', type: 'textarea' },
    { key: 'opening_hours_title', label: 'Openingstijden Titel', type: 'text' },
    { key: 'opening_ma', label: 'Openingstijden Maandag', type: 'text' },
    { key: 'opening_di_vr', label: 'Openingstijden Di-Vrij', type: 'text' },
    { key: 'opening_za', label: 'Openingstijden Zaterdag', type: 'text' },
    { key: 'opening_zo', label: 'Openingstijden Zondag', type: 'text' },
    { key: 'opening_afspraak', label: 'Op afspraak tekst', type: 'text' },
    { key: 'opening_inloop', label: 'Inloop tekst', type: 'text' },
    { key: 'welcome_text', label: 'Welkomsttekst Home', type: 'textarea' },
  ];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-[#6b0f1a] to-[#8b1523]">
        <CardTitle className="text-white flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Home Pagina Teksten
        </CardTitle>
        <p className="text-white/60 text-xs mt-1">
          Pas de teksten op de home pagina aan. Wijzigingen worden direct opgeslagen.
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.key} className="border-b border-stone-100 pb-4">
              <Label className="font-semibold text-[#1a1a1a]">{section.label}</Label>
              {section.type === 'textarea' ? (
                <textarea
                  className="w-full mt-2 p-3 border rounded-lg text-sm min-h-[100px]"
                  value={content[section.key] || ''}
                  onChange={(e) => setContent({ ...content, [section.key]: e.target.value })}
                />
              ) : (
                <Input
                  className="mt-2"
                  value={content[section.key] || ''}
                  onChange={(e) => setContent({ ...content, [section.key]: e.target.value })}
                />
              )}
              <Button
                size="sm"
                onClick={() => saveSection(section.key)}
                disabled={saving === section.key}
                className="mt-2 bg-[#6b0f1a]"
              >
                {saving === section.key ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />...</> : 'Opslaan'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
"""

        c = c[:insert_pos] + rest + new_component
    else:
        print("Dialog closing not found, appending to end")
        c += new_component

with open("src/sections/AdminSettings.tsx","w",encoding="utf8") as f:
    f.write(c)
print("AdminSettings.tsx updated with HomeContentEditor")
