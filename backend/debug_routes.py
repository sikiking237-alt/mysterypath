# debug_routes.py
from app import app

print("=" * 50)
print("📋 Registered Routes:")
print("=" * 50)

for rule in app.url_map.iter_rules():
    methods = ','.join(rule.methods)
    print(f"{rule} -> {methods}")

print("=" * 50)