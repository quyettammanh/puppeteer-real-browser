import requests
import os
import pandas as pd
import io
import unicodedata
import json

def save_json_file(data, file_path):
    with open(file_path, mode="w", encoding="utf-8") as json_file:
        json.dump(data, json_file, ensure_ascii=False, indent=4)

def transform_name_row(data):
    transformed_rows = []
    for row in data:
        # Xử lý trường Date Of Birth
        dob = row.get("Date Of Birth", "")
        date_birth = month_birth = year_birth = ""
        if dob:
            parts = str(dob).split("/")
            if len(parts) == 3:
                date_birth, month_birth, year_birth = parts

        try:
            reading_value = int(row.get("Reading", "0"))
        except ValueError:
            reading_value = 0
        try:
            listening_value = int(row.get("Listening", "0"))
        except ValueError:
            listening_value = 0
        try:
            writing_value = int(row.get("Writing", "0"))
        except ValueError:
            writing_value = 0
        try:
            speaking_value = int(row.get("Speaking", "0"))
        except ValueError:
            speaking_value = 0
        try:
            priority_value = int(row.get("Priority", "0"))
        except ValueError:
            priority_value = 0

        transformed = {
            "email": row.get("Email", ""),
            "password": row.get("Password", ""),
            "family_name": row.get("Family Name", ""),
            "last_name": row.get("Last Name", ""),
            "number_phone": row.get("Number Phone", ""),
            "postal_code": row.get("Postal Code", ""),
            "location": row.get("Location", ""),
            "street_name": row.get("Street Name", ""),
            "place_of_birth": row.get("Place Of Birth", ""),
            "reading": str(reading_value),
            "listening": str(listening_value),
            "writing": str(writing_value),
            "speaking": str(speaking_value),
            "priority": str(priority_value),
            "sum": str(reading_value + listening_value + writing_value + speaking_value),
            "date_birth": date_birth,
            "month_birth": month_birth,
            "year_birth": year_birth
        }
        transformed_rows.append(transformed)
    return transformed_rows

def transform_data(data):
    result = []
    for row in data:
        # Transform name fields if they exist and are not empty
        if row.get("family_name"):
            row["family_name"] = remove_diacritics_and_capitalize(row["family_name"])
        if row.get("last_name"):
            row["last_name"] = remove_diacritics_and_capitalize(row["last_name"])
        if row.get("place_of_birth"):
            row["place_of_birth"] = remove_diacritics_and_capitalize(row["place_of_birth"])
        if row.get("location"):
            row["location"] = remove_diacritics_and_capitalize(row["location"])
        if row.get("number_phone"):
            row["number_phone"] = row["number_phone"].lstrip("0")
        # Check if postal_code exists and has exactly 5 characters
        if row.get("postal_code") and len(row.get("postal_code")) != 5:
            print(f"ERROR: Postal code for '{row['email']}' is not valid, should be 5 digits!")
            continue

        result.append(row)
    return result
    

def remove_diacritics_and_capitalize(s):
    # Loại bỏ dấu và viết hoa chữ cái đầu của từ
    s_no_diacritics = ''.join(
        c for c in unicodedata.normalize('NFD', s)
        if unicodedata.category(c) != 'Mn'
    )
    return s_no_diacritics.title()

def download_file():
    # Thông tin bảng tính
    spreadsheet_id = "1P_1Vczppj-txYkbXUBWY8lMQf-_8uTxCPco19-aOLss"

    # Danh sách các sheet cần tải, mỗi phần tử gồm: (tên_sheet, gid)
    sheets = [
        ("hn_a1", "32346430"),
        ("hn_a2", "1409703178"),
        ("hn_b1", "2085014341"),
        ("hn_b2", "0"),
        ("hcm_a1", "372712368"),
        ("hcm_a2", "419601797"),
        ("hcm_b1", "1966930929"),
        ("hcm_b2", "1748866977"),
        ("hn_test","602990682"),
    ]
    for sheet_name, gid in sheets:
        print("\nĐang tải file",sheet_name)
        export_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv&gid={gid}"
        try:
            response = requests.get(export_url)
            response.raise_for_status()  # Kiểm tra lỗi HTTP

            content_text = response.content.decode("utf-8")
            # Đọc CSV, giữ nguyên định dạng của Postal Code là string
            df = pd.read_csv(io.StringIO(content_text), dtype={"Postal Code": str,"Number Phone":str})
            if df.empty or len(df) < 1:
                print(f"Không có dữ liệu trong sheet {sheet_name} (ngoại trừ tiêu đề), bỏ qua tải xuống.")
                continue

            # Chuyển đổi DataFrame thành danh sách dictionary
            data = df.to_dict(orient="records")

            # Tiến hành chuyển đổi dữ liệu
            data = transform_name_row(data)
            data = transform_data(data)

            # Xác định thư mục lưu dựa vào tên sheet
            if "hcm" in sheet_name.lower():
                target_dir = "./data/user/hcm"
            elif "hn" in sheet_name.lower():
                target_dir = "./data/user/hn"
            os.makedirs(target_dir, exist_ok=True)  # Tạo thư mục nếu chưa tồn tại

            file_path = os.path.join(target_dir, f"{sheet_name}.json")
            save_json_file(data, file_path)
            print(f"Tải file {file_path} thành công!")
        except requests.exceptions.RequestException as e:
            print(f"Có lỗi khi tải sheet {sheet_name}: {e}")
        except Exception as e:
            print(f"Có lỗi khi xử lý sheet {sheet_name}: {e}")

if __name__ == "__main__":
    print("Bắt đầu tải dữ liệu...")
    download_file()
