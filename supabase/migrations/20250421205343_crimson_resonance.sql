/*
  # Create bookings table and related schemas

  1. New Tables
    - `bookings`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references profiles.id)
      - `coach_id` (uuid, references profiles.id)
      - `date` (timestamptz)
      - `duration` (integer, minutes)
      - `status` (enum: 'pending', 'confirmed', 'completed', 'cancelled')
      - `lesson_type` (text)
      - `price` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for students and coaches
*/

CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) NOT NULL,
  coach_id uuid REFERENCES profiles(id) NOT NULL,
  date timestamptz NOT NULL,
  duration integer NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  lesson_type text NOT NULL,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Students can view their own bookings
CREATE POLICY "Students can view own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

-- Coaches can view bookings where they are the coach
CREATE POLICY "Coaches can view assigned bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = coach_id);

-- Students can create bookings
CREATE POLICY "Students can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

-- Coaches can update their bookings
CREATE POLICY "Coaches can update assigned bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);