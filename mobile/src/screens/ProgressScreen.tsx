import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '@/store/ThemeContext';
import { spacing, radius, shadow } from '@/constants/theme';
import { Surface } from '@/components/primitives/Surface';
import { CText } from '@/components/primitives/CText';
import { useWeeklyTrend } from '@/features/tasks/hooks/useTasks';

function sparkPath(points: { x: number; y: number }[]) {
  if (!points.length) return '';
  const [first, ...rest] = points;
  return ['M', first.x, first.y, ...rest.flatMap((p) => ['L', p.x, p.y])].join(' ');
}

export function ProgressScreen() {
  const { colors } = useTheme();
  const { data } = useWeeklyTrend(10);

  const series = useMemo(() => {
    const arr: number[] = (data?.weeks ?? data ?? []).map((w: any) => Number(w?.completion_rate ?? w?.rate ?? w?.value ?? 0));
    const s = arr.length ? arr : [0.2, 0.4, 0.35, 0.65, 0.6, 0.75, 0.7, 0.82, 0.78, 0.9];
    return s.map((v) => Math.max(0, Math.min(1, v)));
  }, [data]);

  const points = useMemo(() => {
    const w = 320;
    const h = 120;
    const padX = 10;
    const padY = 10;
    const max = 1;
    const min = 0;
    return series.map((v, i) => {
      const x = padX + (i / Math.max(1, series.length - 1)) * (w - padX * 2);
      const y = padY + (1 - (v - min) / (max - min)) * (h - padY * 2);
      return { x, y };
    });
  }, [series]);

  const line = useMemo(() => sparkPath(points), [points]);

  return (
    <View style={[s.container, { backgroundColor: colors.bg0 }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={{ gap: spacing[1] }}>
          <CText variant="sectionLabel" tone="muted">Progress</CText>
          <CText variant="heroTitle">Momentum lab</CText>
          <CText variant="caption" tone="sub">Charts that feel alive. Insights that feel personal.</CText>
        </View>

        <Surface layer="bg1" rounded="xl" border style={[s.card, shadow.sm]}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <CText variant="title">Weekly trajectory</CText>
            <CText variant="micro" tone="muted">{`${Math.round(series.at(-1)! * 100)}%`}</CText>
          </View>
          <View style={{ marginTop: spacing[3], borderRadius: radius.lg, overflow: 'hidden' }}>
            <Svg width="100%" height={140} viewBox="0 0 320 140">
              <Defs>
                <LinearGradient id="g" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={colors.primary} />
                  <Stop offset="1" stopColor={colors.primary2} />
                </LinearGradient>
                <LinearGradient id="a" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.primaryWash} />
                  <Stop offset="1" stopColor="rgba(0,0,0,0)" />
                </LinearGradient>
              </Defs>
              <Path d={line} stroke="url(#g)" strokeWidth={4} fill="none" />
              <Path
                d={`${line} L 310 130 L 10 130 Z`}
                fill="url(#a)"
              />
            </Svg>
          </View>
          <CText variant="caption" tone="muted" style={{ marginTop: spacing[2] }}>
            Tip: the goal isn’t perfection — it’s faster recovery.
          </CText>
        </Surface>

        <Surface layer="bg1" rounded="xl" border style={[s.card, shadow.sm]}>
          <CText variant="title">Streak heatmap</CText>
          <CText variant="caption" tone="sub" style={{ marginTop: spacing[1] }}>
            (Next) We’ll render a 12-week grid with animated focus + tooltips.
          </CText>
          <View style={s.heat}>
            {Array.from({ length: 12 * 7 }).map((_, i) => {
              const v = series[(i + 3) % series.length];
              const on = v > 0.7;
              return (
                <View
                  key={i}
                  style={[
                    s.cell,
                    {
                      backgroundColor: on ? colors.primary : colors.bg2,
                      opacity: 0.28 + v * 0.72,
                      borderColor: colors.strokeSubtle,
                    },
                  ]}
                />
              );
            })}
          </View>
        </Surface>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing[5], paddingTop: spacing[6], paddingBottom: spacing[20], gap: spacing[4] },
  card: { padding: spacing[5], overflow: 'hidden' },
  heat: { marginTop: spacing[3], flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: { width: 16, height: 16, borderRadius: 5, borderWidth: 1 },
});

