from flask import Flask, jsonify, request
from flask_cors import CORS

from model_utils import dataset_insights, ensure_artifacts, predict_risk

app = Flask(__name__)
CORS(app)


@app.get('/api/health')
def health():
    return jsonify({'status': 'ok'})


@app.get('/api/config')
def config():
    metadata, quiz_weights = ensure_artifacts()
    return jsonify({
        'model': {
            'best_model': metadata['best_model'],
            'best_cv_auc': round(metadata['best_cv_auc'], 4),
            'test_auc': round(metadata['test_auc'], 4),
            'dataset_rows': metadata['dataset_rows'],
            'dataset_columns': metadata['dataset_columns'],
            'positive_rate': round(metadata['positive_rate'] * 100, 1),
        },
        'quiz_weights': quiz_weights,
        'default_form_values': metadata['default_form_values'],
        'insights': dataset_insights(),
    })


@app.post('/api/predict')
def predict():
    payload = request.get_json(force=True) or {}
    answers = payload.get('answers', payload)
    result = predict_risk(answers)
    return jsonify(result)


if __name__ == '__main__':
    ensure_artifacts()
    app.run(debug=True, port=5000)
