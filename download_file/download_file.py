import requests
import os
import pandas as pd
import io
import unicodedata
import json
import datetime
import sys
import math

def log(message, error=False):
    """Log a message with timestamp"""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    output = f"[{timestamp}] {'ERROR: ' if error else ''}{message}"
    print(output)
    # Also log to a file
    with open("download_log.txt", "a", encoding="utf-8") as log_file:
        log_file.write(output + "\n")

def save_json_file(data, file_path):
    log(f"Saving {len(data)} records to {file_path}")
    try:
        with open(file_path, mode="w", encoding="utf-8") as json_file:
            json.dump(data, json_file, ensure_ascii=False, indent=4)
        log(f"Successfully saved to {file_path}")
    except Exception as e:
        log(f"Failed to save to {file_path}: {str(e)}", error=True)
        raise

def transform_name_row(data):
    log(f"Transforming {len(data)} rows")
    transformed_rows = []
    error_count = 0
    
    for idx, row in enumerate(data):
        try:
            # Check required fields
            email = row.get("Email", "")
            password = row.get("Password", "")
            
            # Handle NaN values from pandas
            if isinstance(email, float) and math.isnan(email):
                email = ""
            if isinstance(password, float) and math.isnan(password):
                password = ""
            
            if not email:
                log(f"Row {idx}: Missing required email field, skipping row", error=True)
                error_count += 1
                continue
                
            if not password:
                log(f"Row {idx}: Missing required password field, skipping row", error=True)
                error_count += 1
                continue
            
            # Xử lý trường Date Of Birth - treat as optional
            dob = row.get("Date Of Birth", "")
            # Handle NaN values
            if isinstance(dob, float) and math.isnan(dob):
                dob = ""
                
            date_birth = month_birth = year_birth = ""
            if dob and dob != "nan":  # Explicitly check for "nan" string
                parts = str(dob).split("/")
                if len(parts) == 3:
                    date_birth, month_birth, year_birth = parts
                else:
                    log(f"Row {idx}: Non-standard date format for DOB: '{dob}' (expected DD/MM/YYYY), treating as empty", error=True)

            # Safely convert numeric fields - all are optional
            fields_to_convert = ["Reading", "Listening", "Writing", "Speaking", "Priority"]
            numeric_values = {}
            
            for field in fields_to_convert:
                try:
                    value = row.get(field, "")
                    # Handle NaN values
                    if isinstance(value, float) and math.isnan(value):
                        value = ""
                    # Handle "nan" string values
                    if value == "nan":
                        value = ""
                        
                    numeric_values[field.lower()] = str(int(value)) if value else "0"
                except ValueError:
                    log(f"Row {idx}: Invalid numeric value for {field}: '{row.get(field, '')}', setting to 0", error=True)
                    numeric_values[field.lower()] = "0"
            
            # Calculate sum
            sum_value = sum(int(numeric_values[f.lower()]) for f in fields_to_convert[:-1])  # Exclude Priority from sum

            # Handle possible NaN values in all fields
            family_name = row.get("Family Name", "")
            if isinstance(family_name, float) and math.isnan(family_name):
                family_name = ""
                
            last_name = row.get("Last Name", "")
            if isinstance(last_name, float) and math.isnan(last_name):
                last_name = ""
                
            number_phone = row.get("Number Phone", "")
            if isinstance(number_phone, float) and math.isnan(number_phone):
                number_phone = ""
                
            postal_code = row.get("Postal Code", "")
            if isinstance(postal_code, float) and math.isnan(postal_code):
                postal_code = ""
                
            location = row.get("Location", "")
            if isinstance(location, float) and math.isnan(location):
                location = ""
                
            street_name = row.get("Street Name", "")
            if isinstance(street_name, float) and math.isnan(street_name):
                street_name = ""
                
            place_of_birth = row.get("Place Of Birth", "")
            if isinstance(place_of_birth, float) and math.isnan(place_of_birth):
                place_of_birth = ""

            transformed = {
                "email": email,
                "password": password,
                "family_name": family_name,
                "last_name": last_name,
                "number_phone": number_phone,
                "postal_code": postal_code,
                "location": location,
                "street_name": street_name,
                "place_of_birth": place_of_birth,
                "reading": numeric_values["reading"],
                "listening": numeric_values["listening"],
                "writing": numeric_values["writing"],
                "speaking": numeric_values["speaking"],
                "priority": numeric_values["priority"],
                "sum": str(sum_value),
                "date_birth": date_birth,
                "month_birth": month_birth,
                "year_birth": year_birth
            }
            transformed_rows.append(transformed)
        except Exception as e:
            error_count += 1
            log(f"Row {idx}: Error processing row: {str(e)}", error=True)
            log(f"Row data: {row}", error=True)
    
    log(f"Transformation complete. {len(transformed_rows)} rows processed successfully, {error_count} errors")
    return transformed_rows

def transform_data(data):
    log(f"Applying data normalization to {len(data)} rows")
    result = []
    skipped_count = 0
    
    for idx, row in enumerate(data):
        try:
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
                original = row["number_phone"]
                row["number_phone"] = row["number_phone"].lstrip("0")
                if original != row["number_phone"]:
                    log(f"Row {idx}: Modified phone number from '{original}' to '{row['number_phone']}'")
            
            # Check if postal_code exists and has exactly 5 characters - only validate if provided
            if row.get("postal_code") and len(row.get("postal_code")) != 5:
                log(
                    f"Row {idx}: Non-standard postal code for '{row.get('email', 'unknown')}': "
                    f"'{row.get('postal_code')}' has {len(row.get('postal_code'))} digits instead of 5. "
                    f"Setting to empty value.", 
                    error=True
                )
                row["postal_code"] = ""

            # Only email is required (password should have been checked already)
            if not row.get("email"):
                log(f"Row {idx}: Missing required email field. Skipping row.", error=True)
                skipped_count += 1
                continue

            result.append(row)
        except Exception as e:
            log(f"Row {idx}: Error in data transformation: {str(e)}", error=True)
            skipped_count += 1
    
    log(f"Data normalization complete. {len(result)} rows valid, {skipped_count} rows skipped.")
    return result
    

