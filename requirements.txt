import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

RANDOM_STATE = 42
TARGET_COL = 'Diagnosis'
DROP_COLS = ['PatientID', 'DoctorInCharge']

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / 'data' / 'alzheimers_disease_data.csv'
MODEL_PATH = BASE_DIR / 'alzheimers_model.pkl'
METADATA_PATH = BASE_DIR / 'model_metadata.json'
QUIZ_PATH = BASE_DIR / 'quiz_weights.json'

FEATURE_LABELS = {
    'Age': 'Age (years)',
    'Gender': 'Gender',
    'Ethnicity': 'Ethnicity',
    'EducationLevel': 'Highest education level',
    'BMI': 'Body Mass Index',
    'Smoking': 'Do you smoke?',
    'AlcoholConsumption': 'Weekly alcohol units',
    'PhysicalActivity': 'Weekly exercise hours',
    'DietQuality': 'Diet quality (0–10)',
    'SleepQuality': 'Sleep quality (4–10)',
    'FamilyHistoryAlzheimers': "Family history of Alzheimer's?",
    'CardiovascularDisease': 'Cardiovascular disease?',
    'Diabetes': 'Diabetes?',
    'Depression': 'Depression?',
    'HeadInjury': 'History of head injury?',
    'Hypertension': 'Hypertension?',
    'SystolicBP': 'Systolic blood pressure (mmHg)',
    'DiastolicBP': 'Diastolic blood pressure (mmHg)',
    'CholesterolTotal': 'Total cholesterol (mg/dL)',
    'CholesterolLDL': 'LDL cholesterol (mg/dL)',
    'CholesterolHDL': 'HDL cholesterol (mg/dL)',
    'CholesterolTriglycerides': 'Triglycerides (mg/dL)',
    'MMSE': 'MMSE score (0–30)',
    'FunctionalAssessment': 'Functional assessment score (0–10)',
    'MemoryComplaints': 'Memory complaints?',
    'BehavioralProblems': 'Behavioural problems?',
    'ADL': 'Activities of Daily Living score (0–10)',
    'Confusion': 'Confusion episodes?',
    'Disorientation': 'Disorientation?',
    'PersonalityChanges': 'Personality changes?',
    'DifficultyCompletingTasks': 'Difficulty completing tasks?',
    'Forgetfulness': 'Forgetfulness?',
    'CanRecallDate': 'Can you recall today\'s date, day, and where you are?',
    'CanRecallWords': 'Can you remember 3 objects after a few minutes?',
    'DifficultyFollowing': 'Difficulty following conversations?',
    'GetsLost': 'Gets lost in familiar places?',
    'TroubleWriting': 'Trouble writing or signing name?',
    'ManagesFinances': 'Can manage finances and bills?',
    'CanTravel': 'Can travel independently?',
    'CanCookMeals': 'Can prepare meals?',
    'ManagesMeds': 'Can take medication correctly?',
    'ManagesHousehold': 'Can manage household tasks?',
    'CanBathe': 'Can bathe independently?',
    'CanDress': 'Can dress independently?',
    'CanEat': 'Can eat independently?',
    'CanToilet': 'Can use the toilet independently?',
    'CanWalk': 'Can walk independently?',
}

BINARY_YN = {
    'Smoking', 'FamilyHistoryAlzheimers', 'CardiovascularDisease', 'Diabetes',
    'Depression', 'HeadInjury', 'Hypertension', 'MemoryComplaints',
    'BehavioralProblems', 'Confusion', 'Disorientation', 'PersonalityChanges',
    'DifficultyCompletingTasks', 'Forgetfulness', 'CanRecallDate',
    'CanRecallWords', 'ManagesFinances', 'CanTravel', 'CanCookMeals',
    'ManagesMeds', 'ManagesHousehold', 'CanBathe', 'CanDress', 'CanEat',
    'CanToilet', 'CanWalk', 'DifficultyFollowing', 'GetsLost', 'TroubleWriting'
}

CATEGORICAL_MAPS = {
    'Gender': [
        {'label': 'Male', 'value': 0},
        {'label': 'Female', 'value': 1},
    ],
    'Ethnicity': [
        {'label': 'Chinese', 'value': 0},
        {'label': 'Malay', 'value': 1},
        {'label': 'Indian', 'value': 2},
        {'label': 'Other', 'value': 3},
    ],
    'EducationLevel': [
        {'label': 'No formal education', 'value': 0},
        {'label': 'Primary / Secondary', 'value': 1},
        {'label': 'Diploma / Bachelor\'s', 'value': 2},
        {'label': 'University & above', 'value': 3},
    ],
}

