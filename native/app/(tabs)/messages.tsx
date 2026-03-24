import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { nativeThreads } from '../../src/mock';
import { theme } from '../../src/theme';

export default function MessagesScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>聊天消息</Text>
      <Text style={styles.subtitle}>这里对应原来的消息列表和实时聊天入口。</Text>

      {nativeThreads.map(thread => (
        <Link key={thread.id} href={`/messages/${thread.id}`} asChild>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{thread.peerName}</Text>
              <Text style={styles.time}>{thread.createdAt}</Text>
            </View>
            <Text style={styles.preview}>{thread.preview}</Text>
            {thread.unreadCount > 0 ? <Text style={styles.badge}>{thread.unreadCount} 条未读</Text> : null}
          </View>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  time: { color: theme.colors.textMuted, fontSize: 11 },
  preview: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 20 },
  badge: { color: theme.colors.primary, fontSize: 12, fontWeight: '600' },
});
