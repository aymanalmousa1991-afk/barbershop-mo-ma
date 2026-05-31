import urllib.request, json
req = urllib.request.Request('http://localhost:3001/')
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8')
print('cookie-consent:', 'cookie-consent' in html.lower())
print('privacy:', 'privacy' in html.lower())
print('schema.org:', 'schema.org' in html)
print('noscript:', 'noscript' in html)
print('LocalBusiness:', 'LocalBusiness' in html)
