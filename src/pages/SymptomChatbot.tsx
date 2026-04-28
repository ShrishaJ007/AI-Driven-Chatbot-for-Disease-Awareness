import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { MessageCircle, Send, Bot, User as UserIcon, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

interface Question {
  question: string;
  options?: string[];
}

interface PredictionResult {
  predictions: Array<{
    disease: string;
    probability: number;
    risk_level: string;
    recommendations: string[];
  }>;
  symptoms: string[];
  severity: number;
  duration: string;
}

export function SymptomChatbot() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [predictionResults, setPredictionResults] = useState<PredictionResult | null>(null);
  const [showEmergencyWarning, setShowEmergencyWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_FLASK_API_URL || 'http://localhost:5000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!sessionStarted) {
      startSession();
    }
  }, []);

  const addMessage = (type: 'bot' | 'user', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const startSession = async () => {
    try {
      const response = await fetch(`${API_URL}/api/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      const data = await response.json();
      setSessionId(data.session_id);
      setSessionStarted(true);
      addMessage('bot', data.message);

      if (data.question) {
        setCurrentQuestion(data.question);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      addMessage('bot', 'Welcome to the Health Assessment Chatbot. How can I help you today? Please describe your symptoms.');
      setSessionStarted(true);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || loading) return;

    addMessage('user', message);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      if (data.emergency) {
        setShowEmergencyWarning(true);
      }

      if (data.message) {
        addMessage('bot', data.message);
      }

      if (data.question) {
        setCurrentQuestion(data.question);
      } else {
        setCurrentQuestion(null);
      }

      if (data.predictions) {
        setPredictionResults(data);
        await savePredictions(data);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('bot', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const savePredictions = async (results: PredictionResult) => {
    if (!user) return;

    try {
      const { data: symptomEntry, error: symptomError } = await supabase
        .from('symptomentries')
        .insert({
          userid: user.id,
          symptoms: results.symptoms,
          severity: results.severity,
          duration: results.duration,
        })
        .select()
        .single();

      if (symptomError) {
        console.error('Error saving symptom entry:', symptomError);
        return;
      }

      const predictions = results.predictions.map((pred) => ({
        userid: user.id,
        symptomentryid: symptomEntry.id,
        diseasename: pred.disease,
        probability: pred.probability,
        risklevel: pred.risk_level,
        recommendations: pred.recommendations,
      }));

      const { error: predictionsError } = await supabase
        .from('diseasepredictions')
        .insert(predictions);

      if (predictionsError) {
        console.error('Error saving predictions:', predictionsError);
      }
    } catch (error) {
      console.error('Error in savePredictions:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleOptionClick = (option: string) => {
    sendMessage(option);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Symptom Checker</h1>
          <p className="text-gray-600">
            Describe your symptoms and get AI-powered health insights
          </p>
        </div>

        {showEmergencyWarning && (
          <Alert variant="error" className="mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Emergency Symptoms Detected</h3>
                <p className="text-sm">
                  Your symptoms may indicate a serious condition. Please seek immediate medical
                  attention by calling emergency services or visiting the nearest emergency room.
                </p>
              </div>
            </div>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-blue-50">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-semibold text-gray-900">Chat Session</h2>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'bot'
                        ? 'bg-teal-100 text-teal-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {message.type === 'bot' ? (
                      <Bot className="w-5 h-5" />
                    ) : (
                      <UserIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div
                    className={`flex-1 max-w-[80%] ${
                      message.type === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-block px-4 py-3 rounded-2xl ${
                        message.type === 'bot'
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-teal-600 text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {currentQuestion && currentQuestion.options && (
                <div className="flex flex-col gap-2 ml-11">
                  <p className="text-sm font-medium text-gray-700">Quick responses:</p>
                  <div className="flex flex-wrap gap-2">
                    {currentQuestion.options.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleOptionClick(option)}
                        disabled={loading}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}

              {predictionResults && (
                <div className="ml-11 space-y-3">
                  <Alert variant="success">
                    <CheckCircle className="w-5 h-5" />
                    <div>
                      <h3 className="font-semibold mb-1">Analysis Complete</h3>
                      <p className="text-sm">
                        Based on your symptoms, here are the top predictions:
                      </p>
                    </div>
                  </Alert>

                  {predictionResults.predictions.map((pred, index) => (
                    <div
                      key={index}
                      className="bg-white border-2 border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{pred.disease}</h4>
                          <p className="text-sm text-gray-600">
                            Confidence: {pred.probability.toFixed(1)}%
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(
                            pred.risk_level
                          )}`}
                        >
                          {pred.risk_level.toUpperCase()}
                        </span>
                      </div>
                      {pred.recommendations.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Recommendations:
                          </p>
                          <ul className="space-y-1">
                            {pred.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex gap-2">
                                <span className="text-teal-600">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => navigate('/history')}
                      className="flex-1"
                    >
                      View Full History
                    </Button>
                    <Button
                      onClick={() => window.location.reload()}
                      className="flex-1"
                    >
                      New Assessment
                    </Button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading || !inputValue.trim()}>
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <Alert variant="info">
          <p className="text-sm">
            <strong>Disclaimer:</strong> This chatbot provides general health information and is
            not a substitute for professional medical advice, diagnosis, or treatment. Always
            consult with qualified healthcare providers for medical concerns.
          </p>
        </Alert>
      </div>
    </Layout>
  );
}
