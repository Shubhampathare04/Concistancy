import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/store/ThemeContext';
import { authApi } from '../api';
import ScreenWrapper from '@/components/ScreenWrapper';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { font, spacing, radius } from '@/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setError(''); setLoading(true);
    try {
      const res = await authApi.login(email.trim().toLowerCase(), password);
      setAuth({ user: res.data.user, token: res.data.access_token });
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.hero}>
            <View style={[s.logoWrap, { backgroundColor: colors.primaryDim, borderColor: colors.primaryBorder }]}>
              <Ionicons name="flash" size={40} color={colors.primary} />
            </View>
            <Text style={[s.appName, { color: colors.text }]}>Consistency</Text>
            <Text style={[s.tagline, { color: colors.textMuted }]}>Build habits. Track streaks. Level up.</Text>
          </View>

          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
          />
          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            }
          />

          {error ? (
            <View style={[s.errorBox, { backgroundColor: colors.redDim, borderColor: colors.red + '44' }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.red} />
              <Text style={[s.errorTxt, { color: colors.red }]}>{error}</Text>
            </View>
          ) : null}

          <Button label="Login" onPress={handleLogin} loading={loading} style={s.btn} />

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={s.switchRow}>
            <Text style={[s.switchTxt, { color: colors.textMuted }]}>Don't have an account? </Text>
            <Text style={[s.switchLink, { color: colors.primary }]}>Sign up</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xxl },
  hero: { alignItems: 'center', marginBottom: spacing.xxl },
  logoWrap: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, borderWidth: 1 },
  appName: { fontSize: font.xxxl, fontWeight: '800', letterSpacing: -1 },
  tagline: { fontSize: font.sm, marginTop: 6 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.md },
  errorTxt: { fontSize: font.sm, flex: 1 },
  btn: { marginTop: spacing.sm },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  switchTxt: { fontSize: font.sm },
  switchLink: { fontSize: font.sm, fontWeight: '700' },
});
