from flask import Flask, request, render_template, redirect, url_for, send_from_directory
from flask_socketio import SocketIO, emit
import os

app = Flask(__name__)
socketio = SocketIO(app)

# Mappe for opplastede filer
UPLOAD_FOLDER = 'static/uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Handleliste, meldinger, oppgaveliste og bilder
shopping_list = []
messages = []
tasks = []
uploaded_images = []

# Hjelpefunksjon for å sjekke om filen har en tillatt filtype
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Forside som viser meldinger, handleliste, oppgaver og bilder
@app.route('/')
def index():
    return render_template('index.html', messages=messages, shopping_list=shopping_list, tasks=tasks, uploaded_images=uploaded_images)

# WebSocket-hendelse for sanntidsoppdatering
@socketio.on('new_message')
def handle_new_message(data):
    message = data['message']
    messages.append(message)
    emit('message_update', {'message': message}, broadcast=True)

@socketio.on('new_item')
def handle_new_item(data):
    item = data['item']
    shopping_list.append(item)
    emit('shopping_update', {'item': item}, broadcast=True)

@socketio.on('new_task')
def handle_new_task(data):
    task = data['task']
    tasks.append(task)
    emit('task_update', {'task': task}, broadcast=True)

@socketio.on('new_image')
def handle_new_image(data):
    filename = data['filename']
    uploaded_images.append(filename)
    emit('image_update', {'filename': filename}, broadcast=True)

# Rute for å laste opp bilder
@app.route('/upload_image', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return redirect(url_for('index'))
    file = request.files['file']
    if file.filename == '':
        return redirect(url_for('index'))
    if file and allowed_file(file.filename):
        filename = file.filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        socketio.emit('new_image', {'filename': filename})  # Send sanntidsoppdatering
    return redirect(url_for('index'))

# Rute for å vise opplastede bilder
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Start SocketIO-serveren
if __name__ == '__main__':
    socketio.run(app, debug=True)
