from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import os
import time

app = Flask(__name__)
CORS(app)

MODEL_PATH = 'travel_mode_classifier.pkl'
travelModeClassifier = None
modelLoadedAt = None

# ── Load model on startup ──────────────────────────────────────────────────────
def loadModel():
    global travelModeClassifier, modelLoadedAt
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, 'rb') as f:
            travelModeClassifier = pickle.load(f)
        modelLoadedAt = time.strftime('%Y-%m-%d %H:%M:%S')
        print(f'[AI] Model loaded: {MODEL_PATH}')
    else:
        print(f'[AI] WARNING: Model file not found at {MODEL_PATH}. Run model_trainer.py first.')

loadModel()

# ── Health check ───────────────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def checkHealth():
    return jsonify({
        'status': 'ok',
        'modelLoaded': travelModeClassifier is not None,
        'modelFile': MODEL_PATH,
        'loadedAt': modelLoadedAt,
        'supportedModes': ['Walking', 'Cycling', 'Auto-Rickshaw', 'Bus', 'Car', 'Train', 'Ferry']
    })

# ── Test endpoint with example inputs ─────────────────────────────────────────
@app.route('/test', methods=['GET'])
def testPredictions():
    if travelModeClassifier is None:
        return jsonify({'error': 'Model not loaded. Run model_trainer.py first.'}), 500

    testCases = [
        {'label': 'Slow walk',         'avg_speed': 3.5,  'max_speed': 5.0,   'duration': 900,   'stops': 0},
        {'label': 'Bicycle ride',       'avg_speed': 12.0, 'max_speed': 20.0,  'duration': 1200,  'stops': 1},
        {'label': 'Auto-rickshaw trip', 'avg_speed': 20.0, 'max_speed': 35.0,  'duration': 900,   'stops': 5},
        {'label': 'City bus journey',   'avg_speed': 18.0, 'max_speed': 55.0,  'duration': 3600,  'stops': 22},
        {'label': 'Car drive',          'avg_speed': 45.0, 'max_speed': 85.0,  'duration': 1800,  'stops': 3},
        {'label': 'Train journey',      'avg_speed': 65.0, 'max_speed': 110.0, 'duration': 7200,  'stops': 4},
        {'label': 'Ferry crossing',     'avg_speed': 18.0, 'max_speed': 28.0,  'duration': 2700,  'stops': 0},
    ]

    results = []
    for tc in testCases:
        df = pd.DataFrame([{
            'avg_speed': tc['avg_speed'],
            'max_speed': tc['max_speed'],
            'duration':  tc['duration'],
            'stops':     tc['stops']
        }])
        predicted  = travelModeClassifier.predict(df)[0]
        proba      = travelModeClassifier.predict_proba(df)[0]
        confidence = round(float(max(proba)) * 100, 1)
        results.append({
            'testCase':   tc['label'],
            'predicted':  predicted,
            'confidence': confidence,
            'correct':    predicted in tc['label'] or tc['label'].lower().startswith(predicted.lower()[:4])
        })

    return jsonify({'status': 'ok', 'tests': results})

# ── Prediction endpoint ────────────────────────────────────────────────────────
@app.route('/predict', methods=['POST'])
def predictTravelMode():
    if travelModeClassifier is None:
        # Fallback heuristic when model is missing
        data = request.get_json() or {}
        avg = data.get('avg_speed', 0)
        if avg < 6:      mode = 'Walking'
        elif avg < 18:   mode = 'Cycling'
        elif avg < 30:   mode = 'Auto-Rickshaw'
        elif avg < 55:   mode = 'Bus'
        elif avg < 90:   mode = 'Car'
        else:            mode = 'Train'
        return jsonify({'predictedMode': mode, 'confidence': 60.0, 'source': 'heuristic'})

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON body provided'}), 400

    df = pd.DataFrame([{
        'avg_speed': data.get('avg_speed', 0),
        'max_speed': data.get('max_speed', 0),
        'duration':  data.get('duration',  0),
        'stops':     data.get('stops',     0)
    }])

    predicted  = travelModeClassifier.predict(df)[0]
    proba      = travelModeClassifier.predict_proba(df)[0]
    confidence = round(float(max(proba)) * 100, 1)

    return jsonify({
        'predictedMode': predicted,
        'confidence':    confidence,
        'source':        'model'
    })

# ── Reload model without restarting ───────────────────────────────────────────
@app.route('/reload', methods=['POST'])
def reloadModel():
    loadModel()
    return jsonify({
        'status': 'reloaded' if travelModeClassifier else 'failed',
        'modelLoaded': travelModeClassifier is not None
    })

if __name__ == '__main__':
    app.run(port=8000, debug=False)
