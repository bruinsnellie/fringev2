import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { Logo } from '../../components/Logo';
import { useAuth } from '@/hooks/useAuth';

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'coach'>('student');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!fullName || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const { error: signUpError } = await signUp(email, password, fullName, role);
      
      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      router.replace('/(tabs)');
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Logo size={60} />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the Fringe community</Text>
      </View>

      <View style={styles.form}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          autoCapitalize="words"
          value={fullName}
          onChangeText={setFullName}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
        />
        
        <View style={styles.roleContainer}>
          <Text style={styles.roleTitle}>I want to:</Text>
          <View style={styles.roleButtons}>
            <TouchableOpacity 
              style={[styles.roleButton, role === 'student' && styles.roleButtonActive]}
              onPress={() => setRole('student')}
              disabled={isLoading}
            >
              <Text style={role === 'student' ? styles.roleButtonTextActive : styles.roleButtonText}>
                Find a Coach
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleButton, role === 'coach' && styles.roleButtonActive]}
              onPress={() => setRole('coach')}
              disabled={isLoading}
            >
              <Text style={role === 'coach' ? styles.roleButtonTextActive : styles.roleButtonText}>
                Become a Coach
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <Link href="/sign-in" style={styles.link}>
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    marginTop: 80,
    marginBottom: 50,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    marginTop: 24,
    marginBottom: 8,
    color: '#1B4332',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#52796F',
  },
  form: {
    gap: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'Inter_400Regular',
  },
  roleContainer: {
    marginTop: 16,
  },
  roleTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginBottom: 8,
    color: '#1B4332',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  roleButtonActive: {
    backgroundColor: '#2D6A4F',
  },
  roleButtonText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#52796F',
  },
  roleButtonTextActive: {
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  button: {
    height: 50,
    backgroundColor: '#2D6A4F',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  link: {
    marginTop: 16,
    alignSelf: 'center',
  },
  linkText: {
    fontFamily: 'Inter_400Regular',
    color: '#52796F',
  },
  errorText: {
    color: '#E63946',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
});