import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Quote } from 'lucide-react-native';

const SWING_THOUGHTS = [
    "Breathe in, swing out.",
    "Quiet mind, smooth swing.",
    "Stay grounded, stay balanced.",
    "Turn, don’t tilt.",
    "Feel the weight shift.",
    "One motion, no rush.",
    "Trust the tempo.",
    "Let the club do the work.",
    "Flow like water.",
    "Finish the swing, not the shot.",
    "Be still, then explode.",
    "Commit fully.",
    "Loose grip, loose mind.",
    "Quiet hands.",
    "See the target, not the trouble.",
    "Swing through, not to.",
    "Balance is everything.",
    "Feel, don’t force.",
    "Don’t guide—glide.",
    "Stay tall through impact.",
    "Be here now.",
    "Coil like a spring.",
    "Nothing extra.",
    "Swing within yourself.",
    "Target-focused, not ball-focused.",
    "Turn the shoulders, not just the arms.",
    "Keep the triangle.",
    "Eyes on the dimple.",
    "Let go of the outcome.",
    "Light grip, heavy clubhead.",
    "Slow is smooth, smooth is fast.",
    "Finish high and relaxed.",
    "Rhythm > Power.",
    "One shot at a time.",
    "Trust your motion.",
    "Clear the mind, clear the swing.",
    "Make a full turn.",
    "See the shot, be the shot.",
    "Swing like you’ve already hit a good one.",
    "Follow the breath.",
    "Match your tempo to your heart rate.",
    "Be the ball (but don’t actually try to become the ball).",
    "Trust the clubface.",
    "Swing with intention, not tension.",
    "Relax the jaw, relax the body.",
    "Make art, not war.",
    "Tempo is timing, not speed.",
    "Swing with the Earth, not against it.",
    "Silence the ego.",
    "The club is an extension of your body.",
    "Don’t chili-dip this like last time.",
    "Please, Lord, let me find this one.",
    "Tiger would’ve stuck it.",
    "Channel your inner Caddyshack.",
    "What would Happy Gilmore do? (No, don’t do that.)",
    "Just pretend this is Topgolf.",
    "I paid $100 for this round—make it count.",
    "Try not to grunt like a tennis player.",
    "This swing’s for the cart girl.",
    "Don’t break your tee again.",
    "Don't shank. Don’t say shank. Crap.",
    "Remember: It’s *just* a game. Right?",
    "Swing like no one’s watching... even though they are.",
    "Don’t fall over this time.",
    "Smooth like jazz. Or butter. Or jazz-butter.",
    "You're not on tour. Breathe.",
    "If this goes left, it’s the club’s fault.",
    "Act like you know what you’re doing.",
    "Be the YouTube pro you binge-watched last night.",
    "You’re basically playing Augusta in your mind.",
    "Is this the swing that gets me sponsored?",
    "This is for the group chat highlight reel.",
    "Easy does it... you're not Bryson.",
    "Keep it together. They’re filming.",
    "Swing like you're hitting a piñata.",
    "Don’t let your beer spill.",
    "Channel your inner zen... and your inner John Daly.",
    "You *are* the club champion... in your fantasy league.",
    "Just a little baby fade... not a full slice.",
    "Please don’t hit another worm-burner.",
    "This one’s going on Instagram, make it sexy.",
    "Left foot, right foot… wait, what sport is this?",
    "Don’t embarrass yourself in front of the starter again.",
    "If you duff it, make it look intentional.",
    "Hey, at least you look good in that polo.",
    "Swing like you’ve got a tee time with destiny.",
    "Pretend this is mini-golf, but fancier.",
    "One small swing for man, one giant leap for par.",
    "Feel the force, Luke.",
    "This is your moment... to *not* top it.",
    "Keep your head down, but don’t fall asleep.",
    "This isn’t a baseball bat, remember that.",
    "Swing like it owes you money.",
    "A good swing is better than a good excuse.",
    "Smile—your handicap needs the positivity.",
    "Turn like a rotisserie chicken.",
    "If in doubt, just look confident.",
    "May your swing be blessed by the golf gods.",
    "Less Charles Barkley, more Rory McIlroy.",
    "Finish strong. Or at least finish upright.",
    "If nothing else, keep your shoes clean."
  ]
  ;

export function DailySwingThought() {
  const [thought, setThought] = useState<string>('');

  useEffect(() => {
    // Get today's date as a string (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    
    // Use the date to seed the random selection
    // This ensures the same thought is shown all day
    const seed = today.split('-').reduce((acc, val) => acc + parseInt(val), 0);
    const index = seed % SWING_THOUGHTS.length;
    
    setThought(SWING_THOUGHTS[index]);
  }, []);

  if (!thought) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Quote size={20} color="#2D6A4F" />
        <Text style={styles.title}>Today's Swing Thought</Text>
      </View>
      <Text style={styles.thought}>{thought}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1B4332',
  },
  thought: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#52796F',
    lineHeight: 22,
  },
}); 