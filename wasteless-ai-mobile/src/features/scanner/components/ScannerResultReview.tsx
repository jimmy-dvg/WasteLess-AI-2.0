import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/theme';
import {
  STORAGE_ZONES,
  type InventoryCategory,
  type StorageZone,
} from '@/features/inventory/types';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type {
  RecognizedInventoryItem,
  ScannerResult,
  ScanMode,
} from '@/features/scanner/types';

type EditableRecognizedItem = Omit<RecognizedInventoryItem, 'quantity'> & {
  quantity: string;
};

type EditableField =
  | 'name'
  | 'quantity'
  | 'unit'
  | 'category'
  | 'storageZone'
  | 'expirationDate';

type ItemErrors = Partial<Record<EditableField, string>>;
type ReviewErrors = Record<string, ItemErrors>;

type ScannerResultReviewProps = {
  categories: InventoryCategory[];
  errorMessage: string | null;
  feedbackMessage: string | null;
  isSaving: boolean;
  locations: StorageZone[];
  result: ScannerResult;
  onReset: () => void;
  onSave: (items: RecognizedInventoryItem[]) => Promise<void>;
};

const MODE_TITLES: Record<ScanMode, string> = {
  product: 'Product review',
  receipt: 'Receipt review',
};

function toEditableItem(item: RecognizedInventoryItem): EditableRecognizedItem {
  return {
    ...item,
    quantity: String(item.quantity ?? 1),
    unit: item.unit ?? '',
    category: item.category ?? '',
    storageZone: item.storageZone ?? 'pantry',
    expirationDate: item.expirationDate ?? '',
  };
}

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase();
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function isValidDateInput(value: string) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function validateItem(item: EditableRecognizedItem): ItemErrors {
  if (!item.selected) return {};

  const errors: ItemErrors = {};
  const quantityValue = Number(item.quantity);

  if (item.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
    errors.quantity = 'Quantity must be a positive number.';
  }

  if ((item.unit ?? '').trim().length > 32) {
    errors.unit = 'Unit must be 32 characters or fewer.';
  }

  if ((item.category ?? '').trim().length > 80) {
    errors.category = 'Category must be 80 characters or fewer.';
  }

  if ((item.storageZone ?? '').trim().length > 32) {
    errors.storageZone = 'Storage zone must be 32 characters or fewer.';
  }

  if (!isValidDateInput(item.expirationDate ?? '')) {
    errors.expirationDate = 'Use YYYY-MM-DD.';
  }

  return errors;
}

function normalizeForSave(item: EditableRecognizedItem): RecognizedInventoryItem {
  return {
    ...item,
    name: item.name.trim(),
    quantity: Number(item.quantity),
    unit: item.unit?.trim() || undefined,
    category: item.category?.trim() || undefined,
    storageZone: item.storageZone?.trim() || undefined,
    expirationDate: item.expirationDate?.trim() || null,
  };
}

function ConfidenceText({ color, confidence }: { color: string; confidence?: number }) {
  if (typeof confidence !== 'number') return null;

  return (
    <Text style={[styles.confidence, { color }]}>{Math.round(confidence * 100)}% confidence</Text>
  );
}

function Chip({
  active,
  disabled,
  label,
  onPress,
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.tint : colors.surface,
          borderColor: active ? colors.tint : colors.border,
        },
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}>
      <Text
        numberOfLines={1}
        style={[styles.chipText, { color: active ? colors.onTint : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function RecognizedItemEditor({
  categories,
  disabled,
  errors,
  item,
  onChange,
  onToggle,
  storageOptions,
}: {
  categories: InventoryCategory[];
  disabled: boolean;
  errors: ItemErrors;
  item: EditableRecognizedItem;
  onChange: (clientId: string, field: EditableField, value: string) => void;
  onToggle: (clientId: string) => void;
  storageOptions: string[];
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View
      style={[
        styles.itemCard,
        {
          backgroundColor: colors.surface,
          borderColor: item.selected ? colors.border : colors.placeholder,
          opacity: item.selected ? 1 : 0.72,
        },
      ]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.selected, disabled }}
        disabled={disabled}
        onPress={() => onToggle(item.clientId)}
        style={styles.itemHeader}>
        <Ionicons
          color={item.selected ? colors.tint : colors.placeholder}
          name={item.selected ? 'checkbox' : 'square-outline'}
          size={24}
        />
        <View style={styles.itemHeaderText}>
          <Text numberOfLines={1} style={[styles.itemTitle, { color: colors.text }]}>
            {item.name || 'Recognized item'}
          </Text>
          <ConfidenceText color={colors.mutedText} confidence={item.confidence} />
        </View>
      </Pressable>

      <Input
        autoCapitalize="words"
        editable={!disabled}
        error={errors.name}
        label="Name"
        onChangeText={(value) => onChange(item.clientId, 'name', value)}
        value={item.name}
      />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Input
            editable={!disabled}
            error={errors.quantity}
            keyboardType="decimal-pad"
            label="Quantity"
            onChangeText={(value) => onChange(item.clientId, 'quantity', value)}
            value={item.quantity}
          />
        </View>
        <View style={styles.rowItem}>
          <Input
            autoCapitalize="none"
            editable={!disabled}
            error={errors.unit}
            label="Unit"
            onChangeText={(value) => onChange(item.clientId, 'unit', value)}
            placeholder="pcs"
            value={item.unit ?? ''}
          />
        </View>
      </View>

      <Input
        editable={!disabled}
        error={errors.category}
        label="Category"
        onChangeText={(value) => onChange(item.clientId, 'category', value)}
        value={item.category ?? ''}
      />

      {categories.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chips}>
            <Chip
              active={!item.category}
              disabled={disabled}
              label="None"
              onPress={() => onChange(item.clientId, 'category', '')}
            />
            {categories.map((category) => (
              <Chip
                key={category.id}
                active={normalizeText(item.category ?? '') === normalizeText(category.name)}
                disabled={disabled}
                label={category.name}
                onPress={() => onChange(item.clientId, 'category', category.name)}
              />
            ))}
          </View>
        </ScrollView>
      ) : null}

      <Input
        autoCapitalize="none"
        editable={!disabled}
        error={errors.storageZone}
        label="Storage zone"
        onChangeText={(value) => onChange(item.clientId, 'storageZone', value)}
        value={item.storageZone ?? ''}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chips}>
          {storageOptions.map((location) => (
            <Chip
              key={location}
              active={normalizeText(item.storageZone ?? '') === normalizeText(location)}
              disabled={disabled}
              label={location}
              onPress={() => onChange(item.clientId, 'storageZone', location)}
            />
          ))}
        </View>
      </ScrollView>

      <Input
        autoCapitalize="none"
        editable={!disabled}
        error={errors.expirationDate}
        label="Expiration date"
        onChangeText={(value) => onChange(item.clientId, 'expirationDate', value)}
        placeholder="YYYY-MM-DD"
        value={item.expirationDate ?? ''}
      />
    </View>
  );
}

