import urllib.request, json
# Test login
login_data = json.dumps({'username': 'admin', 'password': 'Barber123!'}).encode('utf-8')
req3 = urllib.request.Request('http://localhost:3001/api/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req3) as resp:
    result = json.loads(resp.read())
    token = result.get('token', '')
    print('token length:', len(token))
    # Test report
    req4 = urllib.request.Request('http://localhost:3001/api/admin/report?from=2026-01-01&to=2026-12-31', headers={'Authorization': 'Bearer ' + token})
    try:
        with urllib.request.urlopen(req4) as r:
            report = json.loads(r.read())
            print('report ok:', report.get('success'))
    except Exception as e:
        print('report err:', e)
    # Test photos
    req5 = urllib.request.Request('http://localhost:3001/api/admin/photos', headers={'Authorization': 'Bearer ' + token})
    try:
        with urllib.request.urlopen(req5) as r:
            photos = json.loads(r.read())
            print('photos ok:', photos.get('success'))
    except Exception as e:
        print('photos err:', e)
