import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import pickle
import os

def generateSyntheticData():
    travelModes = ['Walking', 'Cycling', 'Car', 'Bus', 'Auto-Rickshaw']
    
    dataRecords = []
    
    for _ in range(1000):
        mode = np.random.choice(travelModes)
        
        if mode == 'Walking':
            avgSpeed = np.random.uniform(3, 6)
            maxSpeed = np.random.uniform(6, 8)
            duration = np.random.uniform(300, 1800)
            stops = np.random.randint(0, 3)
        elif mode == 'Cycling':
            avgSpeed = np.random.uniform(10, 15)
            maxSpeed = np.random.uniform(15, 25)
            duration = np.random.uniform(600, 3600)
            stops = np.random.randint(0, 5)
        elif mode == 'Car':
            avgSpeed = np.random.uniform(30, 60)
            maxSpeed = np.random.uniform(60, 100)
            duration = np.random.uniform(900, 7200)
            stops = np.random.randint(5, 20)
        elif mode == 'Bus':
            avgSpeed = np.random.uniform(15, 30)
            maxSpeed = np.random.uniform(40, 70)
            duration = np.random.uniform(1200, 10800)
            stops = np.random.randint(10, 40)
        else: # Auto-Rickshaw
            avgSpeed = np.random.uniform(18, 25)
            maxSpeed = np.random.uniform(30, 45)
            duration = np.random.uniform(600, 3600)
            stops = np.random.randint(5, 15)
            
        dataRecords.append([avgSpeed, maxSpeed, duration, stops, mode])
        
    return pd.DataFrame(dataRecords, columns=['avg_speed', 'max_speed', 'duration', 'stops', 'mode'])

def trainAndSaveModel():
    trainingData = generateSyntheticData()
    inputFeatures = trainingData.drop('mode', axis=1)
    targetLabels = trainingData['mode']
    
    classifierModel = RandomForestClassifier(n_estimators=100, random_state=42)
    classifierModel.fit(inputFeatures, targetLabels)
    
    with open('travel_mode_classifier.pkl', 'wb') as modelFile:
        pickle.dump(classifierModel, modelFile)

if __name__ == "__main__":
    trainAndSaveModel()
