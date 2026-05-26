import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ROUTES } from '@/navigation/routes';

type QuickLink = {
  title: string;
  subtitle: string;
  href: (typeof ROUTES)[keyof typeof ROUTES];
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const QUICK_LINKS: QuickLink[] = [
  {
    title: 'Household',
    subtitle: 'Members, roles, and shared activity',
    href: ROUTES.household,
    icon: 'people-outline',
  },
  {
    title: 'Categories & Zones',
    subtitle: 'Organize products and storage',
    href: ROUTES.categoriesZones,
    icon: 'file-tray-stacked-outline',
  },
  {
    title: 'Meal Plan',
    subtitle: 'Plan meals around expiring items',
    href: ROUTES.mealPlan,
    icon: 'calendar-outline',
  },
  {
    title: 'AI Assistant',
    subtitle: 'Ask for waste-saving help',
    href: ROUTES.assistant,
    icon: 'sparkles-outline',
  },
  {
    title: 'Waste',
    subtitle: 'Log waste and review patterns',
    href: ROUTES.waste,
    icon: 'leaf-outline',
  },
];

function QuickLinkCard({ link }: { link: QuickLink }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${link.title}`}
      onPress={() => router.push(link.href)}
      style={({ pressed }: { pressed: boolean }) => [
        styles.quickLink,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed ? styles.pressed : null,
      ]}>
      <View style={[styles.quickIcon, { backgroundColor: colors.background }]}>
        <Ionicons name={link.icon} size={22} color={colors.tint} />
      </View>
      <View style={styles.quickCopy}>
        <Text style={[styles.quickTitle, { color: colors.text }]}>{link.title}</Text>
        <Text style={[styles.quickSubtitle, { color: colors.mutedText }]}>{link.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
    </Pressable>
  );
}

export function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Screen
      title="Dashboard"
      subtitle="Welcome back. Your household waste overview will appear here.">
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Today</Text>
        <Text style={[styles.cardBody, { color: colors.mutedText }]}>
          Track expiring products, review pantry changes, and see quick sustainability insights.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick links</Text>
        <View style={styles.quickGrid}>
          {QUICK_LINKS.map((link) => (
            <QuickLinkCard key={link.title} link={link} />
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    marginTop: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  quickGrid: {
    gap: 10,
  },
  quickLink: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 12,
  },
  quickIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  quickCopy: {
    flex: 1,
    gap: 3,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  quickSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.72,
  },
});
