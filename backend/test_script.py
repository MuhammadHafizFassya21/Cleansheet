import requests
import json

base_url = "http://localhost:8000/api"

def run_test():
    # 1. Upload
    print("Uploading test_data.csv...")
    with open("test_data.csv", "rb") as f:
        upload_res = requests.post(f"{base_url}/upload/", files={"file": f})
    dataset_id = upload_res.json()["dataset_id"]
    print("Dataset ID:", dataset_id)

    # 2. Analyze
    print("\nAnalyzing dataset...")
    analyze_res = requests.post(f"{base_url}/analyze/", json={"dataset_id": dataset_id})
    analysis = analyze_res.json()
    issues = analysis["issues"]
    
    suspicious_negative = [i for i in issues if i["type"] == "suspicious_negative_number"]
    strange_chars = [i for i in issues if i["type"] == "strange_character"]
    invalid_emails = [i for i in issues if i["type"] == "invalid_email"]
    
    print(f"Total issues found: {len(issues)}")
    print(f"Suspicious negative numbers found: {len(suspicious_negative)}")
    for i in suspicious_negative:
        print(f"  - Row {i['row_index']}: {i['column']} = {i['value']}")

    print(f"Strange characters found: {len(strange_chars)}")
    for i in strange_chars:
        print(f"  - Row {i['row_index']}: {i['column']} = {i['value']}")
        
    print(f"Invalid emails found: {len(invalid_emails)}")
    for i in invalid_emails:
        print(f"  - Row {i['row_index']}: {i['column']} = {i['value']}")

    # 3. Clean Preview
    print("\nGetting cleaning preview for strange chars...")
    preview_res = requests.post(f"{base_url}/clean/preview", json={
        "dataset_id": dataset_id,
        "selected_actions": ["remove_strange_characters"]
    })
    preview = preview_res.json()
    print("Preview changes:", json.dumps(preview["preview_changes"], indent=2))

    # 4. Clean Apply
    print("\nApplying cleaning...")
    apply_res = requests.post(f"{base_url}/clean/apply", json={
        "dataset_id": dataset_id,
        "selected_actions": ["remove_strange_characters"]
    })
    apply_data = apply_res.json()
    download_id = apply_data["download_id"]

    # 5. Download
    print(f"\nDownloading cleaned file (ID: {download_id})...")
    download_res = requests.get(f"{base_url}/clean/download/{download_id}")
    content = download_res.text
    print("\nCleaned CSV Content:")
    print(content)

if __name__ == "__main__":
    run_test()
