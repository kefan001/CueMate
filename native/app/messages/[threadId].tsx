import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { nativeThreads } from '../../src/mock';
import { theme } from '../../src/theme';

export default function ChatThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const thread = nativeThreads.find(item => item.id === threadId) ?? nativeThreads[0];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{thread.peerName}</Text>
        <Text style={styles.subtitle}>原生聊天详情页骨架</Text>
      </View>

      <View style={styles.bubbleLeft}>
        <Text style={styles.bubbleText}>{thread.preview}</Text>
      </View>

      <View style={styles.bubbleRight}>
        <Text style={styles.bubbleText}>收到，我这边已经记下了。</Text>
      </View>

      <View style={styles.inputBar}>
        <Text style={styles.placeholder}>这里后续接原生输入框、录音、图片和 WebSocket。</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  header: { marginTop: 36, marginBottom: theme.spacing.lg, gap: 4 },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: theme.colors.textMuted, fontSize: 13 },
  bubbleLeft: {
    alignSelf: 'flex-start',
    maxWidth: '78%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    maxWidth: '78%',
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  bubbleText: { color: theme.colors.text, fontSize: 14, lineHeight: 22 },
  inputBar: {
    marginTop: 'auto',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  placeholder: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 20 },
});