export function ScannerResultReview({
  categories,
  errorMessage,
  feedbackMessage,
  isSaving,
  locations,
  onReset,
  onSave,
  result,
}: ScannerResultReviewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [items, setItems] = useState<EditableRecognizedItem[]>(() =>
    result.items.map(toEditableItem),
  );
  const [errors, setErrors] = useState<ReviewErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const selectedCount = items.filter((item) => item.selected).length;
  const storageOptions = useMemo(
    () =>
      uniqueValues([
        ...STORAGE_ZONES,
        ...locations,
        ...items.map((item) => item.storageZone ?? ''),
      ]),
    [items, locations],
  );

  useEffect(() => {
    setItems(result.items.map(toEditableItem));
    setErrors({});
    setFormError(null);
  }, [result]);

  function updateItem(clientId: string, field: EditableField, value: string) {
    setItems((current) =>
      current.map((item) => (item.clientId === clientId ? { ...item, [field]: value } : item)),
    );
    setErrors((current) => ({
      ...current,
      [clientId]: {
        ...current[clientId],
        [field]: undefined,
      },
    }));
    setFormError(null);
  }

  function toggleItem(clientId: string) {
    setItems((current) =>
      current.map((item) =>
        item.clientId === clientId ? { ...item, selected: !item.selected } : item,
      ),
    );
    setFormError(null);
  }

  async function handleSave() {
    const selectedItems = items.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      setFormError('Select at least one item to add.');
      return;
    }

    const nextErrors = selectedItems.reduce<ReviewErrors>((accumulator, item) => {
      const itemErrors = validateItem(item);
      if (Object.keys(itemErrors).length > 0) {
        accumulator[item.clientId] = itemErrors;
      }
      return accumulator;
    }, {});

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError('Review the highlighted fields before saving.');
      return;
    }

    setFormError(null);
    await onSave(selectedItems.map(normalizeForSave));
  }

  return (
    <View style={styles.container}>
      <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.eyebrow, { color: colors.mutedText }]}>{MODE_TITLES[result.mode]}</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          {result.items.length === 1 ? '1 item recognized' : `${result.items.length} items recognized`}
        </Text>
        <Text style={[styles.copy, { color: colors.mutedText }]}>
          {selectedCount === 1 ? '1 item selected' : `${selectedCount} items selected`}
        </Text>
        {result.warnings?.length ? (
          <View style={[styles.warningBox, { borderColor: colors.border }]}>
            {result.warnings.map((warning) => (
              <Text key={warning} style={[styles.warningText, { color: colors.mutedText }]}>
                {warning}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      {feedbackMessage ? (
        <Text accessibilityLiveRegion="polite" style={[styles.feedback, { color: colors.tint }]}>
          {feedbackMessage}
        </Text>
      ) : null}
      {errorMessage ?? formError ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
          {errorMessage ?? formError}
        </Text>
      ) : null}

      {items.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={30} color={colors.tint} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No items found</Text>
          <Text style={[styles.emptyCopy, { color: colors.mutedText }]}>
            Try a brighter image with the label or receipt text fully visible.
          </Text>
          <Button title="Scan another image" onPress={onReset} style={styles.emptyButton} />
        </View>
      ) : (
        <View style={styles.items}>
          {items.map((item) => (
            <RecognizedItemEditor
              categories={categories}
              disabled={isSaving}
              errors={errors[item.clientId] ?? {}}
              item={item}
              key={item.clientId}
              onChange={updateItem}
              onToggle={toggleItem}
              storageOptions={storageOptions}
            />
          ))}
        </View>
      )}

      {items.length > 0 ? (
        <View style={styles.actions}>
          <Button
            disabled={isSaving || selectedCount === 0}
            onPress={handleSave}
            title={isSaving ? 'Adding items...' : 'Add selected to inventory'}
          />
          <Button disabled={isSaving} onPress={onReset} title="Scan another image" variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  summary: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 7,
    padding: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
  },
  copy: {
    fontSize: 14,
    lineHeight: 20,
  },
  warningBox: {
    borderTopWidth: 1,
    gap: 5,
    marginTop: 6,
    paddingTop: 10,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 19,
  },
  feedback: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  error: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  empty: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 22,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyCopy: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyButton: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
  items: {
    gap: 12,
  },
  itemCard: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 14,
  },
  itemHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  itemHeaderText: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  confidence: {
    fontSize: 12,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    maxWidth: 160,
    minHeight: 38,
    paddingHorizontal: 14,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    gap: 10,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.45,
  },
});
