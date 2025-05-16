/*
  # Create coaches table and extend profiles

  1. Changes
    - Add new columns to profiles table:
      - `specialty` (text, nullable)
      - `experience_years` (integer, nullable)
      - `hourly_rate` (numeric, nullable)
      - `location` (text, nullable)
      - `bio` (text, nullable)
      - `availability` (text, nullable)

  2. Security
    - Update RLS policies to allow public read access to coach profiles
*/

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS specialty text,
ADD COLUMN IF NOT EXISTS experience_years integer,
ADD COLUMN IF NOT EXISTS hourly_rate numeric,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS availability text;

-- Allow public read access to coach profiles
CREATE POLICY "Anyone can view coach profiles"
  ON profiles
  FOR SELECT
  TO public
  USING (role = 'coach');