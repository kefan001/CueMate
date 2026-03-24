import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { nativeOrders } from '../../src/mock';
import { theme } from '../../src/theme';

export default function OrdersScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>我的订单</Text>
      <Text style={styles.subtitle}>这里对应 Web 版订单闭环和评价体系。</Text>

      {nativeOrders.map(order => (
        <View key={order.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.orderId}>{order.id}</Text>
            <Text style={styles.status}>{order.status}</Text>
          </View>
          <Text style={styles.name}>{order.companionName}</Text>
          <Text style={styles.meta}>{order.date} · {order.timeSlots.join(', ')}</Text>
          <Text style={styles.price}>¥{order.totalPrice}</Text>
        </View>
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
  orderId: { color: theme.colors.textMuted, fontSize: 11 },
  status: { color: theme.colors.primary, fontSize: 12, fontWeight: '600' },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  meta: { color: theme.colors.textMuted, fontSize: 12 },
  price: { color: theme.colors.text, fontSize: 18, fontWeight: '700', marginTop: 4 },
});
