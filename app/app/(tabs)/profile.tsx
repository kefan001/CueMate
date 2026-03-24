import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../src/theme';

export default function ProfileScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>我的</Text>
      <Text style={styles.subtitle}>这里对应 Web 版登录态、定位、评价汇总和账号设置。</Text>

      <View style={styles.card}>
        <Text style={styles.label}>账号体系</Text>
        <Text style={styles.body}>原生端建议替换为 AsyncStorage、原生权限和更真实的登录/短信能力。</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>评价体系</Text>
        <Text style={styles.body}>用户端和陪玩端收到的评价，可以在这里做原生化展示与筛选。</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg, gap: theme.spacing.md },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: '700', marginTop: 36 },
  subtitle: { color: theme.colors.textMuted, fontSize: 14, marginBottom: 8 },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 8,
  },
  label: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  body: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 20 },
});