def remove_diacritics_and_capitalize(s):
    if not s:
        return s
    
    # Loại bỏ dấu và viết hoa chữ cái đầu của từ
    try:
        s_no_diacritics = ''.join(
            c for c in unicodedata.normalize('NFD', s)
            if unicodedata.category(c) != 'Mn'
        )
        return s_no_diacritics.title()
    except Exception as e:
        log(f"Error removing diacritics from '{s}': {str(e)}", error=True)
        return s

def download_file():
    log("Starting data download process")
    
    # Thông tin bảng tính
    spreadsheet_id = "1KuoVm1NIUR0q8GF_xcMmbeg88HdsJsmnVEwoaQIVUZk"
    log(f"Using Google Spreadsheet ID: {spreadsheet_id}")

    # Danh sách các sheet cần tải, mỗi phần tử gồm: (tên_sheet, gid)
    sheets = [
        ("hn_b1","0"),
        ("hn_b2","1807418615"),
        ("hn_a1","1827133648"),
        ("hn_test","1733470159")
    ]
    
    total_success = 0
    total_failed = 0
    
    for sheet_name, gid in sheets:
        log(f"Processing sheet: {sheet_name} (gid={gid})")
        export_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv&gid={gid}"
        
        try:
            log(f"Downloading from URL: {export_url}")
            response = requests.get(export_url)
            response.raise_for_status()  # Kiểm tra lỗi HTTP
            log(f"Download successful, Content-Length: {len(response.content)} bytes")

            content_text = response.content.decode("utf-8")
            log(f"Content decoded, processing CSV data")
            
            # Đọc CSV, giữ nguyên định dạng của Postal Code là string
            df = pd.read_csv(io.StringIO(content_text), dtype={"Postal Code": str,"Number Phone":str})
            
            # Replace NaN values with None so they become None in dict
            df = df.replace({pd.NA: None, float('nan'): None})
            
            if df.empty:
                log(f"Sheet {sheet_name} is empty (0 rows found)", error=True)
                total_failed += 1
                continue
                
            log(f"Loaded {len(df)} rows from sheet {sheet_name}")
            
            if len(df) <= 1:
                log(f"Sheet {sheet_name} has only header row, skipping", error=True)
                total_failed += 1
                continue

            # Chuyển đổi DataFrame thành danh sách dictionary
            log(f"Converting DataFrame to records")
            data = df.to_dict(orient="records")
            log(f"Converted to {len(data)} dictionary records")

            # Tiến hành chuyển đổi dữ liệu
            log(f"Starting data transformation for {sheet_name}")
            data = transform_name_row(data)
            data = transform_data(data)
            
            if not data:
                log(f"No valid data after transformation for {sheet_name}", error=True)
                total_failed += 1
                continue
                
            log(f"Transformation complete, {len(data)} valid records remain")

            # Xác định thư mục lưu dựa vào tên sheet
            if "hcm" in sheet_name.lower():
                target_dir = "./data/user/hcm"
            elif "hn" in sheet_name.lower():
                target_dir = "./data/user/hn"
            else:
                target_dir = "./data/user/other"
                
            log(f"Target directory for {sheet_name}: {target_dir}")
            
            os.makedirs(target_dir, exist_ok=True)  # Tạo thư mục nếu chưa tồn tại
            log(f"Ensured directory exists: {target_dir}")

            file_path = os.path.join(target_dir, f"{sheet_name}.json")
            save_json_file(data, file_path)
            log(f"Successfully saved {len(data)} records to {file_path}")
            total_success += 1
            
        except requests.exceptions.RequestException as e:
            log(f"HTTP/Network error while downloading sheet {sheet_name}: {e.__class__.__name__}: {str(e)}", error=True)
            total_failed += 1
        except pd.errors.EmptyDataError:
            log(f"Empty data error for sheet {sheet_name}: The CSV file appears to be empty", error=True)
            total_failed += 1
        except pd.errors.ParserError:
            log(f"CSV parsing error for sheet {sheet_name}: The file could not be parsed as CSV", error=True)
            total_failed += 1
        except Exception as e:
            log(f"Unexpected error processing sheet {sheet_name}: {e.__class__.__name__}: {str(e)}", error=True)
            import traceback
            log(f"Traceback: {traceback.format_exc()}", error=True)
            total_failed += 1

    log(f"Download process complete. Success: {total_success}, Failed: {total_failed}")
    return total_success, total_failed

if __name__ == "__main__":
    log("=== DOWNLOAD PROCESS STARTED ===")
    try:
        success, failed = download_file()
        log(f"Process finished. Successfully processed {success} sheets, {failed} sheets failed.")
    except Exception as e:
        log(f"Critical error in main process: {str(e)}", error=True)
        import traceback
        log(f"Traceback: {traceback.format_exc()}", error=True)
        sys.exit(1)
    log("=== DOWNLOAD PROCESS COMPLETED ===")
