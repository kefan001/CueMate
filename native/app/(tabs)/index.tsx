import { Link } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { nativeCompanions } from '../../src/mock';
import { theme } from '../../src/theme';

export default function DiscoveryScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>CueMate</Text>
      <Text style={styles.subtitle}>原生端发现页骨架</Text>

      {nativeCompanions.map(companion => (
        <Link key={companion.id} href={`/companion/${companion.id}`} asChild>
          <View style={styles.card}>
            <Image source={{ uri: companion.avatar }} style={styles.avatar} />
            <View style={styles.info}>
              <Text style={styles.name}>{companion.name}</Text>
              <Text style={styles.meta}>{companion.level}</Text>
              <Text style={styles.meta}>¥{companion.hourlyRate}/小时 · {companion.distance}</Text>
              <Text style={styles.meta}>评分 {companion.rating} · {companion.reviewCount} 条</Text>
            </View>
          </View>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },
  title: { color: theme.colors.text, fontSize: 30, fontWeight: '700', marginTop: 36 },
  subtitle: { color: theme.colors.textMuted, fontSize: 14, marginBottom: 8 },
  card: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  avatar: { width: 72, height: 72, borderRadius: 16 },
  info: { flex: 1, gap: 4 },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  meta: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18 },
});
