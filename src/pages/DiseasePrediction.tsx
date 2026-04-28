import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { supabase } from '../lib/supabase';
import type { HealthProfile } from '../lib/supabase';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import { Alert } from '../components/ui/Alert';
import { Stethoscope, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type PredictionResult = {
  disease: string;
  probability: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  medicine_suggestions?: string[];
  home_remedies?: string[];
  preventive_measures?: string[];
};

type CareSearchType = 'hospital' | 'doctor' | 'clinic';

type NearbyCareState = {
  disease?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  recommendedType?: CareSearchType;
  specialty?: string;
  source?: 'prediction' | 'manual';
};

const COMMON_SYMPTOMS = [
  'fever',
  'cough',
  'headache',
  'fatigue',
  'sore throat',
  'body ache',
  'shortness of breath',
  'chest pain',
  'nausea',
  'vomiting',
  'diarrhea',
  'dizziness',
  'abdominal pain',
  'runny nose',
  'chills',
  'loss of appetite',
  'joint pain',
  'rash',
  'sweating',
  'weakness',
];



const durationOptions = [
  'Less than 24 hours',
  '1-3 days',
  '3-7 days',
  'More than a week',
];

const riskColors: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const getRecommendedCareType = (
  disease: string,
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
): CareSearchType => {
  if (riskLevel === 'high' || riskLevel === 'critical') {
    return 'hospital';
  }

  const clinicDiseases = [
    'Influenza (Flu)',
    'Gastroenteritis',
    'Bronchitis',
    'Urinary Tract Infection',
  ];

  const hospitalDiseases = ['Pneumonia'];

  if (hospitalDiseases.includes(disease)) return 'hospital';
  if (clinicDiseases.includes(disease)) return 'clinic';

  return 'doctor';
};

const getRecommendedSpecialty = (disease: string): string => {
  const specialtyMap: Record<string, string> = {
    'Migraine': 'neurology',
    'Allergic Rhinitis': 'ent',
    'Sinusitis': 'ent',
    'Urinary Tract Infection': 'urology',
    'Bronchitis': 'pulmonology',
    'Pneumonia': 'pulmonology',
    'Hypertension': 'cardiology',
    'Common Cold': 'general',
    'Influenza (Flu)': 'general',
    'Gastroenteritis': 'general',
  };

  return specialtyMap[disease] || 'general';
};

export default function DiseasePrediction() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [severity, setSeverity] = useState(5);
  const [duration, setDuration] = useState(durationOptions[0]);
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  
  const goToNearbyCare = (result: PredictionResult) => {
  const state: NearbyCareState = {
    disease: result.disease,
    riskLevel: result.risk_level,
    recommendedType: getRecommendedCareType(result.disease, result.risk_level),
    specialty: getRecommendedSpecialty(result.disease),
    source: 'prediction',
  };

  navigate('/nearby-care', { state });
};

  useEffect(() => {
    const loadProfile = async () => {
      setPageLoading(true);
      setError('');

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('User not logged in');
        setPageLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('healthprofiles')
        .select('*')
        .eq('userid', user.id)
        .single();

      if (error) {
        setError('Could not load health profile');
      } else {
        setProfile(data);
      }

      setPageLoading(false);
    };

    loadProfile();
  }, []);

  const allSymptoms = useMemo(() => {
    return [...selectedSymptoms].sort();
  }, [selectedSymptoms]);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const addCustomSymptom = () => {
    const value = customSymptom.trim().toLowerCase();
    if (!value) return;

    if (!selectedSymptoms.includes(value)) {
      setSelectedSymptoms((prev) => [...prev, value]);
    }

    setCustomSymptom('');
  };

  const savePredictionToSupabase = async (
    userId: string,
    symptoms: string[],
    predictions: PredictionResult[]
  ) => {
    const { data: symptomEntry, error: symptomError } = await supabase
      .from('symptomentries')
      .insert([
        {
          userid: userId,
          symptoms,
          severity,
          duration,
        },
      ])
      .select()
      .single();

    if (symptomError || !symptomEntry) {
      console.error('Error saving symptom entry:', symptomError);
      return;
    }

    const predictionRows = predictions.map((item) => ({
      userid: userId,
      symptomentryid: symptomEntry.id,
      diseasename: item.disease,
      probability: item.probability,
      risklevel: item.risk_level,
      recommendations: item.recommendations,
    }));

    const { error: predictionError } = await supabase
      .from('diseasepredictions')
      .insert(predictionRows);

    if (predictionError) {
      console.error('Error saving predictions:', predictionError);
    }
  };

  const handlePredict = async () => {
    setError('');

    if (selectedSymptoms.length === 0) {
      setError('Please select or add at least one symptom.');
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not logged in');
      }

      const payload = {
        message: selectedSymptoms.join(', '),
        severity,
        duration,
        profile_context: {
          allergies: profile?.allergies || [],
          medications: profile?.medications || [],
          existing_diseases: profile?.existingdiseases || [],
          age: profile?.age || null,
          gender: profile?.gender || null,
        },
      };

      const response = await fetch('http://127.0.0.1:5000/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Prediction request failed');
      }

      const data = await response.json();
      const predictionResults = data.predictions || [];

      setResults(predictionResults);

      if (predictionResults.length > 0) {
        await savePredictionToSupabase(user.id, selectedSymptoms, predictionResults);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const generatePdfReport = () => {
    const doc = new jsPDF();
    let y = 15;

    const addLine = (text: string, gap = 8) => {
      const lines = doc.splitTextToSize(text, 180);
      doc.text(lines, 15, y);
      y += lines.length * 6 + gap;

      if (y > 270) {
        doc.addPage();
        y = 15;
      }
    };

    doc.setFontSize(18);
    doc.text('Health Report', 15, y);
    y += 12;

    doc.setFontSize(11);
    addLine(`Generated on: ${new Date().toLocaleString()}`);
    addLine('This report is for informational purposes only and is not a medical diagnosis.');

    doc.setFontSize(14);
    doc.text('Profile Context', 15, y);
    y += 10;
    doc.setFontSize(11);

    addLine(`Name: ${profile?.name || 'Not set'}`);
    addLine(`Age: ${profile?.age ?? 'Not set'}`);
    addLine(`Gender: ${profile?.gender || 'Not set'}`);
    addLine(`Existing Diseases: ${(profile?.existingdiseases || []).join(', ') || 'None listed'}`);
    addLine(`Allergies: ${(profile?.allergies || []).join(', ') || 'None listed'}`);
    addLine(`Medications: ${(profile?.medications || []).join(', ') || 'None listed'}`);

    doc.setFontSize(14);
    doc.text('Assessment Input', 15, y);
    y += 10;
    doc.setFontSize(11);

    addLine(`Symptoms: ${allSymptoms.join(', ') || 'None selected'}`);
    addLine(`Severity: ${severity}/10`);
    addLine(`Duration: ${duration}`);

    doc.setFontSize(14);
    doc.text('Prediction Results', 15, y);
    y += 10;
    doc.setFontSize(11);

    if (results.length === 0) {
      addLine('No prediction results available.');
    } else {
      results.forEach((result, index) => {
        addLine(`${index + 1}. ${result.disease}`);
        addLine(`Probability: ${result.probability}%`);
        addLine(`Risk Level: ${result.risk_level}`);

        addLine(`Recommendations: ${(result.recommendations || []).join('; ') || 'None'}`);

        addLine(
          `Medicine Suggestions: ${(result.medicine_suggestions || []).join('; ') || 'Not available yet'}`
        );

        addLine(
          `Home Remedies: ${(result.home_remedies || []).join('; ') || 'Not available yet'}`
        );

        addLine(
          `Preventive Suggestions: ${(result.preventive_measures || []).join('; ') || 'Not available yet'}`
        );

        y += 4;
      });
    }

    doc.save(`health-report-${new Date().getTime()}.pdf`);
  };

  if (pageLoading) {
    return (
      <Layout>
        <Loading text="Loading disease prediction..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Disease Prediction</h1>
          <p className="mt-2 text-slate-600">
            Select symptoms, add custom ones, and use your profile context for a more relevant assessment.
          </p>
        </div>

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-teal-100 p-3">
                  <Stethoscope className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Profile Context</h2>
                  <p className="text-sm text-slate-600">Used to improve prediction quality</p>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium text-slate-700">Name</p>
                  <p className="text-slate-600">{profile?.name || 'Not set'}</p>
                </div>

                <div>
                  <p className="font-medium text-slate-700">Existing Diseases</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(profile?.existingdiseases || []).length > 0 ? (
                      profile?.existingdiseases.map((item) => (
                        <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500">None listed</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="font-medium text-slate-700">Allergies</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(profile?.allergies || []).length > 0 ? (
                      profile?.allergies.map((item) => (
                        <span key={item} className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500">None listed</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="font-medium text-slate-700">Medications</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(profile?.medications || []).length > 0 ? (
                      profile?.medications.map((item) => (
                        <span key={item} className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500">None listed</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <h2 className="text-xl font-semibold">Assessment Input</h2>
            </CardHeader>

            <CardContent>
              <div>
                <p className="mb-3 font-medium text-slate-700">Select Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SYMPTOMS.map((symptom) => {
                    const active = selectedSymptoms.includes(symptom);

                    return (
                      <button
                        key={symptom}
                        type="button"
                        onClick={() => toggleSymptom(symptom)}
                        className={`rounded-full border px-4 py-2 text-sm transition ${
                          active
                            ? 'border-teal-600 bg-teal-600 text-white'
                            : 'border-slate-300 bg-white text-slate-700 hover:border-teal-500'
                        }`}
                      >
                        {symptom}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 font-medium text-slate-700">Add Custom Symptom</p>
                <div className="flex gap-3">
                  <input
                    value={customSymptom}
                    onChange={(e) => setCustomSymptom(e.target.value)}
                    placeholder="Type a symptom not listed above"
                    className="flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600"
                  />
                  <Button type="button" onClick={addCustomSymptom}>
                    Add
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium text-slate-700">
                    Severity: {severity}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium text-slate-700">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  >
                    {durationOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 font-medium text-slate-700">Selected Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {allSymptoms.length > 0 ? (
                    allSymptoms.map((item) => (
                      <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500">No symptoms selected yet.</span>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={handlePredict}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? 'Generating Prediction...' : 'Run Disease Prediction'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePdfReport}
                  disabled={results.length === 0}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Health Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Prediction Results</h2>
          </CardHeader>

          <CardContent>
            {results.length === 0 ? (
              <p className="text-slate-500">
                No prediction yet. Fill the assessment and run prediction.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {results.map((result, index) => (
                  <div
                    key={`${result.disease}-${index}`}
                    className="rounded-2xl border border-slate-200 p-4 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">{result.disease}</h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${riskColors[result.risk_level]}`}
                      >
                        {result.risk_level}
                      </span>
                    </div>

                    <div>
                      <div className="mb-2 flex justify-between text-sm text-slate-600">
                        <span>Confidence</span>
                        <span>{result.probability}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-teal-600"
                          style={{ width: `${Math.min(result.probability, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium text-slate-700">Recommendations</p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                        {result.recommendations?.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium text-slate-700">Medicine Suggestions</p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                        {(result.medicine_suggestions || ['Will appear after backend update']).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium text-slate-700">Home Remedies</p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                        {(result.home_remedies || ['Will appear after backend update']).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium text-slate-700">Preventive Health Suggestions</p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                        {(result.preventive_measures || ['Will appear after backend update']).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                     <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => goToNearbyCare(result)}
                    >
                      Find Nearby Care
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}