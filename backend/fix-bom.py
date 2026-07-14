import codecs

file_path = "backend/app.py"

# Read with BOM
with open(file_path, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Write without BOM
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed BOM character in app.py")
