/*
  # AI-Driven Public Health Disease Awareness Chatbot Database Schema

  ## Overview
  This migration creates the complete database schema for the healthcare chatbot application.
  
  ## Tables Created
  
  ### 1. healthprofiles
  Stores user health profile information including demographics, medical history, and medications.
  - `id` (uuid, primary key) - Unique identifier for the health profile
  - `userid` (uuid, foreign key) - References auth.users, links profile to authenticated user
  - `name` (text) - User's full name
  - `age` (integer) - User's age
  - `gender` (text) - User's gender
  - `height` (numeric) - User's height in cm
  - `weight` (numeric) - User's weight in kg
  - `existingdiseases` (text[]) - Array of pre-existing medical conditions
  - `allergies` (text[]) - Array of known allergies
  - `medications` (text[]) - Array of current medications
  - `createdat` (timestamptz) - Timestamp when profile was created
  - `updatedat` (timestamptz) - Timestamp when profile was last updated
  
  ### 2. symptomentries
  Stores symptom data entered by users during chatbot sessions.
  - `id` (uuid, primary key) - Unique identifier for symptom entry
  - `userid` (uuid, foreign key) - References auth.users
  - `symptoms` (text[]) - Array of symptoms reported
  - `severity` (integer) - Severity rating from 1-10
  - `duration` (text) - How long symptoms have been present
  - `createdat` (timestamptz) - Timestamp when entry was created
  
  ### 3. diseasepredictions
  Stores AI-generated disease predictions based on symptom analysis.
  - `id` (uuid, primary key) - Unique identifier for prediction
  - `userid` (uuid, foreign key) - References auth.users
  - `symptomentryid` (uuid, foreign key) - References symptomentries
  - `diseasename` (text) - Name of predicted disease
  - `probability` (numeric) - Confidence level (0-100)
  - `risklevel` (text) - Risk assessment: low, medium, high, or critical
  - `recommendations` (text[]) - Array of recommended actions
  - `createdat` (timestamptz) - Timestamp when prediction was made
  
  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data (auth.uid() = userid)
  - Separate policies for SELECT, INSERT, UPDATE, DELETE operations
  - Cascade delete on user account deletion
  
  ## Indexes
  - Indexes on userid columns for efficient queries
  - Index on symptomentryid for joining predictions with symptoms
*/

-- Create healthprofiles table
CREATE TABLE IF NOT EXISTS healthprofiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userid uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL,
  height numeric NOT NULL,
  weight numeric NOT NULL,
  existingdiseases text[] DEFAULT '{}',
  allergies text[] DEFAULT '{}',
  medications text[] DEFAULT '{}',
  createdat timestamptz DEFAULT now(),
  updatedat timestamptz DEFAULT now(),
  UNIQUE(userid)
);

-- Create symptomentries table
CREATE TABLE IF NOT EXISTS symptomentries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userid uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symptoms text[] NOT NULL,
  severity integer NOT NULL CHECK (severity BETWEEN 1 AND 10),
  duration text NOT NULL,
  createdat timestamptz DEFAULT now()
);

-- Create diseasepredictions table
CREATE TABLE IF NOT EXISTS diseasepredictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userid uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symptomentryid uuid REFERENCES symptomentries(id) ON DELETE CASCADE,
  diseasename text NOT NULL,
  probability numeric NOT NULL CHECK (probability BETWEEN 0 AND 100),
  risklevel text NOT NULL CHECK (risklevel IN ('low', 'medium', 'high', 'critical')),
  recommendations text[] DEFAULT '{}',
  createdat timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_healthprofiles_userid ON healthprofiles(userid);
CREATE INDEX IF NOT EXISTS idx_symptomentries_userid ON symptomentries(userid);
CREATE INDEX IF NOT EXISTS idx_symptomentries_createdat ON symptomentries(createdat DESC);
CREATE INDEX IF NOT EXISTS idx_diseasepredictions_userid ON diseasepredictions(userid);
CREATE INDEX IF NOT EXISTS idx_diseasepredictions_symptomentryid ON diseasepredictions(symptomentryid);
CREATE INDEX IF NOT EXISTS idx_diseasepredictions_createdat ON diseasepredictions(createdat DESC);

-- Enable Row Level Security on all tables
ALTER TABLE healthprofiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptomentries ENABLE ROW LEVEL SECURITY;
ALTER TABLE diseasepredictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for healthprofiles table
CREATE POLICY "Users can view own health profile"
  ON healthprofiles FOR SELECT
  TO authenticated
  USING (auth.uid() = userid);

CREATE POLICY "Users can insert own health profile"
  ON healthprofiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can update own health profile"
  ON healthprofiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = userid)
  WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can delete own health profile"
  ON healthprofiles FOR DELETE
  TO authenticated
  USING (auth.uid() = userid);

-- RLS Policies for symptomentries table
CREATE POLICY "Users can view own symptom entries"
  ON symptomentries FOR SELECT
  TO authenticated
  USING (auth.uid() = userid);

CREATE POLICY "Users can insert own symptom entries"
  ON symptomentries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can update own symptom entries"
  ON symptomentries FOR UPDATE
  TO authenticated
  USING (auth.uid() = userid)
  WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can delete own symptom entries"
  ON symptomentries FOR DELETE
  TO authenticated
  USING (auth.uid() = userid);

-- RLS Policies for diseasepredictions table
CREATE POLICY "Users can view own disease predictions"
  ON diseasepredictions FOR SELECT
  TO authenticated
  USING (auth.uid() = userid);

CREATE POLICY "Users can insert own disease predictions"
  ON diseasepredictions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can update own disease predictions"
  ON diseasepredictions FOR UPDATE
  TO authenticated
  USING (auth.uid() = userid)
  WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can delete own disease predictions"
  ON diseasepredictions FOR DELETE
  TO authenticated
  USING (auth.uid() = userid);