import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  QUANTITY_UNITS,
  STORAGE_ZONES,
  type CreateInventoryItemPayload,
  type InventoryCategory,
  type InventoryItem,
  type InventoryMutationResult,
  type QuantityUnit,
  type StorageZone,
} from '../types';

type InventoryFormProps = {
  categories: InventoryCategory[];
  initialItem?: InventoryItem | null;
  isSubmitting: boolean;
  locations: StorageZone[];
  mode: 'create' | 'edit';
  onCancel: () => void;
  onSubmit: (payload: CreateInventoryItemPayload) => Promise<InventoryMutationResult>;
};

type InventoryFormValues = {
  name: string;
  quantity: string;
  unit: string;
  categoryId: string | null;
  purchaseDate: string;
  expirationDate: string;
  storageLocation: string;
  notes: string;
};

type InventoryFormErrors = Partial<Record<keyof InventoryFormValues, string>>;

function toDateInput(value?: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

function getInitialValues(item?: InventoryItem | null): InventoryFormValues {
  return {
    name: item?.name ?? '',
    quantity: item?.quantity ?? '1',
    unit: item?.unit ?? '',
    categoryId: item?.categoryId ?? null,
    purchaseDate: toDateInput(item?.purchaseDate),
    expirationDate: toDateInput(item?.expirationDate),
    storageLocation: item?.storageLocation ?? 'pantry',
    notes: item?.notes ?? '',
  };
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
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

function validateForm(values: InventoryFormValues): InventoryFormErrors {
  const errors: InventoryFormErrors = {};
  const quantityValue = Number(values.quantity);

  if (values.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
    errors.quantity = 'Quantity must be a positive number.';
  }

  if (values.unit.trim().length > 32) {
    errors.unit = 'Unit must be 32 characters or fewer.';
  }

  if (values.storageLocation.trim().length > 32) {
    errors.storageLocation = 'Storage zone must be 32 characters or fewer.';
  }

  if (!isValidDateInput(values.purchaseDate)) {
    errors.purchaseDate = 'Use a valid date.';
  }

  if (!isValidDateInput(values.expirationDate)) {
    errors.expirationDate = 'Use a valid date.';
  }

  if (values.notes.trim().length > 500) {
    errors.notes = 'Notes must be 500 characters or fewer.';
  }

  return errors;
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
      <Text style={[styles.chipText, { color: active ? colors.onTint : colors.text }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function InventoryForm({
  categories,
  initialItem,
  isSubmitting,
  locations,
  mode,
  onCancel,
  onSubmit,
}: InventoryFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [values, setValues] = useState<InventoryFormValues>(() => getInitialValues(initialItem));
  const [errors, setErrors] = useState<InventoryFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const storageOptions = useMemo(
    () => uniqueValues([...STORAGE_ZONES, ...locations, values.storageLocation]),
    [locations, values.storageLocation],
  );

  useEffect(() => {
    setValues(getInitialValues(initialItem));
    setErrors({});
    setFormError(null);
  }, [initialItem, mode]);

  function updateValue(key: keyof InventoryFormValues, value: string | null) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
    setErrors((current) => ({
      ...current,
      [key]: undefined,
    }));
    setFormError(null);
  }

  async function handleSubmit() {
    const nextErrors = validateForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const result = await onSubmit({
      name: values.name.trim(),
      quantity: values.quantity.trim(),
      unit: values.unit.trim() as QuantityUnit,
      categoryId: values.categoryId,
      purchaseDate: values.purchaseDate || null,
      expirationDate: values.expirationDate || null,
      storageLocation: values.storageLocation.trim() as StorageZone,
      notes: values.notes.trim() || null,
    });

    if (!result.success) {
      setFormError(result.error);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {mode === 'create' ? 'Add Item' : 'Edit Item'}
        </Text>
        <Button disabled={isSubmitting} onPress={onCancel} title="Cancel" variant="ghost" />
      </View>

      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {formError ? <Text style={[styles.formError, { color: colors.danger }]}>{formError}</Text> : null}

        <Input
          autoCapitalize="words"
          error={errors.name}
          label="Item name"
          onChangeText={(value) => updateValue('name', value)}
          placeholder="Milk"
          value={values.name}
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Input
              error={errors.quantity}
              keyboardType="decimal-pad"
              label="Quantity"
              onChangeText={(value) => updateValue('quantity', value)}
              value={values.quantity}
            />
          </View>
          <View style={styles.rowItem}>
            <Input
              autoCapitalize="none"
              error={errors.unit}
              label="Unit"
              onChangeText={(value) => updateValue('unit', value)}
              placeholder="pcs"
              value={values.unit}
            />
          </View>
        </View>

        <View style={styles.group}>
          <Text style={[styles.groupLabel, { color: colors.mutedText }]}>Unit</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chips}>
              {QUANTITY_UNITS.map((unit) => (
                <Chip
                  key={unit}
                  active={values.unit === unit}
                  disabled={isSubmitting}
                  label={unit}
                  onPress={() => updateValue('unit', unit)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {categories.length > 0 ? (
          <View style={styles.group}>
            <Text style={[styles.groupLabel, { color: colors.mutedText }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chips}>
                <Chip
                  active={!values.categoryId}
                  disabled={isSubmitting}
                  label="None"
                  onPress={() => updateValue('categoryId', null)}
                />
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    active={values.categoryId === category.id}
                    disabled={isSubmitting}
                    label={category.name}
                    onPress={() => updateValue('categoryId', category.id)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.group}>
          <Text style={[styles.groupLabel, { color: colors.mutedText }]}>Storage</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chips}>
              {storageOptions.map((location) => (
                <Chip
                  key={location}
                  active={values.storageLocation === location}
                  disabled={isSubmitting}
                  label={location}
                  onPress={() => updateValue('storageLocation', location)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        <Input
          autoCapitalize="none"
          error={errors.storageLocation}
          label="Storage zone"
          onChangeText={(value) => updateValue('storageLocation', value)}
          placeholder="pantry"
          value={values.storageLocation}
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Input
              autoCapitalize="none"
              error={errors.purchaseDate}
              label="Purchase date"
              onChangeText={(value) => updateValue('purchaseDate', value)}
              placeholder="YYYY-MM-DD"
              value={values.purchaseDate}
            />
          </View>
          <View style={styles.rowItem}>
            <Input
              autoCapitalize="none"
              error={errors.expirationDate}
              label="Expiration"
              onChangeText={(value) => updateValue('expirationDate', value)}
              placeholder="YYYY-MM-DD"
              value={values.expirationDate}
            />
          </View>
        </View>

        <Input
          error={errors.notes}
          label="Notes"
          multiline
          onChangeText={(value) => updateValue('notes', value)}
          style={styles.notes}
          textAlignVertical="top"
          value={values.notes}
        />

        <Button
          disabled={isSubmitting}
          onPress={handleSubmit}
          title={isSubmitting ? 'Saving...' : mode === 'create' ? 'Add item' : 'Save changes'}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
  },
  form: {
    gap: 16,
    paddingBottom: 36,
  },
  formError: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  group: {
    gap: 8,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    minHeight: 38,
    maxWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  notes: {
    minHeight: 92,
    paddingTop: 14,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.45,
  },
});
