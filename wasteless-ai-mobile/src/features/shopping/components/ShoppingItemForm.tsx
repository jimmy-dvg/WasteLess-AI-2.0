import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ShoppingItemFormState = {
  name: string;
  quantity: string;
  unit: string;
  category: string;
  note: string;
};

type ShoppingItemFormProps = {
  disabled?: boolean;
  draft: ShoppingItemFormState;
  error?: string | null;
  mode: 'create' | 'edit';
  onCancelEdit: () => void;
  onChange: (draft: ShoppingItemFormState) => void;
  onSubmit: () => void;
};

function updateDraft(
  draft: ShoppingItemFormState,
  field: keyof ShoppingItemFormState,
  value: string,
) {
  return {
    ...draft,
    [field]: value,
  };
}

export const emptyShoppingItemFormState: ShoppingItemFormState = {
  name: '',
  quantity: '1',
  unit: '',
  category: '',
  note: '',
};

export function ShoppingItemForm({
  disabled,
  draft,
  error,
  mode,
  onCancelEdit,
  onChange,
  onSubmit,
}: ShoppingItemFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {mode === 'edit' ? 'Edit item' : 'Add item'}
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.mutedText }]}>Name</Text>
        <TextInput
          autoCapitalize="words"
          editable={!disabled}
          onChangeText={(value) => onChange(updateDraft(draft, 'name', value))}
          placeholder="Oats"
          placeholderTextColor={colors.placeholder}
          style={[
            styles.input,
            { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
          ]}
          value={draft.name}
        />
      </View>

      <View style={styles.compactRow}>
        <View style={[styles.inputGroup, styles.compactInput]}>
          <Text style={[styles.label, { color: colors.mutedText }]}>Quantity</Text>
          <TextInput
            editable={!disabled}
            inputMode="decimal"
            keyboardType="decimal-pad"
            onChangeText={(value) => onChange(updateDraft(draft, 'quantity', value))}
            placeholder="1"
            placeholderTextColor={colors.placeholder}
            style={[
              styles.input,
              { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
            ]}
            value={draft.quantity}
          />
        </View>
        <View style={[styles.inputGroup, styles.compactInput]}>
          <Text style={[styles.label, { color: colors.mutedText }]}>Unit</Text>
          <TextInput
            autoCapitalize="none"
            editable={!disabled}
            onChangeText={(value) => onChange(updateDraft(draft, 'unit', value))}
            placeholder="bag"
            placeholderTextColor={colors.placeholder}
            style={[
              styles.input,
              { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
            ]}
            value={draft.unit}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.mutedText }]}>Category</Text>
        <TextInput
          autoCapitalize="words"
          editable={!disabled}
          onChangeText={(value) => onChange(updateDraft(draft, 'category', value))}
          placeholder="Breakfast"
          placeholderTextColor={colors.placeholder}
          style={[
            styles.input,
            { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
          ]}
          value={draft.category}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.mutedText }]}>Note</Text>
        <TextInput
          editable={!disabled}
          multiline
          onChangeText={(value) => onChange(updateDraft(draft, 'note', value))}
          placeholder="Preferred brand, recipe, or reminder"
          placeholderTextColor={colors.placeholder}
          style={[
            styles.input,
            styles.noteInput,
            { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
          ]}
          value={draft.note}
        />
      </View>

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button
          disabled={disabled}
          onPress={onSubmit}
          style={styles.actionButton}
          title={mode === 'edit' ? 'Save changes' : 'Add item'}
        />
        {mode === 'edit' ? (
          <Button
            disabled={disabled}
            onPress={onCancelEdit}
            style={styles.actionButton}
            title="Cancel"
            variant="secondary"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  inputGroup: {
    gap: 6,
  },
  label: {
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
  noteInput: {
    minHeight: 76,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  compactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  compactInput: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flexGrow: 1,
  },
  error: {
    fontSize: 13,
    fontWeight: '700',
  },
});
