from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

modelPath = 'travel_mode_classifier.pkl'
travelModeClassifier = None

if os.path.exists(modelPath):
    with open(modelPath, 'rb') as modelFile:
        travelModeClassifier = pickle.load(modelFile)

@app.route('/predict', methods=['POST'])
def predictTravelMode():
    if travelModeClassifier is None:
        return jsonify({'error': 'Model not found'}), 500

    inputData = request.get_json()

    featureDataFrame = pd.DataFrame([{
        'avg_speed': inputData.get('avg_speed', 0),
        'max_speed': inputData.get('max_speed', 0),
        'duration': inputData.get('duration', 0),
        'stops': inputData.get('stops', 0)
    }])

    predictedMode = travelModeClassifier.predict(featureDataFrame)[0]
    confidenceScores = travelModeClassifier.predict_proba(featureDataFrame)[0]
    maxConfidence = round(float(max(confidenceScores)) * 100, 1)

    return jsonify({
        'predictedMode': predictedMode,
        'confidence': maxConfidence
    })

@app.route('/health', methods=['GET'])
def checkServiceHealth():
    return jsonify({'status': 'AI Service is active'})

if __name__ == '__main__':
    app.run(port=8000)
