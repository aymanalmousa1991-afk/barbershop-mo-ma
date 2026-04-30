with open("src/sections/AdminDashboard.tsx","r",encoding="utf8") as f:
    c = f.read()
old = '<option value="mo">Mo</option>\n                  <option value="ma">Ma</option>\n                  <option value="third">Derde kapper</option>\n                </select>\n              </div>\n              <div>\n                <Label>Datum</Label>'
new = '{barbersAgenda.map((b) => <option key={b.key} value={b.key}>{b.name}</option>)}\n                </select>\n              </div>\n              <div>\n                <Label>Datum</Label>'
c = c.replace(old, new)
# Add dialog options
old2 = '<option value="mo">Mo</option>\n          <option value="ma">Ma</option>\n          <option value="third">Derde kapper</option>\n        </select>\n            </div>\n            <div>\n        <Label>Tijd</Label>'
new2 = '{barbersAgenda.map((b) => <option key={b.key} value={b.key}>{b.name}</option>)}\n        </select>\n            </div>\n            <div>\n        <Label>Tijd</Label>'
c = c.replace(old2, new2)
with open("src/sections/AdminDashboard.tsx","w",encoding="utf8") as f:
    f.write(c)
print("OK")
