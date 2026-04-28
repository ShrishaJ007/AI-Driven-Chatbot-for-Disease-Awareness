from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import re
from datetime import datetime

app = Flask(__name__)
CORS(app)

sessions = {}

EMERGENCY_SYMPTOMS = [
    'chest pain', 'severe chest pain', 'difficulty breathing', 'shortness of breath',
    'severe bleeding', 'unconscious', 'stroke', 'heart attack', 'seizure',
    'severe head injury', 'severe abdominal pain', 'coughing blood', 'vomiting blood',
    'suicidal thoughts', 'severe allergic reaction', 'anaphylaxis'
]

COMMON_DISEASES = {
    'Common Cold': {
        'symptoms': ['runny nose', 'sneezing', 'cough', 'sore throat', 'mild fever', 'congestion'],
        'severity_range': (1, 5),
    },
    'Influenza (Flu)': {
        'symptoms': ['high fever', 'body aches', 'fatigue', 'cough', 'headache', 'chills'],
        'severity_range': (5, 8),
    },
    'Migraine': {
        'symptoms': ['severe headache', 'nausea', 'sensitivity to light', 'visual disturbances'],
        'severity_range': (6, 9),
    },
    'Gastroenteritis': {
        'symptoms': ['diarrhea', 'vomiting', 'abdominal pain', 'nausea', 'fever'],
        'severity_range': (4, 7),
    },
    'Allergic Rhinitis': {
        'symptoms': ['sneezing', 'runny nose', 'itchy eyes', 'congestion', 'watery eyes'],
        'severity_range': (2, 5),
    },
    'Bronchitis': {
        'symptoms': ['persistent cough', 'mucus', 'chest discomfort', 'fatigue', 'mild fever'],
        'severity_range': (4, 7),
    },
    'Urinary Tract Infection': {
        'symptoms': ['painful urination', 'frequent urination', 'lower abdominal pain', 'cloudy urine'],
        'severity_range': (3, 7),
    },
    'Sinusitis': {
        'symptoms': ['facial pain', 'nasal congestion', 'headache', 'thick nasal discharge', 'reduced smell'],
        'severity_range': (3, 6),
    },
    'Pneumonia': {
        'symptoms': ['cough', 'fever', 'difficulty breathing', 'chest pain', 'fatigue', 'chills'],
        'severity_range': (6, 9),
    },
    'Hypertension': {
        'symptoms': ['headache', 'dizziness', 'blurred vision', 'chest pain', 'shortness of breath'],
        'severity_range': (5, 9),
    },
}


class BeliefState:
    def __init__(self):
        self.symptoms = []
        self.severity = None
        self.duration = None
        self.age = None
        self.gender = None
        self.name = None
        self.existing_conditions = []
        self.lifestyle_factors = []
        self.family_history = []
        self.stage = 'disclaimer'
        self.asked_questions = set()

    def to_dict(self):
        return {
            'symptoms': self.symptoms,
            'severity': self.severity,
            'duration': self.duration,
            'age': self.age,
            'gender': self.gender,
            'name': self.name,
            'stage': self.stage,
        }


def extract_symptoms(text):
    text = text.lower()
    found_symptoms = []

    all_possible_symptoms = set()
    for disease_info in COMMON_DISEASES.values():
        all_possible_symptoms.update(disease_info['symptoms'])

    for symptom in all_possible_symptoms:
        if symptom in text:
            found_symptoms.append(symptom)

    common_symptom_keywords = [
        'headache', 'fever', 'cough', 'pain', 'nausea', 'vomiting', 'diarrhea',
        'fatigue', 'dizziness', 'rash', 'swelling', 'bleeding', 'burning',
        'itching', 'ache', 'sore', 'weakness', 'numbness', 'chills', 'sweating'
    ]

    for keyword in common_symptom_keywords:
        if keyword in text and keyword not in found_symptoms:
            found_symptoms.append(keyword)

    return found_symptoms


