import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, HealthProfile } from '../lib/supabase';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loading } from '../components/ui/Loading';
import { Alert } from '../components/ui/Alert';
import { User, Plus, X } from 'lucide-react';

export function HealthProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [existingDiseases, setExistingDiseases] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);

  const [newDisease, setNewDisease] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('healthprofiles')
        .select('*')
        .eq('userid', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
      }

      if (data) {
        setName(data.name);
        setAge(data.age.toString());
        setGender(data.gender);
        setHeight(data.height.toString());
        setWeight(data.weight.toString());
        setExistingDiseases(data.existingdiseases || []);
        setAllergies(data.allergies || []);
        setMedications(data.medications || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name || !age || !gender || !height || !weight) {
      setError('Please fill in all required fields');
      return;
    }

    const ageNum = parseInt(age);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 150) {
      setError('Please enter a valid age');
      return;
    }

    if (isNaN(heightNum) || heightNum <= 0 || heightNum > 300) {
      setError('Please enter a valid height in cm');
      return;
    }

    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
      setError('Please enter a valid weight in kg');
      return;
    }

    setSaving(true);

    try {
      const profileData = {
        userid: user!.id,
        name,
        age: ageNum,
        gender,
        height: heightNum,
        weight: weightNum,
        existingdiseases: existingDiseases,
        allergies: allergies,
        medications: medications,
        updatedat: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('healthprofiles')
        .upsert(profileData, { onConflict: 'userid' });

      if (error) {
        console.error('Supabase error:', error);
        setError(`Failed to save profile: ${error.message}`);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(`An error occurred: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const addItem = (type: 'disease' | 'allergy' | 'medication') => {
    switch (type) {
      case 'disease':
        if (newDisease.trim()) {
          setExistingDiseases([...existingDiseases, newDisease.trim()]);
          setNewDisease('');
        }
        break;
      case 'allergy':
        if (newAllergy.trim()) {
          setAllergies([...allergies, newAllergy.trim()]);
          setNewAllergy('');
        }
        break;
      case 'medication':
        if (newMedication.trim()) {
          setMedications([...medications, newMedication.trim()]);
          setNewMedication('');
        }
        break;
    }
  };

  const removeItem = (type: 'disease' | 'allergy' | 'medication', index: number) => {
    switch (type) {
      case 'disease':
        setExistingDiseases(existingDiseases.filter((_, i) => i !== index));
        break;
      case 'allergy':
        setAllergies(allergies.filter((_, i) => i !== index));
        break;
      case 'medication':
        setMedications(medications.filter((_, i) => i !== index));
        break;
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loading text="Loading profile..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Profile</h1>
          <p className="text-gray-600">
            Keep your health information up to date for better predictions
          </p>
        </div>

        {success && (
          <Alert variant="success" className="mb-6">
            Profile saved successfully!
          </Alert>
        )}

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            </div>
          </CardHeader>
          <CardContent>
            <form 
  onSubmit={async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await handleSubmit(e);
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  }}
  className="space-y-6"
>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />

                <Input
                  label="Age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="30"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <Input
                  label="Height (cm)"
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="170"
                  required
                />

                <Input
                  label="Weight (kg)"
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70"
                  required
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Medical History
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Existing Diseases
                    </label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        type="text"
                        value={newDisease}
                        onChange={(e) => setNewDisease(e.target.value)}
                        placeholder="e.g., Diabetes, Hypertension"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addItem('disease');
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => addItem('disease')}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {existingDiseases.map((disease, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          {disease}
                          <button
                            type="button"
                            onClick={() => removeItem('disease', index)}
                            className="hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allergies
                    </label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        type="text"
                        value={newAllergy}
                        onChange={(e) => setNewAllergy(e.target.value)}
                        placeholder="e.g., Peanuts, Penicillin"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addItem('allergy');
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => addItem('allergy')}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {allergies.map((allergy, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                        >
                          {allergy}
                          <button
                            type="button"
                            onClick={() => removeItem('allergy', index)}
                            className="hover:bg-red-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Medications
                    </label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        type="text"
                        value={newMedication}
                        onChange={(e) => setNewMedication(e.target.value)}
                        placeholder="e.g., Aspirin, Metformin"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addItem('medication');
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => addItem('medication')}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {medications.map((medication, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                        >
                          {medication}
                          <button
                            type="button"
                            onClick={() => removeItem('medication', index)}
                            className="hover:bg-green-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving} size="lg" className="flex-1">
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
