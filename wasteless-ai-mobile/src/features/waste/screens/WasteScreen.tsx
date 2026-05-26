import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/theme';
import { listInventoryItems } from '@/features/inventory/api';
import type { InventoryItem } from '@/features/inventory/types';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getApiErrorMessage } from '@/services/api/client';
import { useAuth } from '@/store/authStore';
import { getWasteData, logWaste } from '../api';
import { WASTE_REASONS, type WastePageData, type WasteReason } from '../types';

function formatItemMeta(item: InventoryItem) {
  return [item.quantity, item.unit, item.storageLocation ?? item.categoryName].filter(Boolean).join(' ');
}

function parseQuantity(value: string) {
  const quantity = Number(value.trim().replace(',', '.'));
  return Number.isFinite(quantity) && quantity > 0 ? quantity : null;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedText }]}>{label}</Text>
    </View>
  );
}

function ReasonPill({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.reasonPill,
        {
          backgroundColor: selected ? colors.tint : colors.surface,
          borderColor: selected ? colors.tint : colors.border,
        },
        pressed ? styles.pressed : null,
      ]}>
      <Text style={[styles.reasonText, { color: selected ? colors.onTint : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function WasteScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();
  const [data, setData] = useState<WastePageData | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState<WasteReason>('expired');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () => inventory.find((item) => item.id === selectedProductId) ?? null,
    [inventory, selectedProductId],
  );

  const stats = useMemo(
    () =>
      data
        ? [
            { label: 'Total logs', value: data.stats.totalEvents },
            { label: 'Last 30 days', value: data.stats.recentEvents },
            { label: 'Top reason', value: data.stats.topReason },
            { label: 'Prevented', value: data.stats.preventedUpdates },
          ]
        : [],
    [data],
  );

  const loadWaste = useCallback(
    async (refreshing = false) => {
      if (!token) {
        setError('Sign in to view waste data.');
        setIsLoading(false);
        return;
      }

      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const [wasteData, inventoryData] = await Promise.all([
          getWasteData(token),
          listInventoryItems(token, {
            page: 1,
            pageSize: 50,
            status: 'all',
            sort: 'expiration_asc',
          }),
        ]);

        setData(wasteData);
        setInventory(inventoryData.items);
        setSelectedProductId((current) => current ?? inventoryData.items[0]?.id ?? null);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Unable to load waste data.'));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadWaste();
  }, [loadWaste]);

  async function handleLogWaste() {
    if (!token || isSubmitting) return;

    const parsedQuantity = parseQuantity(quantity);
    if (!selectedProduct) {
      setError('Select an inventory item first.');
      return;
    }

    if (!parsedQuantity) {
      setError('Quantity must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      setFeedback(
        await logWaste(token, {
          productId: selectedProduct.id,
          quantity: parsedQuantity,
          reason,
          notes: notes.trim() || undefined,
        }),
      );
      setQuantity('1');
      setNotes('');
      await loadWaste(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to log waste.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen
      contentContainerStyle={styles.screenContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            void loadWaste(true);
          }}
          tintColor={colors.tint}
        />
      }
      title="Waste"
      subtitle="Log wasted products and review patterns that can be reduced next time.">
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : (
        <>
          {data ? (
            <View style={styles.statsGrid}>
              {stats.map((item) => (
                <StatCard key={item.label} label={item.label} value={item.value} />
              ))}
            </View>
          ) : null}

          <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.panelTitle, { color: colors.text }]}>Log waste</Text>

            {inventory.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                <Text style={[styles.emptyCopy, { color: colors.mutedText }]}>
                  Add inventory items before logging waste.
                </Text>
              </View>
            ) : (
              <View style={styles.productList}>
                {inventory.slice(0, 8).map((item) => {
                  const selected = item.id === selectedProductId;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={item.id}
                      onPress={() => setSelectedProductId(item.id)}
                      style={({ pressed }: { pressed: boolean }) => [
                        styles.productChoice,
                        {
                          backgroundColor: selected ? '#E7F7ED' : colors.background,
                          borderColor: selected ? colors.tint : colors.border,
                        },
                        pressed ? styles.pressed : null,
                      ]}>
                      <Ionicons
                        name={selected ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={selected ? colors.tint : colors.mutedText}
                      />
                      <View style={styles.productCopy}>
                        <Text style={[styles.rowTitle, { color: colors.text }]}>{item.name}</Text>
                        <Text style={[styles.rowMeta, { color: colors.mutedText }]}>
                          {formatItemMeta(item) || 'In inventory'}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedText }]}>Quantity</Text>
                <TextInput
                  inputMode="decimal"
                  keyboardType="decimal-pad"
                  onChangeText={setQuantity}
                  placeholder="1"
                  placeholderTextColor={colors.placeholder}
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                  value={quantity}
                />
              </View>
              <View style={[styles.inputGroup, styles.notesGroup]}>
                <Text style={[styles.inputLabel, { color: colors.mutedText }]}>Notes</Text>
                <TextInput
                  onChangeText={setNotes}
                  placeholder="Optional"
                  placeholderTextColor={colors.placeholder}
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                  value={notes}
                />
              </View>
            </View>

            <View style={styles.reasonRow}>
              {WASTE_REASONS.map((option) => (
                <ReasonPill
                  key={option.value}
                  label={option.label}
                  onPress={() => setReason(option.value)}
                  selected={reason === option.value}
                />
              ))}
            </View>

            <Button
              disabled={isSubmitting || !selectedProduct}
              title={isSubmitting ? 'Logging...' : 'Log waste'}
              onPress={() => {
                void handleLogWaste();
              }}
            />
          </View>

          {error ? (
            <View style={[styles.feedbackBox, { borderColor: colors.danger }]}>
              <Text style={[styles.feedbackText, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : null}

          {feedback ? (
            <View style={[styles.feedbackBox, { borderColor: colors.tint }]}>
              <Text style={[styles.feedbackText, { color: colors.text }]}>{feedback}</Text>
            </View>
          ) : null}

          {data ? (
            <>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Reason breakdown</Text>
                {data.reasonBreakdown.length === 0 ? (
                  <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                    <Text style={[styles.emptyCopy, { color: colors.mutedText }]}>
                      Waste reasons will appear after the first log.
                    </Text>
                  </View>
                ) : (
                  data.reasonBreakdown.map((item) => (
                    <View key={item.reason} style={[styles.breakdownRow, { borderColor: colors.border }]}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>{item.label}</Text>
                      <Text style={[styles.countText, { color: colors.mutedText }]}>{item.count}</Text>
                    </View>
                  ))
                )}
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent logs</Text>
                {data.recentLogs.length === 0 ? (
                  <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                    <Text style={[styles.emptyCopy, { color: colors.mutedText }]}>
                      No waste has been logged yet.
                    </Text>
                  </View>
                ) : (
                  data.recentLogs.map((log) => (
                    <View
                      key={log.id}
                      style={[styles.logCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.logHeader}>
                        <Text style={[styles.rowTitle, { color: colors.text }]}>{log.productName}</Text>
                        <Text style={[styles.reasonBadge, { color: colors.tint }]}>{log.reasonLabel}</Text>
                      </View>
                      <Text style={[styles.rowMeta, { color: colors.mutedText }]}>
                        {log.quantityLabel} - {log.categoryName}
                      </Text>
                      {log.notes ? (
                        <Text style={[styles.noteText, { color: colors.mutedText }]}>{log.notes}</Text>
                      ) : null}
                    </View>
                  ))
                )}
              </View>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    gap: 16,
  },
  centerState: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 140,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  panel: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  productList: {
    gap: 8,
  },
  productChoice: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 10,
  },
  productCopy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  rowMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroup: {
    flex: 1,
    gap: 6,
  },
  notesGroup: {
    flex: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonPill: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  breakdownRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  countText: {
    fontSize: 15,
    fontWeight: '800',
  },
  logCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 5,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  reasonBadge: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
  },
  feedbackBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  emptyBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
  },
  emptyCopy: {
    fontSize: 14,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.72,
  },
});
