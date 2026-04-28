import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import {
  Activity,
  Shield,
  TrendingUp,
  MessageCircle,
  Heart,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useEffect } from 'react';

export function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: MessageCircle,
      title: 'AI Symptom Analysis',
      description: 'Interactive chatbot that understands your symptoms and provides intelligent health insights.',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your health data is encrypted and protected with enterprise-grade security standards.',
    },
    {
      icon: TrendingUp,
      title: 'Health Tracking',
      description: 'Monitor your health profile and track symptom history over time for better insights.',
    },
    {
      icon: Heart,
      title: 'Disease Prediction',
      description: 'Advanced AI models analyze your symptoms to predict potential health conditions with confidence levels.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Create Your Profile',
      description: 'Sign up and build your comprehensive health profile in minutes.',
    },
    {
      number: '02',
      title: 'Describe Symptoms',
      description: 'Chat with our AI to describe your symptoms naturally and accurately.',
    },
    {
      number: '03',
      title: 'Get Insights',
      description: 'Receive disease predictions, risk levels, and personalized recommendations.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Activity className="w-8 h-8 text-teal-600" />
              <span className="text-2xl font-bold text-gray-900">HealthAI</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/signup')}>Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Activity className="w-4 h-4" />
              AI-Powered Health Assessment
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Your Personal Health
              <span className="text-teal-600"> Intelligence</span> Assistant
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Advanced symptom analysis and disease prediction powered by artificial intelligence.
              Get instant health insights and personalized recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/signup')} className="gap-2">
                Start Free Assessment
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600" />
                HIPAA Compliant
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                24/7 Available
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Health Analysis
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform provides accurate symptom analysis and health predictions
              to help you make informed decisions about your well-being.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} hover className="text-center">
                  <CardContent className="pt-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-2xl mb-4">
                      <Icon className="w-8 h-8 text-teal-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get started in three simple steps and receive instant health insights
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card hover>
                  <CardContent className="pt-8">
                    <div className="text-6xl font-bold text-teal-100 mb-4">
                      {step.number}
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600">{step.description}</p>
                  </CardContent>
                </Card>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-teal-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-teal-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-xl text-teal-50 mb-8">
            Join thousands of users who trust HealthAI for symptom analysis and health insights.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/signup')}
            className="bg-white text-teal-600 hover:bg-gray-100 gap-2"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="w-6 h-6 text-teal-600" />
            <span className="text-xl font-bold text-white">HealthAI</span>
          </div>
          <p className="text-sm mb-4">
            AI-powered health assessment and disease prediction platform
          </p>
          <p className="text-xs">
            &copy; {new Date().getFullYear()} HealthAI. This is for educational purposes only.
            Always consult with healthcare professionals for medical advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
