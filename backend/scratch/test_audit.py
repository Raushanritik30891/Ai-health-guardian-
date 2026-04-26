
import requests

API_URL = "http://localhost:8000"

def test_audit():
    payload = {
        "medicines": ["Ibuprofen"],
        "diseases": ["Dengue", "Asthma"],
        "allergies": ["Penicillin"],
        "curr_meds": ["Warfarin"],
        "include_profile": True
    }
    
    try:
        r = requests.post(f"{API_URL}/api/interactions/check", json=payload)
        print("Status Code:", r.status_code)
        if r.status_code == 200:
            data = r.json()
            print("\nOverall Safety:", data['overall_safety'])
            print("Overall Emoji:", data['overall_emoji'])
            print("Overall Message:", data['overall_message'])
            
            print("\nProfile Alerts:")
            for a in data['profile_alerts']:
                print("- ", a['msg'])
                
            print("\nInteractions:")
            for i in data['interactions']:
                print("- Pair:", i['pair'], "Severity:", i['severity'])
        else:
            print("Error:", r.text)
    except Exception as e:
        print("Exception:", e)

if __name__ == "__main__":
    test_audit()
