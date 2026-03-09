from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
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
    
    averageTravelSpeed = inputData.get('avg_speed')
    maximumTravelSpeed = inputData.get('max_speed')
    totalTripDuration = inputData.get('duration')
    numberOfStops = inputData.get('stops')
    
    featureVector = np.array([[averageTravelSpeed, maximumTravelSpeed, totalTripDuration, numberOfStops]])
    predictedMode = travelModeClassifier.predict(featureVector)[0]
    
    return jsonify({
        'predictedMode': predictedMode
    })

@app.route('/health', methods=['GET'])
def checkServiceHealth():
    return jsonify({'status': 'AI Service is active'})

if __name__ == '__main__':
    app.run(port=8000)
