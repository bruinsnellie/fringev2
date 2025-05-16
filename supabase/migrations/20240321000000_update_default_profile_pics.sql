-- Update all existing profiles to use the new default image
UPDATE profiles
SET avatar_url = 'https://tdlnohzdghkpfuzyjngk.supabase.co/storage/v1/object/public/defaultimage/default.jpg'
WHERE avatar_url IS NULL OR avatar_url = 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200'; 