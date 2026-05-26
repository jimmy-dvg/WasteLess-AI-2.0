import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getApiErrorMessage } from '@/services/api/client';
import { useAuth } from '@/store/authStore';
import { sendAssistantMessage } from '../api';
import type { AssistantChatMessage, AssistantShoppingItem } from '../types';

const STARTER_PROMPTS = [
  'What should I cook first?',
  'Which items are close to expiring?',
  'Add milk and rice to shopping',
];

function ChatBubble({ message }: { message: AssistantChatMessage }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isUser = message.role === 'user';

  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowEnd : null]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.tint : colors.surface,
            borderColor: isUser ? colors.tint : colors.border,
          },
        ]}>
        <Text style={[styles.bubbleText, { color: isUser ? colors.onTint : colors.text }]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

function ShoppingItemPill({ item }: { item: AssistantShoppingItem }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const quantity = [item.quantity, item.unit].filter(Boolean).join(' ');

  return (
    <View style={[styles.shoppingPill, { borderColor: colors.border }]}>
      <Ionicons name="cart-outline" size={15} color={colors.tint} />
      <Text style={[styles.shoppingText, { color: colors.text }]}>
        {item.name}
        {quantity ? ` - ${quantity}` : ''}
      </Text>
    </View>
  );
}

export function AssistantScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>(STARTER_PROMPTS);
  const [shoppingItems, setShoppingItems] = useState<AssistantShoppingItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function sendMessage(content: string) {
    if (!token || isSending) return;

    const trimmed = content.trim();
    if (!trimmed) return;

    const userMessage: AssistantChatMessage = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage].slice(-11);

    setMessages(nextMessages);
    setInput('');
    setError(null);
    setIsSending(true);
    setShoppingItems([]);

    try {
      const response = await sendAssistantMessage(token, nextMessages);
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: response.answer,
        },
      ]);
      setSuggestions(response.followUpSuggestions.length > 0 ? response.followUpSuggestions : STARTER_PROMPTS);
      setShoppingItems(response.shoppingItems);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to reach the assistant.'));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Screen
      contentContainerStyle={styles.screenContent}
      title="AI Assistant"
      subtitle="Ask for low-waste cooking ideas, expiration priorities, or shopping help.">
      {messages.length === 0 ? (
        <View style={[styles.emptyPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="sparkles-outline" size={28} color={colors.tint} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>WasteLessAI is ready</Text>
          <Text style={[styles.emptyCopy, { color: colors.mutedText }]}>
            Start with a question about meals, expiring items, or shopping list updates.
          </Text>
        </View>
      ) : (
        <View style={styles.chatList}>
          {messages.map((message, index) => (
            <ChatBubble key={`${message.role}-${index}-${message.content.slice(0, 8)}`} message={message} />
          ))}
        </View>
      )}

      {isSending ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.tint} size="small" />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>Thinking through your inventory</Text>
        </View>
      ) : null}

      {error ? (
        <View style={[styles.feedbackBox, { borderColor: colors.danger }]}>
          <Text style={[styles.feedbackText, { color: colors.danger }]}>{error}</Text>
        </View>
      ) : null}

      {shoppingItems.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Shopping updates</Text>
          <View style={styles.pillRow}>
            {shoppingItems.map((item) => (
              <ShoppingItemPill key={`${item.name}-${item.quantity ?? ''}`} item={item} />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Try asking</Text>
        <View style={styles.suggestionRow}>
          {suggestions.map((suggestion) => (
            <Pressable
              accessibilityRole="button"
              disabled={isSending}
              key={suggestion}
              onPress={() => {
                void sendMessage(suggestion);
              }}
              style={({ pressed }: { pressed: boolean }) => [
                styles.suggestionPill,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && !isSending ? styles.pressed : null,
                isSending ? styles.disabled : null,
              ]}>
              <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          multiline
          onChangeText={setInput}
          placeholder="Ask WasteLessAI..."
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { color: colors.text }]}
          value={input}
        />
        <Button
          disabled={isSending || input.trim().length === 0}
          title={isSending ? 'Sending...' : 'Send'}
          style={styles.sendButton}
          onPress={() => {
            void sendMessage(input);
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    gap: 16,
  },
  emptyPanel: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 22,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptyCopy: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  chatList: {
    gap: 10,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleRowEnd: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '88%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionPill: {
    minHeight: 38,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shoppingPill: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    gap: 6,
  },
  shoppingText: {
    fontSize: 13,
    fontWeight: '800',
  },
  composer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 10,
  },
  input: {
    minHeight: 74,
    maxHeight: 140,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  sendButton: {
    alignSelf: 'stretch',
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
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.5,
  },
});