def check_emergency(symptoms):
    symptoms_text = ' '.join(symptoms).lower()
    for emergency in EMERGENCY_SYMPTOMS:
        if emergency in symptoms_text:
            return True
    return False


def predict_diseases(belief_state):
    predictions = []
    user_symptoms = set(s.lower() for s in belief_state.symptoms)

    for disease, info in COMMON_DISEASES.items():
        disease_symptoms = set(s.lower() for s in info['symptoms'])
        matched = user_symptoms.intersection(disease_symptoms)

        if matched:
            match_ratio = len(matched) / len(disease_symptoms)
            base_probability = match_ratio * 100

            severity_min, severity_max = info['severity_range']
            if belief_state.severity:
                if severity_min <= belief_state.severity <= severity_max:
                    base_probability *= 1.2
                else:
                    base_probability *= 0.8

            probability = min(base_probability, 95)

            if probability >= 20:
                if probability >= 70:
                    risk_level = 'high'
                elif probability >= 50:
                    risk_level = 'medium'
                else:
                    risk_level = 'low'

                recommendations = generate_recommendations(disease, risk_level, belief_state)
                medicine_suggestions = generate_medicine_suggestions(disease, risk_level)
                home_remedies = generate_home_remedies(disease)
                preventive_measures = generate_preventive_measures(disease, belief_state)

                predictions.append({
                    'disease': disease,
                    'probability': round(probability, 1),
                    'risk_level': risk_level,
                    'recommendations': recommendations,
                    'medicine_suggestions': medicine_suggestions,
                    'home_remedies': home_remedies,
                    'preventive_measures': preventive_measures,
                })

    predictions.sort(key=lambda x: x['probability'], reverse=True)
    return predictions[:3]


def generate_recommendations(disease, risk_level, belief_state):
    recommendations = []

    if risk_level in ['high', 'critical']:
        recommendations.append('Consult a healthcare professional as soon as possible')
        recommendations.append('Monitor your symptoms closely')
    else:
        recommendations.append('Consider consulting a healthcare provider if symptoms worsen')

    if disease == 'Common Cold':
        recommendations.extend([
            'Get plenty of rest',
            'Stay hydrated with water and warm fluids',
            'Use over-the-counter cold medications if needed',
        ])
    elif disease == 'Influenza (Flu)':
        recommendations.extend([
            'Rest and stay home to avoid spreading the virus',
            'Drink plenty of fluids',
            'Consider antiviral medications within 48 hours of symptom onset',
        ])
    elif disease == 'Migraine':
        recommendations.extend([
            'Rest in a quiet, dark room',
            'Apply cold or warm compresses',
            'Avoid triggers like certain foods or stress',
        ])
    elif disease == 'Gastroenteritis':
        recommendations.extend([
            'Stay hydrated with clear fluids',
            'Follow the BRAT diet (bananas, rice, applesauce, toast)',
            'Avoid dairy and fatty foods temporarily',
        ])
    else:
        recommendations.extend([
            'Rest and avoid strenuous activities',
            'Maintain a healthy diet',
            'Follow up with your doctor if symptoms persist',
        ])

    return recommendations

