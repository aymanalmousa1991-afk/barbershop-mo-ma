with open("src/sections/AdminDashboard.tsx","r",encoding="utf8") as f:
    c = f.read()

# Replace handleMove
old_handle = '  const handleMove = async () => {\n    if (!appointmentToMove || !moveTargetBarber) return;\n    setIsMoving(true);\n    try {\n      const token = localStorage.getItem(' + "'token'" + ');\n      const response = await fetch(`' + '${API_URL}/admin/appointments/${appointmentToMove.id}/move`' + ', {\n        method: ' + "'POST'" + ',\n        headers: { ' + "'Authorization'" + ': `Bearer ${token}`, ' + "'Content-Type'" + ': ' + "'application/json'" + ' },\n        body: JSON.stringify({ target_barber_name: moveTargetBarber })\n      });\n      if (!response.ok) throw new Error(' + "'Move failed'" + ');\n      await fetchData();\n      setMoveDialogOpen(false);\n      setAppointmentToMove(null);\n      setMoveTargetBarber(' + "''" + ');\n    } catch (err) {\n      console.error(' + "'Error moving:'" + ', err);\n    } finally {\n      setIsMoving(false);\n    }\n  };'

new_handle = '  const handleMove = async () => {\n    if (!appointmentToMove || !moveTargetBarber) return;\n    setIsMoving(true);\n    try {\n      const token = localStorage.getItem(' + "'token'" + ');\n      const response = await fetch(`' + '${API_URL}/appointments/${appointmentToMove.id}`' + ', {\n        method: ' + "'PUT'" + ',\n        headers: { ' + "'Authorization'" + ': `Bearer ${token}`, ' + "'Content-Type'" + ': ' + "'application/json'" + ' },\n        body: JSON.stringify({\n          name: appointmentToMove.name,\n          email: appointmentToMove.email,\n          phone: appointmentToMove.phone,\n          service: appointmentToMove.service,\n          barber_name: moveTargetBarber,\n          date: moveDate || appointmentToMove.date,\n          time: moveTime || appointmentToMove.time,\n          notes: appointmentToMove.notes,\n        })\n      });\n      if (!response.ok) throw new Error(' + "'Verplaatsen mislukt'" + ');\n      await fetchData();\n      setMoveDialogOpen(false);\n      setAppointmentToMove(null);\n      setMoveTargetBarber(' + "''" + ');\n      setMoveDate(' + "''" + ');\n      setMoveTime(' + "''" + ');\n    } catch (err) {\n      console.error(' + "'Error moving:'" + ', err);\n    } finally {\n      setIsMoving(false);\n    }\n  };'

if old_handle in c:
    c = c.replace(old_handle, new_handle)
    print("handleMove replaced OK")
else:
    print("handleMove NOT FOUND")

with open("src/sections/AdminDashboard.tsx","w",encoding="utf8") as f:
    f.write(c)
print("DONE")
