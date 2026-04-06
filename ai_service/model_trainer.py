import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import pickle

def generateSyntheticData():
    dataRecords = []

    for _ in range(2000):
        avgSpeed = np.random.uniform(2, 5.5)
        maxSpeed = np.random.uniform(4, 7)
        duration = np.random.uniform(300, 2400)
        stops = np.random.randint(0, 2)
        dataRecords.append([avgSpeed, maxSpeed, duration, stops, 'Walking'])

    for _ in range(2000):
        avgSpeed = np.random.uniform(8, 16)
        maxSpeed = np.random.uniform(14, 24)
        duration = np.random.uniform(600, 3600)
        stops = np.random.randint(0, 4)
        dataRecords.append([avgSpeed, maxSpeed, duration, stops, 'Cycling'])

    for _ in range(2000):
        avgSpeed = np.random.uniform(16, 25)
        maxSpeed = np.random.uniform(28, 45)
        duration = np.random.uniform(300, 3600)
        stops = np.random.randint(3, 15)
        dataRecords.append([avgSpeed, maxSpeed, duration, stops, 'Auto-Rickshaw'])

    for _ in range(2000):
        avgSpeed = np.random.uniform(12, 28)
        maxSpeed = np.random.uniform(35, 65)
        duration = np.random.uniform(1200, 10800)
        stops = np.random.randint(10, 45)
        dataRecords.append([avgSpeed, maxSpeed, duration, stops, 'Bus'])

    for _ in range(2000):
        avgSpeed = np.random.uniform(30, 70)
        maxSpeed = np.random.uniform(60, 120)
        duration = np.random.uniform(600, 7200)
        stops = np.random.randint(2, 15)
        dataRecords.append([avgSpeed, maxSpeed, duration, stops, 'Car'])

    for _ in range(2000):
        avgSpeed = np.random.uniform(40, 90)
        maxSpeed = np.random.uniform(70, 130)
        duration = np.random.uniform(1800, 14400)
        stops = np.random.randint(1, 6)
        dataRecords.append([avgSpeed, maxSpeed, duration, stops, 'Train'])

    return pd.DataFrame(dataRecords, columns=['avg_speed', 'max_speed', 'duration', 'stops', 'mode'])

def trainAndSaveModel():
    trainingData = generateSyntheticData()
    inputFeatures = trainingData[['avg_speed', 'max_speed', 'duration', 'stops']]
    targetLabels = trainingData['mode']

    classifierModel = RandomForestClassifier(n_estimators=200, random_state=42, max_depth=20)
    classifierModel.fit(inputFeatures, targetLabels)

    score = classifierModel.score(inputFeatures, targetLabels)
    print(f"Training accuracy: {score * 100:.2f}%")

    with open('travel_mode_classifier.pkl', 'wb') as modelFile:
        pickle.dump(classifierModel, modelFile)

    print("Model saved as travel_mode_classifier.pkl")

if __name__ == "__main__":
    trainAndSaveModel()