def generate_medicine_suggestions(disease, risk_level):
    suggestions = [
        'Use medicines only as advised by a licensed doctor or pharmacist',
        'Check allergies, existing conditions, and current medications before taking any medicine',
    ]

    if disease == 'Common Cold':
        suggestions.extend([
            'Paracetamol or acetaminophen may help with mild fever or body pain',
            'Saline nasal spray may help relieve nasal congestion',
            'Over-the-counter cold relief medicines may help temporarily',
        ])
    elif disease == 'Influenza (Flu)':
        suggestions.extend([
            'Paracetamol or acetaminophen may help reduce fever and body aches',
            'Ask a doctor whether antiviral treatment is appropriate, especially if symptoms started recently',
            'Use cough relief medicines only if suitable for your age and health condition',
        ])
    elif disease == 'Migraine':
        suggestions.extend([
            'Common pain relievers may help in mild migraine episodes',
            'A doctor may recommend migraine-specific medicines if attacks are frequent',
            'Avoid self-medicating repeatedly without medical guidance',
        ])
    elif disease == 'Gastroenteritis':
        suggestions.extend([
            'Oral rehydration solutions may help replace lost fluids and salts',
            'Avoid unnecessary medicines unless recommended by a doctor',
            'Seek medical advice if vomiting or diarrhea is persistent',
        ])
    elif disease == 'Allergic Rhinitis':
        suggestions.extend([
            'Antihistamines may help reduce sneezing and runny nose',
            'Saline nasal rinse may help clear allergens from nasal passages',
            'Ask a doctor before using allergy medicines regularly',
        ])
    elif disease == 'Bronchitis':
        suggestions.extend([
            'Warm fluids and doctor-approved cough relief may help symptom control',
            'Do not use antibiotics unless prescribed by a healthcare professional',
            'Medical review may be needed if breathing symptoms worsen',
        ])
    elif disease == 'Urinary Tract Infection':
        suggestions.extend([
            'Medical evaluation is usually needed because prescription treatment may be required',
            'Do not self-start antibiotics without a doctor’s advice',
            'Pain relief may help temporarily while arranging care',
        ])
    elif disease == 'Sinusitis':
        suggestions.extend([
            'Saline nasal rinse may help reduce congestion',
            'Steam inhalation may provide temporary comfort',
            'A doctor can advise whether additional treatment is needed',
        ])
    elif disease == 'Pneumonia':
        suggestions.extend([
            'Prompt medical evaluation is recommended because prescription treatment may be needed',
            'Do not rely only on home treatment for suspected pneumonia',
            'Seek urgent care if breathing becomes difficult',
        ])
    elif disease == 'Hypertension':
        suggestions.extend([
            'Do not start or stop blood pressure medicine without medical supervision',
            'Regular blood pressure monitoring is important',
            'Chest pain, breathing difficulty, or severe headache needs urgent review',
        ])
    else:
        suggestions.extend([
            'Use only doctor-approved or pharmacist-approved medicines',
            'Avoid combining medicines without checking for interactions',
        ])

    if risk_level in ['high', 'critical']:
        suggestions.append('Because the risk level is elevated, professional medical review is strongly recommended')

    return suggestions


def generate_home_remedies(disease):
    remedies = [
        'Get adequate rest',
        'Stay well hydrated',
        'Monitor symptoms closely',
    ]

    if disease == 'Common Cold':
        remedies.extend([
            'Drink warm fluids',
            'Use steam inhalation for comfort',
            'Gargle with warm salt water for sore throat relief',
        ])
    elif disease == 'Influenza (Flu)':
        remedies.extend([
            'Rest as much as possible',
            'Drink fluids frequently',
            'Use lukewarm sponging if fever is uncomfortable',
        ])
    elif disease == 'Migraine':
        remedies.extend([
            'Rest in a dark and quiet room',
            'Reduce screen exposure for some time',
            'Apply a cold compress to the forehead',
        ])
    elif disease == 'Gastroenteritis':
        remedies.extend([
            'Take small sips of fluids often',
            'Eat light foods if tolerated',
            'Avoid oily or very spicy foods temporarily',
        ])
    elif disease == 'Allergic Rhinitis':
        remedies.extend([
            'Avoid dust, smoke, and known triggers',
            'Wash face and hands after allergen exposure',
            'Keep indoor air as clean as possible',
        ])
    elif disease == 'Bronchitis':
        remedies.extend([
            'Use warm fluids to soothe the throat',
            'Avoid smoking and smoky environments',
            'Rest and avoid overexertion',
        ])
    elif disease == 'Urinary Tract Infection':
        remedies.extend([
            'Drink enough water unless a doctor told you to restrict fluids',
            'Do not hold urine for long periods',
            'Maintain good personal hygiene',
        ])
    elif disease == 'Sinusitis':
        remedies.extend([
            'Use steam inhalation carefully',
            'Keep the nose moist with saline rinse',
            'Rest and avoid exposure to irritants',
        ])
    elif disease == 'Pneumonia':
        remedies.extend([
            'Prioritize rest',
            'Stay hydrated',
            'Seek medical care rather than relying only on home remedies',
        ])
    elif disease == 'Hypertension':
        remedies.extend([
            'Reduce stress where possible',
            'Avoid excess salt in meals',
            'Track blood pressure regularly if available',
        ])

    return remedies


