from flask import Flask, jsonify
import subprocess

app = Flask(__name__)

@app.route('/user', methods=['GET'])
def run_python_script():
    try:
        result = subprocess.run(
            ['python', './download_file.py'], 
            capture_output=True, text=True, check=True
        )

        # Chia từng dòng output thành danh sách JSON
        output_lines = result.stdout.strip().split("\n")

        return jsonify({"output": output_lines})
    except subprocess.CalledProcessError as e:
        return jsonify({"error": e.stderr.strip().split("\n")}), 500

