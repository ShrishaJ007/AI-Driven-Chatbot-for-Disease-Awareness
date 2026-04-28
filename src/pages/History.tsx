import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, SymptomEntry, DiseasePrediction } from '../lib/supabase';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { Alert } from '../components/ui/Alert';
import { FileText, Calendar, Activity, TrendingUp } from 'lucide-react';

interface SymptomWithPredictions extends SymptomEntry {
  predictions: DiseasePrediction[];
}

export function History() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<SymptomWithPredictions[]>([]);

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;

    try {
      const { data: symptomsData, error: symptomsError } = await supabase
        .from('symptomentries')
        .select('*')
        .eq('userid', user.id)
        .order('createdat', { ascending: false });

      if (symptomsError) {
        console.error('Error loading symptoms:', symptomsError);
        return;
      }

      const entriesWithPredictions: SymptomWithPredictions[] = [];

      for (const symptom of symptomsData || []) {
        const { data: predictionsData, error: predictionsError } = await supabase
          .from('diseasepredictions')
          .select('*')
          .eq('symptomentryid', symptom.id)
          .order('probability', { ascending: false });

        if (predictionsError) {
          console.error('Error loading predictions:', predictionsError);
        }

        entriesWithPredictions.push({
          ...symptom,
          predictions: predictionsData || [],
        });
      }

      setEntries(entriesWithPredictions);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loading text="Loading history..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Prediction History</h1>
          <p className="text-gray-600">
            View your past symptom assessments and health predictions
          </p>
        </div>

        {entries.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-100 rounded-full">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No History Yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You haven't completed any symptom assessments yet.
                  </p>
                  <a
                    href="/prediction"
                    className="inline-block px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Start Assessment
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {entries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader className="bg-gradient-to-r from-teal-50 to-blue-50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        <Activity className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {entry.symptoms.map((symptom, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium"
                            >
                              {symptom}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(entry.createdat).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                          <span>Severity: {entry.severity}/10</span>
                          <span>Duration: {entry.duration}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {entry.predictions.length === 0 ? (
                    <Alert variant="info">
                      <p className="text-sm">
                        No predictions available for this symptom entry.
                      </p>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-teal-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Disease Predictions
                        </h3>
                      </div>

                      <div className="grid gap-4">
                        {entry.predictions.map((prediction) => (
                          <div
                            key={prediction.id}
                            className="border-2 border-gray-200 rounded-lg p-4 hover:border-teal-200 transition-colors"
                          >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                  {prediction.diseasename}
                                </h4>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2 min-w-[120px]">
                                      <div
                                        className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                                        style={{
                                          width: `${prediction.probability}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                      {prediction.probability.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskLevelColor(
                                  prediction.risklevel
                                )}`}
                              >
                                {prediction.risklevel.toUpperCase()} RISK
                              </span>
                            </div>

                            {prediction.recommendations.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                  Recommendations:
                                </p>
                                <ul className="space-y-2">
                                  {prediction.recommendations.map((rec, idx) => (
                                    <li
                                      key={idx}
                                      className="text-sm text-gray-600 flex gap-2"
                                    >
                                      <span className="text-teal-600 flex-shrink-0">•</span>
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Alert variant="info">
          <p className="text-sm">
            <strong>Important:</strong> These predictions are generated by AI and should not
            replace professional medical advice. Always consult with healthcare providers for
            accurate diagnosis and treatment.
          </p>
        </Alert>
      </div>
    </Layout>
  );
}