def generate_preventive_measures(disease, belief_state):
    prevention = [
        'Maintain regular sleep, hydration, and balanced nutrition',
        'Seek medical care if symptoms worsen or persist',
    ]

    if disease in ['Common Cold', 'Influenza (Flu)', 'Bronchitis', 'Pneumonia']:
        prevention.extend([
            'Wash hands regularly',
            'Cover coughs and sneezes properly',
            'Avoid close contact with sick individuals when possible',
        ])

    if disease == 'Influenza (Flu)':
        prevention.append('Discuss seasonal vaccination with a healthcare provider')

    if disease in ['Allergic Rhinitis', 'Sinusitis']:
        prevention.extend([
            'Avoid known environmental triggers',
            'Keep living spaces clean and well ventilated',
        ])

    if disease == 'Gastroenteritis':
        prevention.extend([
            'Use safe drinking water',
            'Eat properly prepared food',
            'Wash hands before meals and after using the toilet',
        ])

    if disease == 'Urinary Tract Infection':
        prevention.extend([
            'Stay hydrated',
            'Maintain good hygiene habits',
            'Do not delay urination unnecessarily',
        ])

    if disease == 'Hypertension':
        prevention.extend([
            'Exercise regularly as medically appropriate',
            'Limit excess salt and highly processed foods',
            'Monitor blood pressure routinely',
        ])

    if belief_state.severity and belief_state.severity >= 8:
        prevention.append('Because symptoms are severe, arrange medical follow-up even if you feel somewhat better later')

    return prevention

@app.route('/api/predict', methods=['POST'])
def predict_from_form():
    data = request.json or {}

    symptoms_text = data.get('message', '').strip()
    severity = data.get('severity')
    duration = data.get('duration')
    profile_context = data.get('profile_context', {})

    if not symptoms_text:
        return jsonify({'error': 'Symptoms are required'}), 400

    symptoms = [s.strip().lower() for s in symptoms_text.split(',') if s.strip()]

    beliefstate = BeliefState()
    beliefstate.symptoms = symptoms
    beliefstate.severity = severity
    beliefstate.duration = duration
    beliefstate.age = profile_context.get('age')
    beliefstate.gender = profile_context.get('gender')
    beliefstate.existing_conditions = profile_context.get('existing_diseases', [])

    if check_emergency(symptoms):
        return jsonify({
            'predictions': [],
            'emergency': True,
            'message': 'Emergency symptoms detected. Please seek immediate medical attention.'
        })

    predictions = predict_diseases(beliefstate)

    return jsonify({
        'predictions': predictions,
        'symptoms': symptoms,
        'severity': severity,
        'duration': duration,
        'emergency': False
    })

@app.route('/api/start', methods=['POST'])
def start_session():
    session_id = str(uuid.uuid4())
    belief_state = BeliefState()
    sessions[session_id] = belief_state

    return jsonify({
        'session_id': session_id,
        'message': 'Welcome to the Health Assessment Chatbot. This tool provides general health information and is not a substitute for professional medical advice.\n\nBy continuing, you acknowledge that:\n- This is for informational purposes only\n- You should seek immediate medical attention for emergencies\n- You will consult healthcare professionals for diagnosis and treatment\n\nDo you understand and agree to continue?',
        'question': {
            'question': 'Do you agree to the disclaimer?',
            'options': ['Yes, I agree', 'No'],
        }
    })


