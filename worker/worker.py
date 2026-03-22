import os
import requests
import ee

SH_CLIENT_ID = os.environ.get('SH_CLIENT_ID')
SH_CLIENT_SECRET = os.environ.get('SH_CLIENT_SECRET')

def test_sentinel_hub():
    print("Testing Sentinel Hub Connectivity...")
    if not SH_CLIENT_ID or not SH_CLIENT_SECRET or "your_client_id" in SH_CLIENT_ID:
        print("ERROR: Sentinel Hub credentials not provided in .env.gis")
        return False
        
    url = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
    payload = {
        'grant_type': 'client_credentials',
        'client_id': SH_CLIENT_ID,
        'client_secret': SH_CLIENT_SECRET
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    try:
        response = requests.post(url, headers=headers, data=payload)
        response.raise_for_status()
        print("SUCCESS! Sentinel Hub Authentication Token received.")
        return True
    except Exception as e:
        print(f"FAILED to connect to Sentinel Hub: {e}")
        return False

import traceback

def test_google_earth_engine():
    print("Testing Google Earth Engine Connectivity...")
    try:
        from google.oauth2 import service_account
        key_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
        if not key_path or not os.path.exists(key_path):
            print(f"ERROR: Service Account Key not found at {key_path}")
            return False
            
        credentials = service_account.Credentials.from_service_account_file(
            key_path,
            scopes=['https://www.googleapis.com/auth/earthengine']
        )
        ee.Initialize(credentials, project='crop-digital-twin-490904')
        print("SUCCESS! Authenticated to Google Earth Engine.")
        return True
    except Exception as e:
        print(f"FAILED to connect to Google Earth Engine. Error Details:")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    with open('/data/test_results.txt', 'w') as f:
        f.write("=== GIS and Satellite Services Worker Connectivity Test ===\n")
        import sys
        
        # Redirect stdout and stderr to the file
        original_stdout = sys.stdout
        original_stderr = sys.stderr
        sys.stdout = f
        sys.stderr = f
        
        try:
            sh_status = test_sentinel_hub()
            gee_status = test_google_earth_engine()
            
            if sh_status and gee_status:
                print("\nAll integration tests passed successfully.")
            else:
                print("\nSome integration tests failed. Please review the logs above.")
        finally:
            sys.stdout = original_stdout
            sys.stderr = original_stderr

