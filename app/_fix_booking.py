with open("src/sections/Booking.tsx","r",encoding="utf8") as f:
    c = f.read()

# 1. Update text - replace the paragraph about opening hours
old_text = '<p className="text-base sm:text-lg text-stone-600 px-2">\n            Maak eenvoudig een afspraak online. Wij zijn van maandag t/m zaterdag geopend, \n            op afspraak of gewoon binnenlopen!\n          </p>'
new_text = '<p className="text-base sm:text-lg text-stone-600 px-2">\n            Maak eenvoudig een afspraak online. Wij zijn van maandag t/m zaterdag geopend: uitsluitend op afspraak (Ma, Di, Vr, Za) of gewoon binnenlopen (Wo, Do)!\n          </p>'
c = c.replace(old_text, new_text)

# 2. Add "Wassen" and "Wenkbrauwen epileren" to services list
old_services = """const services = [
  { id: 'knippen-stylen', name: 'Knippen + stylen (wax)', price: '€26', duration: 30 },
  { id: 'knippen-baard', name: 'Knippen + baard stylen/scheren', price: '€37,50', duration: 45 },
  { id: 'senioren', name: 'Senioren 65+ knippen + stylen', price: '€22', duration: 30 },
  { id: 'tondeuse', name: 'Alles één lengte/kaalscheren', price: '€19', duration: 20 },
  { id: 'baard', name: 'Baard stylen of scheren', price: '€20', duration: 15 },
  { id: 'baard-nek', name: 'Baard + neklijnen bijwerken', price: '€21', duration: 20 },
  { id: 'jong-tm11', name: 'Jongens t/m 11 jaar', price: '€21', duration: 25 },
  { id: 'jong-12-13', name: 'Jongens 12-13 jaar', price: '€25', duration: 30 },
];"""

new_services = """const services = [
  { id: 'knippen-stylen', name: 'Knippen + stylen (wax)', price: '€26', duration: 30 },
  { id: 'knippen-baard', name: 'Knippen + baard stylen/scheren', price: '€37,50', duration: 45 },
  { id: 'senioren', name: 'Senioren 65+ knippen + stylen', price: '€22', duration: 30 },
  { id: 'tondeuse', name: 'Alles één lengte/kaalscheren', price: '€19', duration: 20 },
  { id: 'baard', name: 'Baard stylen of scheren', price: '€20', duration: 15 },
  { id: 'baard-nek', name: 'Baard + neklijnen bijwerken', price: '€21', duration: 20 },
  { id: 'jong-tm11', name: 'Jongens t/m 11 jaar', price: '€21', duration: 25 },
  { id: 'jong-12-13', name: 'Jongens 12-13 jaar', price: '€25', duration: 30 },
  { id: 'wassen', name: 'Wassen', price: '€1,50', duration: 10 },
  { id: 'wenkbrauwen', name: 'Wenkbrauwen epileren', price: '€12', duration: 10 },
];"""

c = c.replace(old_services, new_services)

# 3. Update the API call to pass duration-based slot calculation - add treatment param to available-slots
# The backend already receives "treatment" param, we just need to use it
# Replace the fetchAvailableSlots call to include treatment
old_fetch = """      const response = await fetch(
        \x60\${API_URL}/appointments/available-slots?date=\${dateStr}&barber_name=\${formData.barber_name}&treatment=\${formData.service}\x60
      );"""

# Keep as is - already uses treatment param

# 4. Fix the POST to send both service and treatment (mapping for backend)
old_post = """      const response = await fetch(\x60\${API_URL}/appointments\x60, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          treatment: formData.service, // Backend slaat op als 'treatment'
        }),
      });"""

new_post = """      const response = await fetch(\x60\${API_URL}/appointments\x60, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          service: formData.service,
          treatment: formData.service, // Backend slaat op als 'treatment'
        }),
      });"""

c = c.replace(old_post, new_post)

with open("src/sections/Booking.tsx","w",encoding="utf8") as f:
    f.write(c)
print("Booking.tsx updated")