@app.route('/api/message', methods=['POST'])
def handle_message():
    data = request.json
    session_id = data.get('session_id')
    message = data.get('message', '').strip()

    if not session_id or session_id not in sessions:
        return jsonify({'error': 'Invalid session'}), 400

    belief_state = sessions[session_id]
    response = {}

    if belief_state.stage == 'disclaimer':
        if 'yes' in message.lower() or 'agree' in message.lower():
            belief_state.stage = 'name'
            response['message'] = 'Great! Let\'s start with some basic information. What is your name?'
        else:
            response['message'] = 'You must agree to the disclaimer to continue. If you have a medical emergency, please call emergency services immediately.'
            response['question'] = {
                'question': 'Do you agree to the disclaimer?',
                'options': ['Yes, I agree', 'No'],
            }

    elif belief_state.stage == 'name':
        belief_state.name = message
        belief_state.stage = 'age'
        response['message'] = f'Nice to meet you, {belief_state.name}! How old are you?'

    elif belief_state.stage == 'age':
        try:
            age = int(re.search(r'\d+', message).group())
            belief_state.age = age
            belief_state.stage = 'gender'
            response['message'] = 'Thank you. What is your gender?'
            response['question'] = {
                'question': 'Select your gender',
                'options': ['Male', 'Female', 'Other'],
            }
        except:
            response['message'] = 'Please provide your age as a number.'

    elif belief_state.stage == 'gender':
        belief_state.gender = message.lower()
        belief_state.stage = 'symptoms'
        response['message'] = 'Now, please describe your symptoms. What are you experiencing?'

    elif belief_state.stage == 'symptoms':
        symptoms = extract_symptoms(message)
        if symptoms:
            belief_state.symptoms.extend(symptoms)

            if check_emergency(belief_state.symptoms):
                response['emergency'] = True
                response['message'] = '⚠️ EMERGENCY: Your symptoms may indicate a serious medical condition. Please seek immediate medical attention by calling emergency services or going to the nearest emergency room.'
                belief_state.stage = 'complete'
            else:
                belief_state.stage = 'severity'
                response['message'] = f'I understand you\'re experiencing: {", ".join(belief_state.symptoms)}.\n\nOn a scale of 1-10, how severe are your symptoms? (1 = mild, 10 = very severe)'
        else:
            response['message'] = 'I didn\'t detect any specific symptoms. Could you please describe what you\'re feeling in more detail? For example: headache, fever, cough, nausea, etc.'

    elif belief_state.stage == 'severity':
        try:
            severity = int(re.search(r'\d+', message).group())
            if 1 <= severity <= 10:
                belief_state.severity = severity
                belief_state.stage = 'duration'
                response['message'] = 'How long have you been experiencing these symptoms?'
                response['question'] = {
                    'question': 'Duration of symptoms',
                    'options': ['Less than 24 hours', '1-3 days', '3-7 days', 'More than a week'],
                }
            else:
                response['message'] = 'Please provide a severity rating between 1 and 10.'
        except:
            response['message'] = 'Please provide a number between 1 and 10 for severity.'

    elif belief_state.stage == 'duration':
        belief_state.duration = message
        belief_state.stage = 'complete'

        predictions = predict_diseases(belief_state)

        if predictions:
            response['message'] = 'Thank you for providing all the information. Based on your symptoms, here are the possible conditions:'
            response['predictions'] = predictions
            response['symptoms'] = belief_state.symptoms
            response['severity'] = belief_state.severity
            response['duration'] = belief_state.duration
        else:
            response['message'] = 'Based on the information provided, I couldn\'t identify specific conditions. Please consult a healthcare professional for a proper evaluation.'

    else:
        response['message'] = 'This session has been completed. Please start a new session for another assessment.'

    return jsonify(response)


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
