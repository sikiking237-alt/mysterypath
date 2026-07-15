import re
import os

# Files to fix
files_to_fix = [
    'backend/app.py',
    'backend/database.py', 
    'backend/routes/auth.py',
    'backend/routes/change_password.py',
    'backend/routes/delete_account.py',
    'backend/utils.py',
    'backend/create_test_user.py',
    'backend/create_user_fixed.py'
]

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace flask_bcrypt imports
    content = re.sub(r'from flask_bcrypt import Bcrypt', '# from flask_bcrypt import Bcrypt', content)
    content = re.sub(r'bcrypt = Bcrypt\(\)', '# bcrypt = Bcrypt()', content)
    
    # Replace generate_password_hash
    content = re.sub(r'bcrypt\.generate_password_hash\(([^)]+)\)', r"bcrypt.hashpw(\1.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')", content)
    
    # Replace check_password_hash
    content = re.sub(r'bcrypt\.check_password_hash\(([^,]+),\s*([^)]+)\)', r"bcrypt.checkpw(\2.encode('utf-8'), \1.encode('utf-8'))", content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Fixed: {filepath}")

print("All files fixed!")
