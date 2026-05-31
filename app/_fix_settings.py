with open("src/sections/AdminSettings.tsx","r",encoding="utf8") as f:
    c = f.read()

# Add home-content editing tab
old_tabs = """      <Tabs defaultValue="services">"""
new_tabs = """      <Tabs defaultValue="home">"""

c = c.replace(old_tabs, new_tabs)

# Add Home Content tab
old_tab_list = """          <TabsTrigger value="services" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
            Diensten
          </TabsTrigger>"""

new_tab_list = """          <TabsTrigger value="home" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
            Home Teksten
          </TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-[#6b0f1a] data-[state=active]:text-white">
            Diensten
          </TabsTrigger>"""

c = c.replace(old_tab_list, new_tab_list)

# Add Home Content tab content before SERVICES TAB
old_services_tab = """        {/* SERVICES TAB */}
        <TabsContent value="services">"""

new_services_tab = """        {/* HOME CONTENT TAB */}
        <TabsContent value="home">
          <HomeContentEditor />
        </TabsContent>

        {/* SERVICES TAB */}
        <TabsContent value="services">"""

c = c.replace(old_services_tab, new_services_tab)

with open("src/sections/AdminSettings.tsx","w",encoding="utf8") as f:
    f.write(c)
print("AdminSettings.tsx updated")