DEFAULT_FORM_VALUES = {
    'Age': 68,
    'Gender': 0,
    'Ethnicity': 0,
    'EducationLevel': 1,
    'BMI': 24,
    'Smoking': 0,
    'AlcoholConsumption': 2,
    'PhysicalActivity': 4,
    'DietQuality': 6,
    'SleepQuality': 6,
    'FamilyHistoryAlzheimers': 0,
    'CardiovascularDisease': 0,
    'Diabetes': 0,
    'Depression': 0,
    'HeadInjury': 0,
    'Hypertension': 0,
    'SystolicBP': 125,
    'DiastolicBP': 80,
    'CholesterolTotal': 200,
    'CholesterolLDL': 120,
    'CholesterolHDL': 55,
    'CholesterolTriglycerides': 150,
    'MemoryComplaints': 0,
    'BehavioralProblems': 0,
    'Confusion': 0,
    'Disorientation': 0,
    'PersonalityChanges': 0,
    'DifficultyCompletingTasks': 0,
    'Forgetfulness': 0,
    'CanRecallDate': 1,
    'CanRecallWords': 1,
    'DifficultyFollowing': 0,
    'GetsLost': 0,
    'TroubleWriting': 0,
    'ManagesFinances': 1,
    'CanTravel': 1,
    'CanCookMeals': 1,
    'ManagesMeds': 1,
    'ManagesHousehold': 1,
    'CanBathe': 1,
    'CanDress': 1,
    'CanEat': 1,
    'CanToilet': 1,
    'CanWalk': 1,
}

RANGES = {
    'Age': (60, 90), 'BMI': (15, 40),
    'AlcoholConsumption': (0, 20), 'PhysicalActivity': (0, 10),
    'DietQuality': (0, 10), 'SleepQuality': (4, 10),
    'SystolicBP': (90, 180), 'DiastolicBP': (60, 120),
    'CholesterolTotal': (150, 300), 'CholesterolLDL': (50, 200),
    'CholesterolHDL': (20, 100), 'CholesterolTriglycerides': (50, 400),
    'MMSE': (0, 30), 'FunctionalAssessment': (0, 10), 'ADL': (0, 10),
    'CognitiveDecline': (0, 300), 'SelfReportedCognition': (0, 7),
    'LifestyleScore': (4, 30), 'CardioRisk': (0, 3),
}

LOW_IS_BAD = {
    'MMSE', 'FunctionalAssessment', 'ADL', 'PhysicalActivity', 'DietQuality',
    'SleepQuality', 'CholesterolHDL', 'EducationLevel', 'CanRecallDate',
    'CanRecallWords', 'ManagesFinances', 'CanTravel', 'CanCookMeals',
    'ManagesMeds', 'ManagesHousehold', 'CanBathe', 'CanDress', 'CanEat',
    'CanToilet', 'CanWalk'
}


def load_data(path: Path = DATASET_PATH) -> pd.DataFrame:
    return pd.read_csv(path)


def preprocess(df: pd.DataFrame):
    df = df.drop(columns=DROP_COLS, errors='ignore')
    X = df.drop(columns=[TARGET_COL]).copy()
    y = df[TARGET_COL].copy()
    X = X.fillna(X.median(numeric_only=True))
    X = add_engineered_features(X)
    return X, y, X.columns.tolist()


def add_engineered_features(X: pd.DataFrame) -> pd.DataFrame:
    X = X.copy()
    X['CognitiveDecline'] = X['MMSE'] * X['FunctionalAssessment']
    X['SelfReportedCognition'] = X[[
        'MemoryComplaints', 'BehavioralProblems', 'Confusion', 'Forgetfulness',
        'Disorientation', 'PersonalityChanges', 'DifficultyCompletingTasks'
    ]].sum(axis=1)
    X['LifestyleScore'] = X['PhysicalActivity'] + X['DietQuality'] + X['SleepQuality']
    X['CardioRisk'] = X['Hypertension'] + X['Diabetes'] + X['CardiovascularDisease']
    return X


def _infer_type(feature: str) -> str:
    if feature in BINARY_YN:
        return 'binary'
    if feature in CATEGORICAL_MAPS:
        return 'categorical'
    return 'numeric'


def _infer_options(feature: str):
    if feature in CATEGORICAL_MAPS:
        return CATEGORICAL_MAPS[feature]
    if feature in BINARY_YN:
        return [{'label': 'No', 'value': 0}, {'label': 'Yes', 'value': 1}]
    return []


