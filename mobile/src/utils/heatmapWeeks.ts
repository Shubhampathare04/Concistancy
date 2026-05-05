/** Build WeeklyHeatmap rows from `/stats/weekly-trend` weeks payload. */
export function buildHeatmapWeeks(trendData: { weeks?: any[] } | undefined): any[][] {
  const weeks = trendData?.weeks;
  if (!weeks || weeks.length === 0) return [];
  return weeks.map((week: any) => {
    const days = [];
    const start = new Date(week.week_start);
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + d);
      days.push({
        date: date.toISOString().split('T')[0],
        completions: d === 0 ? week.completions : 0,
        maxPossible: Math.max(week.completions + (week.skips ?? 0), 1),
      });
    }
    return days;
  });
}
