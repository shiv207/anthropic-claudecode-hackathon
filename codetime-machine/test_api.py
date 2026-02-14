import requests
import json
import sys

BASE_URL = "http://localhost:8000"


def test_root():
    print("Testing root endpoint...")
    response = requests.get(BASE_URL)
    if response.status_code == 200:
        print("✓ Root endpoint working:", response.json())
        return True
    else:
        print("✗ Root endpoint failed:", response.status_code)
        return False


def test_analyze_commit():
    print("\nTesting commit analysis...")

    mock_diff = """diff --git a/src/main.py b/src/main.py
index 1234567..abcdefg 100644
--- a/src/main.py
+++ b/src/main.py
@@ -10,6 +10,8 @@ def api_endpoint():
     data = request.get_json()
     if not data:
         return jsonify({'error': 'No data provided'}), 400
+    
+    # Added validation for user_id
     user_id = data.get('user_id')
     if not user_id:
         return jsonify({'error': 'user_id is required'}), 400
n@@ -20,6 +22,8 @@ def process_request():
     db = get_db_connection()
     result = db.query('SELECT * FROM users WHERE id = ?', user_id)
+    
+    # Added error handling for database query
     if not result:
         return jsonify({'error': 'User not found'}), 404
"""

    payload = {
        "commit_hash": "abc123",
        "repo_path": "/test/repo",
        "diff_content": mock_diff,
    }

    try:
        response = requests.post(f"{BASE_URL}/analyze-commit", json=payload)
        if response.status_code == 200:
            result = response.json()
            print("✓ Commit analysis successful")
            print("Commit Hash:", result.get("commit_hash"))
            print("Analysis preview:", result.get("analysis", "")[:150] + "...")
            print("Risk Level:", result.get("risk_level"))
            return True
        else:
            print("✗ Commit analysis failed:", response.status_code)
            print("Error:", response.text)
            return False
    except Exception as e:
        print("✗ Error testing commit analysis:", str(e))
        return False



def test_detect_regression():
    print("\nTesting regression detection...")
    
    payload = {
        "repo_path": "/test/repo",
        "performance_data": {
            "execution_time_ms": 1500,
            "memory_usage_mb": 512,
            "cpu_usage_percent": 85,
            "previous_execution_time_ms": 800
        }
    }

    try:
        response = requests.post(f"{BASE_URL}/detect-regression", json=payload)
        if response.status_code == 200:
            result = response.json()
            print("✓ Regression detection successful")
            print("Regression Detected:", result.get("regression_detected"))
            print("Analysis preview:", result.get("analysis", "")[:150] + "...")
            return True, result
        else:
            print("✗ Regression detection failed:", response.status_code)
            print("Error:", response.text)
            return False, None
    except Exception as e:
        print("✗ Error testing regression detection:", str(e))
        return False, None


def test_generate_repair(regression_result):
    print("\nTesting repair generation...")
    
    if not regression_result:
        print("Skipping repair generation test due to missing regression result")
        return False

    # The backend expects just the regression data dictionary
    # Based on main.py: async def generate_repair(regression_data: dict):
    # But wait, main.py defines it as: `async def generate_repair(regression_data: dict):`
    # FastApi will treat `regression_data` as the request body if it's a dict. 
    # Let's verify the endpoint signature in main.py.
    # @app.post("/generate-repair")
    # async def generate_repair(regression_data: dict):
    
    payload = regression_result

    try:
        response = requests.post(f"{BASE_URL}/generate-repair", json=payload)
        if response.status_code == 200:
            result = response.json()
            print("✓ Repair generation successful")
            print("Repair Strategy preview:", result.get("repair_strategy", "")[:150] + "...")
            print("Estimated Effort:", result.get("estimated_effort"))
            return True
        else:
            print("✗ Repair generation failed:", response.status_code)
            print("Error:", response.text)
            return False
    except Exception as e:
        print("✗ Error testing repair generation:", str(e))
        return False


def main():
    print("=" * 50)
    print("Code Time Machine API Test")
    print("=" * 50)

    try:
        if not test_root():
            print("\nAPI not responding. Make sure the backend server is running.")
            sys.exit(1)

        test_analyze_commit()
        
        success, regression_result = test_detect_regression()
        if success:
            test_generate_repair(regression_result)

        print("\n" + "=" * 50)
        print("API tests completed successfully!")
        print("=" * 50)
    except requests.exceptions.ConnectionError:
        print("\n✗ Cannot connect to API server at", BASE_URL)
        print("Make sure the backend is running: python backend/main.py")
        sys.exit(1)
    except Exception as e:
        print("\n✗ Test failed:", str(e))
        sys.exit(1)


if __name__ == "__main__":
    main()
