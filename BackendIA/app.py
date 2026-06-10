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

    client = data.get('client', {})
    app_data = data.get('application', {})
    ai = app_data.get('aiFinancialData', {})

    revenue = float(client.get('revenue', 0))
    amount = float(app_data.get('amount', ai.get('loan_application_amount', 0)))
    total_debt = float(ai.get('total_outstanding_debt', 0))
    monthly_charges = float(client.get('monthlyCharges', 0))

    annual_income = revenue * 12

    features = {
        'age': 30,  # مؤقت، الأفضل تحسبها من birthDate
        'annual_income': annual_income,

        'account_age_months': ai.get('account_age_months', 0),
        'avg_monthly_balance': ai.get('avg_monthly_balance', 0),
        'num_deposits_per_month': ai.get('num_deposits_per_month', 0),
        'avg_deposit_amount': ai.get('avg_deposit_amount', 0),

        'debit_card_usage_frequency': ai.get('debit_card_usage_frequency', 0),
        'debit_card_spending': ai.get('debit_card_spending', 0),
        'mobile_banking_logins': ai.get('mobile_banking_logins', 0),
        'online_transfer_frequency': ai.get('online_transfer_frequency', 0),
        'atm_withdrawal_frequency': ai.get('atm_withdrawal_frequency', 0),

        'num_open_loans': client.get('existingLoanPayments', 0),
        'total_outstanding_debt': total_debt,
        'late_payment_count': ai.get('late_payment_count', 0),
        'loan_default_history': ai.get('loan_default_history', 0),
        'fraud_flag': ai.get('fraud_flag', 0),

        'loan_application_amount': amount,

        'gender_female': 1 if client.get('gender') == 'Female' else 0,
        'gender_male': 1 if client.get('gender') == 'Male' else 0,
        'gender_other': 1 if client.get('gender') == 'Other' else 0,

        'employment_status_Employed': 1 if client.get('employmentStatus') == 'Employed' else 0,
        'employment_status_Self-Employed': 1 if client.get('employmentStatus') == 'Self-Employed' else 0,
        'employment_status_Unemployed': 1 if client.get('employmentStatus') == 'Unemployed' else 0,

        'debt_to_income_ratio': total_debt / annual_income if annual_income > 0 else 0,
        'loan_to_income_ratio': amount / annual_income if annual_income > 0 else 0,
        'spending_ratio': monthly_charges / revenue if revenue > 0 else 0,
        'balance_to_debt_ratio': ai.get('avg_monthly_balance', 0) / total_debt if total_debt > 0 else 0
    }

    columns = [
        'age', 'annual_income', 'account_age_months', 'avg_monthly_balance',
        'num_deposits_per_month', 'avg_deposit_amount',
        'debit_card_usage_frequency', 'debit_card_spending',
        'mobile_banking_logins', 'online_transfer_frequency',
        'atm_withdrawal_frequency', 'num_open_loans',
        'total_outstanding_debt', 'late_payment_count',
        'loan_default_history', 'fraud_flag',
        'loan_application_amount', 'gender_female', 'gender_male',
        'gender_other', 'employment_status_Employed',
        'employment_status_Self-Employed',
        'employment_status_Unemployed', 'debt_to_income_ratio',
        'loan_to_income_ratio', 'spending_ratio',
        'balance_to_debt_ratio'
    ]

    X = pd.DataFrame([features], columns=columns)

    prediction = model.predict(X)[0]
    proba = model.predict_proba(X)[0][1]

    return jsonify({
        'prediction': int(prediction),
        'risk_score': round(float(proba) * 100, 2)
    })