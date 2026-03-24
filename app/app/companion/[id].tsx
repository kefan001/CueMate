import { useLocalSearchParams } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { nativeCompanions } from '../../src/mock';
import { theme } from '../../src/theme';

export default function CompanionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const companion = nativeCompanions.find(item => item.id === id) ?? nativeCompanions[0];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Image source={{ uri: companion.avatar }} style={styles.hero} />
      <Text style={styles.title}>{companion.name}</Text>
      <Text style={styles.level}>{companion.level}</Text>
      <Text style={styles.meta}>¥{companion.hourlyRate}/小时 · {companion.distance}</Text>
      <Text style={styles.meta}>评分 {companion.rating} · {companion.reviewCount} 条评价</Text>
      <Text style={styles.bio}>{companion.bio}</Text>

      <View style={styles.tagRow}>
        {companion.tags.map(tag => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },
  hero: { width: '100%', height: 280, borderRadius: theme.radius.lg, marginTop: 36 },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: '700' },
  level: { color: theme.colors.gold, fontSize: 14, fontWeight: '600' },
  meta: { color: theme.colors.textMuted, fontSize: 13 },
  bio: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: { color: theme.colors.textMuted, fontSize: 12 },
});
