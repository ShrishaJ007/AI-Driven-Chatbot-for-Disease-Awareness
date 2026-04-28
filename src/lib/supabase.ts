import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface HealthProfile {
  id: string;
  userid: string;
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  existingdiseases: string[];
  allergies: string[];
  medications: string[];
  createdat: string;
  updatedat: string;
}

export interface SymptomEntry {
  id: string;
  userid: string;
  symptoms: string[];
  severity: number;
  duration: string;
  createdat: string;
}

export interface DiseasePrediction {
  id: string;
  userid: string;
  symptomentryid: string | null;
  diseasename: string;
  probability: number;
  risklevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  createdat: string;
}