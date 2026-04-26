"""
Routelytics — Travel Mode Classifier Trainer
=============================================
Trains a Random Forest classifier on synthetic trip data
calibrated to Kerala transport characteristics.

Features used:
  avg_speed   — average speed in km/h
  max_speed   — maximum speed in km/h
  duration    — trip duration in seconds
  stops       — estimated number of GPS stop-points

Modes: Walking, Cycling, Auto-Rickshaw, Bus, Car, Train, Ferry

Run:
  python model_trainer.py
  
Output:
  travel_mode_classifier.pkl  (loaded by app.py automatically)
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import pickle
import time

# ─── Kerala-calibrated synthetic data ────────────────────────────────────────

def generateSyntheticData(samplesPerClass=3000, seed=42):
    np.random.seed(seed)
    records = []

    # ── Walking (2–6 km/h) ──
    for _ in range(samplesPerClass):
        avg = np.random.uniform(2.0, 5.5)
        mx  = np.random.uniform(avg, min(avg * 1.4, 7.0))
        dur = np.random.uniform(120, 3600)       # 2 min – 1 hr
        stp = np.random.randint(0, 3)
        records.append([avg, mx, dur, stp, 'Walking'])

    # ── Cycling (8–20 km/h) ──
    for _ in range(samplesPerClass):
        avg = np.random.uniform(8.0, 18.0)
        mx  = np.random.uniform(avg, min(avg * 1.5, 28.0))
        dur = np.random.uniform(300, 5400)       # 5 min – 1.5 hr
        stp = np.random.randint(0, 5)
        records.append([avg, mx, dur, stp, 'Cycling'])

    # ── Auto-Rickshaw (15–30 km/h in city) ──
    for _ in range(samplesPerClass):
        avg = np.random.uniform(14.0, 30.0)
        mx  = np.random.uniform(25.0, 55.0)
        dur = np.random.uniform(300, 3600)       # 5 min – 1 hr
        stp = np.random.randint(3, 18)           # frequent stops at junctions
        records.append([avg, mx, dur, stp, 'Auto-Rickshaw'])

    # ── Bus (Kerala KSRTC — many stops, moderate speed) ──
    for _ in range(samplesPerClass):
        avg = np.random.uniform(12.0, 32.0)
        mx  = np.random.uniform(40.0, 75.0)
        dur = np.random.uniform(900, 14400)      # 15 min – 4 hr
        stp = np.random.randint(12, 60)          # many bus stops
        records.append([avg, mx, dur, stp, 'Bus'])

    # ── Car (city + highway mix) ──
    for _ in range(samplesPerClass):
        avg = np.random.uniform(25.0, 75.0)
        mx  = np.random.uniform(50.0, 130.0)
        dur = np.random.uniform(300, 14400)      # 5 min – 4 hr
        stp = np.random.randint(1, 20)
        records.append([avg, mx, dur, stp, 'Car'])

    # ── Train (Kerala railways — higher sustained speed) ──
    for _ in range(samplesPerClass):
        avg = np.random.uniform(45.0, 95.0)
        mx  = np.random.uniform(80.0, 140.0)
        dur = np.random.uniform(1800, 18000)     # 30 min – 5 hr
        stp = np.random.randint(1, 10)           # few stops
        records.append([avg, mx, dur, stp, 'Train'])

    # ── Ferry (Vembanad, Ashtamudi — slow water transport) ──
    for _ in range(samplesPerClass):
        avg = np.random.uniform(10.0, 22.0)
        mx  = np.random.uniform(18.0, 32.0)
        dur = np.random.uniform(600, 7200)       # 10 min – 2 hr
        stp = np.random.randint(0, 3)            # almost no stops mid-water
        records.append([avg, mx, dur, stp, 'Ferry'])

    df = pd.DataFrame(records, columns=['avg_speed', 'max_speed', 'duration', 'stops', 'mode'])

    # Add a small amount of noise to make the model more robust
    df['avg_speed'] += np.random.normal(0, 0.5, len(df))
    df['max_speed'] += np.random.normal(0, 1.0, len(df))
    df['avg_speed'] = df['avg_speed'].clip(lower=0)
    df['max_speed'] = df['max_speed'].clip(lower=0)

    return df


# ─── Train ────────────────────────────────────────────────────────────────────

def trainAndSaveModel():
    print('=' * 55)
    print('  Routelytics — Travel Mode Classifier Training')
    print('=' * 55)

    print('\n[1] Generating synthetic Kerala training data...')
    df = generateSyntheticData(samplesPerClass=3000)
    print(f'    Total records: {len(df):,}')
    print(f'    Class distribution:\n{df["mode"].value_counts().to_string()}')

    X = df[['avg_speed', 'max_speed', 'duration', 'stops']]
    y = df['mode']

    print('\n[2] Splitting into train / test sets (80/20)...')
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print(f'    Train: {len(X_train):,}  |  Test: {len(X_test):,}')

    print('\n[3] Training Random Forest (300 trees)...')
    t0 = time.time()
    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=25,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1       # use all CPU cores
    )
    model.fit(X_train, y_train)
    elapsed = time.time() - t0
    print(f'    Training time: {elapsed:.1f}s')

    print('\n[4] Evaluating on held-out test set...')
    train_acc = model.score(X_train, y_train)
    test_acc  = model.score(X_test,  y_test)
    print(f'    Train accuracy : {train_acc * 100:.2f}%')
    print(f'    Test  accuracy : {test_acc  * 100:.2f}%')

    print('\n[5] Per-class report:')
    y_pred = model.predict(X_test)
    print(classification_report(y_test, y_pred, target_names=model.classes_))

    print('\n[6] Feature importances:')
    feats = ['avg_speed', 'max_speed', 'duration', 'stops']
    for feat, imp in sorted(zip(feats, model.feature_importances_), key=lambda x: -x[1]):
        bar = '█' * int(imp * 40)
        print(f'    {feat:<14} {imp:.4f}  {bar}')

    print('\n[7] Saving model...')
    out = 'travel_mode_classifier.pkl'
    with open(out, 'wb') as f:
        pickle.dump(model, f)
    import os
    size_kb = os.path.getsize(out) / 1024
    print(f'    Saved → {out}  ({size_kb:.0f} KB)')

    print('\n✅ Done! Restart app.py (or POST /reload) to use the new model.\n')
    return model


if __name__ == '__main__':
    trainAndSaveModel()