def train_and_export():
    df = load_data()
    X, y, feature_names = preprocess(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    candidates = {
        'RandomForest': Pipeline([
            ('scaler', StandardScaler()),
            ('clf', RandomForestClassifier(
                n_estimators=300, class_weight='balanced', random_state=RANDOM_STATE
            ))
        ]),
        'GradientBoosting': Pipeline([
            ('scaler', StandardScaler()),
            ('clf', GradientBoostingClassifier(
                n_estimators=200, learning_rate=0.05, max_depth=4, random_state=RANDOM_STATE
            ))
        ]),
        'LogisticRegression': Pipeline([
            ('scaler', StandardScaler()),
            ('clf', LogisticRegression(
                max_iter=1000, class_weight='balanced', C=0.5, random_state=RANDOM_STATE
            ))
        ]),
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    best_name, best_score, best_pipe = None, -1.0, None
    scores_out = {}
    for name, pipe in candidates.items():
        scores = cross_val_score(pipe, X_train, y_train, cv=cv, scoring='roc_auc', n_jobs=1)
        scores_out[name] = {'mean_auc': float(scores.mean()), 'std_auc': float(scores.std())}
        if float(scores.mean()) > best_score:
            best_name, best_score, best_pipe = name, float(scores.mean()), pipe

    best_pipe.fit(X_train, y_train)
    calibrated = CalibratedClassifierCV(best_pipe, method='isotonic', cv=2)
    calibrated.fit(X_train, y_train)

    test_probs = calibrated.predict_proba(X_test)[:, 1]
    test_auc = float(roc_auc_score(y_test, test_probs))

    joblib.dump(calibrated, MODEL_PATH)

    quiz_features = [
        'Age', 'FamilyHistoryAlzheimers', 'MemoryComplaints', 'Forgetfulness',
        'Confusion', 'Disorientation', 'DifficultyCompletingTasks', 'CanRecallDate',
        'CanRecallWords', 'DifficultyFollowing', 'GetsLost', 'ManagesFinances',
        'ManagesMeds', 'CanTravel', 'PhysicalActivity'
    ]
    quiz_weights = []
    weight = round(100 / len(quiz_features), 2)
    for feat in quiz_features:
        quiz_weights.append({
            'feature': feat,
            'label': FEATURE_LABELS.get(feat, feat),
            'weight': weight,
            'type': _infer_type(feat),
            'options': _infer_options(feat),
        })
    QUIZ_PATH.write_text(json.dumps(quiz_weights, indent=2), encoding='utf-8')

    metadata = {
        'feature_names': feature_names,
        'cv_scores': scores_out,
        'best_model': best_name,
        'best_cv_auc': best_score,
        'test_auc': test_auc,
        'dataset_rows': int(len(df)),
        'dataset_columns': int(df.shape[1]),
        'positive_rate': float(df[TARGET_COL].mean()),
        'default_form_values': DEFAULT_FORM_VALUES,
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding='utf-8')
    return metadata, quiz_weights


def ensure_artifacts():
    if MODEL_PATH.exists() and METADATA_PATH.exists() and QUIZ_PATH.exists():
        metadata = json.loads(METADATA_PATH.read_text(encoding='utf-8'))
        quiz_weights = json.loads(QUIZ_PATH.read_text(encoding='utf-8'))
        return metadata, quiz_weights
    return train_and_export()


def approximate_clinical_scores(answers: dict) -> dict:
    answers = {**DEFAULT_FORM_VALUES, **answers}
    mmse = 4
    mmse += answers.get('CanRecallDate', 0) * 8
    mmse += answers.get('CanRecallWords', 0) * 6
    mmse += (1 - answers.get('DifficultyFollowing', 0)) * 6
    mmse += (1 - answers.get('TroubleWriting', 0)) * 3
    mmse += (1 - answers.get('GetsLost', 0)) * 3
    answers['MMSE'] = max(0, min(30, mmse))

    answers['FunctionalAssessment'] = (
        answers.get('ManagesFinances', 0) + answers.get('CanTravel', 0) +
        answers.get('CanCookMeals', 0) + answers.get('ManagesMeds', 0) +
        answers.get('ManagesHousehold', 0)
    ) * 2

    answers['ADL'] = (
        answers.get('CanBathe', 0) + answers.get('CanDress', 0) +
        answers.get('CanEat', 0) + answers.get('CanToilet', 0) +
        answers.get('CanWalk', 0)
    ) * 2
    return answers


def build_feature_vector(answers: dict, feature_names: list) -> pd.DataFrame:
    answers = approximate_clinical_scores(answers)
    answers['CognitiveDecline'] = answers['MMSE'] * answers['FunctionalAssessment']
    answers['SelfReportedCognition'] = sum(
        answers.get(f, 0) for f in [
            'MemoryComplaints', 'BehavioralProblems', 'Confusion', 'Forgetfulness',
            'Disorientation', 'PersonalityChanges', 'DifficultyCompletingTasks'
        ]
    )
    answers['LifestyleScore'] = answers.get('PhysicalActivity', 5) + answers.get('DietQuality', 5) + answers.get('SleepQuality', 6)
    answers['CardioRisk'] = answers.get('Hypertension', 0) + answers.get('Diabetes', 0) + answers.get('CardiovascularDisease', 0)
    return pd.DataFrame([[answers.get(f, 0) for f in feature_names]], columns=feature_names)


def recommendation(tier: str) -> str:
    return {
        'Low': 'Low current risk signal. Keep up healthy routines, social engagement, exercise and sleep hygiene.',
        'Moderate': 'Some warning signs detected. Consider a memory screening at a GP or polyclinic, and monitor changes over time.',
        'High': 'Multiple risk factors are present. A professional cognitive assessment is recommended.',
        'Very High': 'Strong warning signals detected. Please seek medical evaluation promptly.',
    }[tier]


def calculate_quiz_score(user_answers: dict, quiz_weights: list) -> float:
    score = 0.0
    answers = approximate_clinical_scores(user_answers)
    answers['CognitiveDecline'] = answers['MMSE'] * answers['FunctionalAssessment']
    answers['SelfReportedCognition'] = sum(
        answers.get(f, 0) for f in [
            'MemoryComplaints', 'BehavioralProblems', 'Confusion', 'Forgetfulness',
            'Disorientation', 'PersonalityChanges', 'DifficultyCompletingTasks'
        ]
    )
    answers['LifestyleScore'] = answers.get('PhysicalActivity', 5) + answers.get('DietQuality', 5) + answers.get('SleepQuality', 6)
    answers['CardioRisk'] = answers.get('Hypertension', 0) + answers.get('Diabetes', 0) + answers.get('CardiovascularDisease', 0)

    for q in quiz_weights:
        feat = q['feature']
        value = answers.get(feat, 0)
        weight = q['weight']
        ftype = q['type']
        if ftype == 'binary':
            norm = float(value)
        elif ftype == 'categorical':
            norm = float(value) / 3.0
        else:
            lo, hi = RANGES.get(feat, (0, 10))
            norm = (float(value) - lo) / max(hi - lo, 1)
            norm = max(0.0, min(1.0, norm))
        if feat in LOW_IS_BAD:
            norm = 1.0 - norm
        score += norm * weight
    return float(score)


def predict_risk(user_answers: dict):
    metadata, quiz_weights = ensure_artifacts()
    model = joblib.load(MODEL_PATH)
    feature_names = metadata['feature_names']
    vector = build_feature_vector(user_answers, feature_names)
    ml_probability = float(model.predict_proba(vector)[0][1])
    quiz_score = calculate_quiz_score(user_answers, quiz_weights)
    blended = (ml_probability * 0.45) + ((quiz_score / 100.0) * 0.55)

    if blended < 0.25:
        tier = 'Low'
    elif blended < 0.45:
        tier = 'Moderate'
    elif blended < 0.65:
        tier = 'High'
    else:
        tier = 'Very High'

    scored = approximate_clinical_scores(user_answers)
    return {
        'ml_probability': round(ml_probability * 100, 1),
        'quiz_score': round(quiz_score, 1),
        'blended_score': round(blended * 100, 1),
        'risk_tier': tier,
        'recommendation': recommendation(tier),
        'derived_scores': {
            'MMSE': scored['MMSE'],
            'FunctionalAssessment': scored['FunctionalAssessment'],
            'ADL': scored['ADL'],
        }
    }


def dataset_insights():
    df = load_data()
    X, y, _ = preprocess(df)
    diagnosed = X[y == 1]
    healthy = X[y == 0]
    focus_cols = [
        'Age', 'PhysicalActivity', 'SleepQuality', 'MMSE', 'FunctionalAssessment',
        'ADL', 'MemoryComplaints', 'Forgetfulness', 'Confusion', 'Disorientation'
    ]
    comparisons = []
    for col in focus_cols:
        if col in {'MemoryComplaints', 'Forgetfulness', 'Confusion', 'Disorientation'}:
            comparisons.append({
                'feature': col,
                'diagnosed': round(float(diagnosed[col].mean() * 100), 1),
                'healthy': round(float(healthy[col].mean() * 100), 1),
                'unit': '% yes',
            })
        else:
            comparisons.append({
                'feature': col,
                'diagnosed': round(float(diagnosed[col].mean()), 2),
                'healthy': round(float(healthy[col].mean()), 2),
                'unit': 'mean',
            })
    return comparisons
