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

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const handleRegister = async () => {
    if (!name || !email || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError(''); setLoading(true);
    try {
      const res = await authApi.register(email.trim().toLowerCase(), password, name.trim());
      setAuth({ user: res.data.user, token: res.data.access_token });
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={s.hero}>
            <View style={[s.logoWrap, { backgroundColor: colors.purpleDim, borderColor: colors.purple + '40' }]}>
              <Ionicons name="rocket-outline" size={38} color={colors.purple} />
            </View>
            <Text style={[s.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[s.sub, { color: colors.textMuted }]}>Start your consistency journey today</Text>
          </View>

          <Input label="Full Name" placeholder="Your name" value={name} onChangeText={setName} autoCapitalize="words"
            leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />} />
          <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
            leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />} />
          <Input label="Password" placeholder="Min. 6 characters" value={password} onChangeText={setPassword} secureTextEntry={!showPass}
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

          <Button label="Create Account" onPress={handleRegister} loading={loading} style={s.btn} />

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.switchRow}>
            <Text style={[s.switchTxt, { color: colors.textMuted }]}>Already have an account? </Text>
            <Text style={[s.switchLink, { color: colors.primary }]}>Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1, paddingVertical: spacing.xl },
  back: { marginBottom: spacing.lg, alignSelf: 'flex-start', padding: spacing.xs },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  logoWrap: { width: 76, height: 76, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, borderWidth: 1 },
  title: { fontSize: font.xxl, fontWeight: '800' },
  sub: { fontSize: font.sm, marginTop: 6 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.md },
  errorTxt: { fontSize: font.sm, flex: 1 },
  btn: { marginTop: spacing.sm },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  switchTxt: { fontSize: font.sm },
  switchLink: { fontSize: font.sm, fontWeight: '700' },
});
