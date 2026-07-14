# backend/test_login_direct.py
import requests
import json
import sys
import traceback

def test_login():
    url = "http://localhost:5000/api/login"
    data = {
        "email": "instructor@learnflow.com",
        "password": "password123"
    }
    
    print(f"Testing login at: {url}")
    print(f"Data: {json.dumps(data, indent=2)}")
    print()
    
    try:
        response = requests.post(
            url,
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print()
        
        try:
            response_data = response.json()
            print(f"Response: {json.dumps(response_data, indent=2)}")
        except json.JSONDecodeError:
            print(f"Raw response (not JSON): {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - Is the server running?")
    except requests.exceptions.Timeout:
        print("❌ Timeout - Server took too long to respond")
    except Exception as e:
        print(f"❌ Error: {e}")
        traceback.print_exc()

if __name__ == '__main__':
    test_login()