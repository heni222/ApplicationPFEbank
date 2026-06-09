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

# IMPORTANT:
# Mets ici exactement les mêmes colonnes et le même ordre que dans le notebook
FEATURE_COLUMNS = [
    "age",
    "annual_income",
    "account_age_months",
    "avg_monthly_balance",
    "num_deposits_per_month",
    "avg_deposit_amount",
    "num_withdrawals_per_month",
    "avg_withdrawal_amount",
    "debit_card_spending",
    "credit_card_utilization",
    "total_outstanding_debt",
    "loan_application_amount",
    "employment_status",
    "housing_status",
    "marital_status",
    "education_level"
]

NUMERIC_COLUMNS = [
    "age",
    "annual_income",
    "account_age_months",
    "avg_monthly_balance",
    "num_deposits_per_month",
    "avg_deposit_amount",
    "num_withdrawals_per_month",
    "avg_withdrawal_amount",
    "debit_card_spending",
    "credit_card_utilization",
    "total_outstanding_debt",
    "loan_application_amount"
]

CATEGORICAL_COLUMNS = [
    "employment_status",
    "housing_status",
    "marital_status",
    "education_level"
]

# À adapter selon ton notebook
ENCODING_MAPS = {
    "employment_status": {
        "employed": 0,
        "self-employed": 1,
        "unemployed": 2,
        "student": 3,
        "retired": 4
    },
    "housing_status": {
        "rent": 0,
        "own": 1,
        "mortgage": 2,
        "other": 3
    },
    "marital_status": {
        "single": 0,
        "married": 1,
        "divorced": 2,
        "widowed": 3
    },
    "education_level": {
        "high school": 0,
        "bachelor": 1,
        "master": 2,
        "phd": 3
    }
}


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "API Flask Credit Risk fonctionne correctement"
    })


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        if data is None:
            return jsonify({
                "error": "Aucune donnée JSON reçue"
            }), 400

        missing_fields = [col for col in FEATURE_COLUMNS if col not in data]

        if missing_fields:
            return jsonify({
                "error": "Champs manquants",
                "missing_fields": missing_fields
            }), 400

        input_data = {}

        for col in NUMERIC_COLUMNS:
            try:
                input_data[col] = float(data[col])
            except ValueError:
                return jsonify({
                    "error": f"Le champ {col} doit être numérique"
                }), 400

        for col in CATEGORICAL_COLUMNS:
            value = str(data[col]).lower().strip()

            if value not in ENCODING_MAPS[col]:
                return jsonify({
                    "error": f"Valeur invalide pour {col}",
                    "accepted_values": list(ENCODING_MAPS[col].keys())
                }), 400

            input_data[col] = ENCODING_MAPS[col][value]

        df = pd.DataFrame([input_data])

        # Respecter exactement l’ordre des colonnes
        df = df[FEATURE_COLUMNS]

        # Appliquer le scaler sauvegardé
        df_scaled = scaler.transform(df)

        prediction = int(model.predict(df_scaled)[0])

        if hasattr(model, "predict_proba"):
            probability = float(model.predict_proba(df_scaled)[0][prediction])
        else:
            probability = None

        label = "Risque élevé" if prediction == 1 else "Risque faible"

        return jsonify({
            "prediction": prediction,
            "label": label,
            "probability": probability
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)