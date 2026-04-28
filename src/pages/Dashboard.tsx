import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, HealthProfile, SymptomEntry, DiseasePrediction } from '../lib/supabase';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import { Alert } from '../components/ui/Alert';
import {
  User,
  MessageCircle,
  FileText,
  TrendingUp,
  ArrowRight,
  Activity,
  AlertTriangle,
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [recentSymptoms, setRecentSymptoms] = useState<SymptomEntry[]>([]);
  const [latestPrediction, setLatestPrediction] = useState<DiseasePrediction | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const { data: profileData } = await supabase
        .from('healthprofiles')
        .select('*')
        .eq('userid', user.id)
        .maybeSingle();

      setProfile(profileData);

      const { data: symptomsData } = await supabase
        .from('symptomentries')
        .select('*')
        .eq('userid', user.id)
        .order('createdat', { ascending: false })
        .limit(3);

      setRecentSymptoms(symptomsData || []);

      const { data: predictionsData } = await supabase
        .from('diseasepredictions')
        .select('*')
        .eq('userid', user.id)
        .order('createdat', { ascending: false })
        .limit(1)
        .maybeSingle();

      setLatestPrediction(predictionsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProfileCompletion = () => {
    if (!profile) return 0;
    let completed = 0;
    const total = 9;

    if (profile.name) completed++;
    if (profile.age) completed++;
    if (profile.gender) completed++;
    if (profile.height) completed++;
    if (profile.weight) completed++;
    if (profile.existingdiseases?.length) completed++;
    if (profile.allergies?.length) completed++;
    if (profile.medications?.length) completed++;
    completed++;

    return Math.round((completed / total) * 100);
  };

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loading text="Loading dashboard..." />
      </Layout>
    );
  }

  const profileCompletion = getProfileCompletion();

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back{profile?.name ? `, ${profile.name}` : ''}!
          </h1>
          <p className="text-gray-600">Here's your health overview</p>
        </div>

        {!profile && (
          <Alert variant="warning">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Complete Your Health Profile</h3>
                <p className="text-sm">
                  Set up your health profile to get personalized insights and better predictions.
                </p>
              </div>
              <Button onClick={() => navigate('/profile')} className="ml-4">
                Setup Profile
              </Button>
            </div>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card hover>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <User className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Health Profile</p>
                    <p className="text-2xl font-bold text-gray-900">{profileCompletion}%</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => navigate('/profile')}
                className="gap-2"
              >
                {profile ? 'Update Profile' : 'Complete Profile'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Symptom Entries</p>
                    <p className="text-2xl font-bold text-gray-900">{recentSymptoms.length}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                {recentSymptoms.length > 0
                  ? 'Recent symptom assessments'
                  : 'No symptoms recorded yet'}
              </p>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => navigate('/prediction')}
                className="gap-2"
              >
                Start Assessment
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Predictions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {latestPrediction ? '1' : '0'}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                {latestPrediction ? 'Latest analysis available' : 'No predictions yet'}
              </p>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => navigate('/history')}
                className="gap-2"
              >
                View History
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {latestPrediction && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                <h2 className="text-xl font-semibold text-gray-900">Latest Prediction</h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {latestPrediction.diseasename}
                  </h3>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      Confidence: {latestPrediction.probability.toFixed(1)}%
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(
                        latestPrediction.risklevel
                      )}`}
                    >
                      {latestPrediction.risklevel.toUpperCase()}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/history')}
                  className="gap-2"
                >
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {recentSymptoms.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h2 className="text-xl font-semibold text-gray-900">Recent Symptom Entries</h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSymptoms.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {entry.symptoms.map((symptom, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-sm"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Severity: {entry.severity}/10</span>
                        <span>Duration: {entry.duration}</span>
                        <span>{new Date(entry.createdat).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-2 border-teal-100 bg-gradient-to-r from-teal-50 to-blue-50">
          <CardContent className="py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white rounded-full">
                  <AlertTriangle className="w-8 h-8 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    Experiencing Symptoms?
                  </h3>
                  <p className="text-gray-600">
                    Use our AI-powered disease prediction to analyze your symptoms and get instant insights
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => navigate('/prediction')}
                className="gap-2"
              >
                Start Assessment
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
