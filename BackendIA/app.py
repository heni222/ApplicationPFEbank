from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import os

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "http://localhost:4200"}})

MODEL_PATH = os.path.join("models", "xgboost_credit_risk_model.pkl")
SCALER_PATH = os.path.join("models", "scaler.pkl")

model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    client = data['client']
    application = data['application']

    revenue = client['revenue']
    monthly_charges = client['monthlyCharges']
    existing_loans = client['existingLoans']
    amount = application['amount']
    duration = application['duration']
    monthly_payment = application['monthlyPayment']

    # مثال features
    features = {
        'annual_income': revenue * 12,
        'loan_application_amount': amount,
        'monthly_charges': monthly_charges,
        'existing_loans': existing_loans,
        'loan_duration': duration,
        'monthly_payment': monthly_payment
    }

    # لازم هنا نفس colonnes متاع training بالضبط
    X = pd.DataFrame([features])
    prediction = model.predict(X)[0]
    proba = model.predict_proba(X)[0][1]

    return jsonify({
        'prediction': int(prediction),
        'risk_score': round(float(proba) * 100, 2)
    })
    try:
        data = request.get_json()

        if data is None:
            return jsonify({
                "error": "Aucune donnée JSON reçue"
            }), 400

        # Cas Angular : données dans aiFinancialData
        ai_data = data.get("aiFinancialData", data)

        missing_fields = [
            col for col in FEATURE_COLUMNS
            if col not in ai_data
        ]

        if missing_fields:
            return jsonify({
                "error": "Champs manquants",
                "missing_fields": missing_fields
            }), 400

        input_data = {}

        # Variables numériques
        for col in NUMERIC_COLUMNS:
            try:
                input_data[col] = float(ai_data[col])
            except Exception:
                return jsonify({
                    "error": f"Le champ {col} doit être numérique"
                }), 400

        # Variables catégorielles
        for col in CATEGORICAL_COLUMNS:
            value = str(ai_data[col]).lower().strip()

            if value not in ENCODING_MAPS[col]:
                return jsonify({
                    "error": f"Valeur invalide pour {col}",
                    "accepted_values": list(
                        ENCODING_MAPS[col].keys()
                    )
                }), 400

            input_data[col] = ENCODING_MAPS[col][value]

        # DataFrame
        df = pd.DataFrame([input_data])

        # Ordre identique à l'entraînement
        df = df[FEATURE_COLUMNS]

        # Scaling
        df_scaled = scaler.transform(df)

        # Prédiction
        prediction = int(model.predict(df_scaled)[0])

        # Probabilité
        if hasattr(model, "predict_proba"):
            probability = float(
                model.predict_proba(df_scaled)[0][1]
            )
        else:
            probability = None

        # Score risque 0-100
        risk_score = round(probability * 100) if probability is not None else None

        label = (
            "Risque élevé"
            if prediction == 1
            else "Risque faible"
        )

        return jsonify({
            "prediction": prediction,
            "label": label,
            "probability": probability,
            "risk_score": risk_score,

            # infos utiles Angular
            "applicationId": data.get("applicationId"),
            "clientId": data.get("clientId"),
            "clientName": data.get("clientName")
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500