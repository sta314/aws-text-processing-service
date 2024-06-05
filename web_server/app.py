from flask import Flask, render_template, url_for, jsonify, session, request
from werkzeug.utils import secure_filename
import os
import requests
import json
import threading
import uuid
import base64
import ast 
from datetime import datetime, timedelta

job_contents = {}
job_data = []
file_content_data = {}
users_credential_list = []

### Defining API Endpoints

SIGNUP_API_ENDPOINT = 'https://t3ldb8ed71.execute-api.us-east-1.amazonaws.com/dev/auth/signup'
LOGIN_API_ENDPOINT = 'https://t3ldb8ed71.execute-api.us-east-1.amazonaws.com/dev/auth/login'
IMAGE_API_ENDPOINT = 'https://t3ldb8ed71.execute-api.us-east-1.amazonaws.com/dev/data'
PROCESS_API_ENDPOINT = 'https://t3ldb8ed71.execute-api.us-east-1.amazonaws.com/dev/process'
USER_JOBS_API_ENDPOINT = 'https://t3ldb8ed71.execute-api.us-east-1.amazonaws.com/dev/jobs'

###

app = Flask(__name__)

app.secret_key = 'ncv)ir&qludh=@e1-n4j)_jpf4u@xirqdq*p5$xrh321ncotr0'

app.config['UPLOAD_FOLDER'] = 'upload_dir'

@app.route('/')
def get_main_html():
    return render_template('index.html')

# Upload data APIs

@app.route('/upload', methods=['POST'])
def upload_file():
    prompt = request.form.get('prompt')

    uniq_id = str(uuid.uuid4())

    def upload_text(text, prompt, uniq_id, settings):
        process_body = {
            "body": {
                "text": text,
                "prompt": prompt,
                "batch_id": uniq_id,
                "settings": settings
            }
        }
        
        def send_req(process_api_endpoint, headers, process_body):
            requests.post(
                process_api_endpoint,
                headers=headers,
                json=process_body
        )

        thread = threading.Thread(target=send_req, args=(PROCESS_API_ENDPOINT, {"Content-Type": "application/json", "Authorization": f"Bearer {session['access_token']}"}, process_body))
        thread.start()

    def upload_image(encoded_image, prompt, uniq_id, settings):
        data_body = {
            "body": {
                "image": encoded_image,
                "prompt": prompt,
                "batch_id": uniq_id,
                "settings": settings
            }
        }

        def send_req(image_api_endpoint, headers, data_body):
            image_response = requests.put(
                image_api_endpoint,
                headers=headers,
                json=data_body
            )

        thread = threading.Thread(target=send_req, args=(IMAGE_API_ENDPOINT, {"Content-Type": "application/json", "Authorization": f"Bearer {session['access_token']}"}, data_body))
        thread.start()

    settings = {
        "max_tokens": 2000,
        "temperature": 0
    }
    
    if 'file' in request.files:
        encoded_image = base64.b64encode(request.files.getlist('file')[0].read()).decode()
        upload_image(encoded_image, prompt, uniq_id, settings)
        return 'File uploaded successfully'
    
    elif 'files' in request.files:
        files = request.files.getlist('files')
        for file in files:
            filename = secure_filename(file.filename)
            if 'txt' in filename:
                text = file.read().decode('utf-8')
                upload_text(text, prompt, uniq_id, settings)
            else:
                encoded_image = base64.b64encode(file.read()).decode()
                upload_image(encoded_image, prompt, uniq_id, settings)
        return 'Files uploaded successfully'

    elif 'text' in request.form:
        text = request.form.get('text')
        upload_text(text, prompt, uniq_id, settings)
        return 'Text uploaded successfully'
    else:
        return 'No file part in the request', 400
 
# Information request APIs

@app.route('/api/libraryData', methods=['GET'])
def get_library_data():

    global job_contents

    user_jobs_response = requests.get(
        USER_JOBS_API_ENDPOINT,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {session['access_token']}"}
    )

    library_contents = ast.literal_eval(json.loads(user_jobs_response.text)['body'])

    first_fields_set = set([content[0] for content in library_contents])
    job_contents = {}
    for field in list(first_fields_set):
        job_contents[field] = []

    for content in library_contents:
        job_contents[content[0]].append((content[1], content[2]))

    library_data = []

    date_format = "%d/%m/%Y %H:%M:%S"

    first_fields_list = sorted(list(first_fields_set), key=lambda field: datetime.strptime(job_contents[field][0][1], date_format))[::-1]

    for field in first_fields_list:
        jobtype = "Single job" if len(job_contents[field]) == 1 else "Batch job"
        jobid = field
        time = datetime.strptime(job_contents[field][0][1], date_format) + timedelta(hours=3)
        submittime = time.strftime(date_format)
        state1 = "Processed"
        state2 = "Completed"

        new_date = time + timedelta(days=2)
        expirationtime = new_date.strftime(date_format)

        time_difference = (new_date - datetime.now() - timedelta(hours=3)).total_seconds()
        days = time_difference // (24 * 3600)
        hours = (time_difference % (24 * 3600)) // 3600
        minutes = (time_difference // 60) % 60

        if days >= 1:
            expirationleft = f'Expires after {int(days)} days {int(hours)} hr {int(minutes)} min'
        else:
            expirationleft = f'Expires after {int(hours)} hr {int(minutes)} min'

        library_data.append({"jobtype": jobtype, "jobid": jobid, "submittime": submittime, "state1": state1, "state2": state2, "expirationtime": expirationtime, "expirationleft":expirationleft})

    return jsonify(library_data)

@app.route('/api/jobData/<job_id>', methods=['GET'])
def get_job_data(job_id):
    job_list = job_contents[job_id]
    job_data = []
    for i, job in enumerate(job_list):
        job_data.append({"fileid": job[0], "filetype": "txt", "filename": f'{i+1}', "filestate": "success"})
    return jsonify(job_data)

@app.route('/api/fileContentData/<file_id>/<file_name>/<type>', methods=['GET'])
def get_file_content_data(file_id, file_name, type):
    file_content_body = {
        "body": {
            "job_id": file_id,
            "type": type # text, result
        }
    }
    
    file_content_response = requests.get(
        PROCESS_API_ENDPOINT,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {session['access_token']}"},
        json=file_content_body
    )

    file_content_data = {
        "name": file_name,
        "processtype": "Original" if type == 'text' else "Result",
        "text": (json.loads(file_content_response.text)['body'])
    }
    return jsonify(file_content_data)

# Authentication APIs

@app.route('/register', methods=['POST'])
def register():
    username = request.form['username']
    password = request.form['password']
    email = request.form['email']

    signup_body = {
        "body": {
            "username": username,
            "password": password,
            "email": email
        }
    }

    signup_response = requests.post(SIGNUP_API_ENDPOINT, json=signup_body)
    status_code = int(signup_response.json()['statusCode'])

    if status_code == 200:
        return jsonify({'message': 'User registered successfully'})
    else:
        return jsonify({'error': f'{str(signup_response.json()['body'])}'})

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    login_body = {
        "body": {
            "username": username,
            "password": password
        }
    }

    login_response = requests.post(LOGIN_API_ENDPOINT, json=login_body)
    status_code = int(login_response.json()['statusCode'])

    if status_code == 200:
        session['username'] = username
        session['access_token'] = json.loads(login_response.json()['body'])['tokens']['IdToken']
        return jsonify({'message': 'User logged in successfully'})
    else:
        return jsonify({'error': f'{str(login_response.json()['body'].split('operation:')[-1][:-2])}'})

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'User logged out successfully'})


if __name__ == '__main__':
    app.run(port=5000, debug=True)