import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getApiErrorMessage } from '@/services/api/client';
import { useAuth } from '@/store/authStore';
import { getHouseholdData } from '../api';
import type { HouseholdCollaborationData } from '../types';

function formatDate(value: string | null) {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function StatCard({ label, value }: { label: string; value: number }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedText }]}>{label}</Text>
    </View>
  );
}

export function HouseholdScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token, user } = useAuth();
  const [data, setData] = useState<HouseholdCollaborationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(
    () =>
      data
        ? [
            { label: 'Members', value: data.stats.memberCount },
            { label: 'Inventory', value: data.stats.sharedInventoryItems },
            { label: 'Shopping', value: data.stats.openShoppingItems },
            { label: 'Meal plan', value: data.stats.activeMealPlanItems },
            { label: 'Waste logs', value: data.stats.wasteEvents },
            { label: 'Invites', value: data.stats.pendingInvites },
          ]
        : [],
    [data],
  );

  const loadHousehold = useCallback(
    async (refreshing = false) => {
      if (!token) {
        setError('Sign in to view household data.');
        setIsLoading(false);
        return;
      }

      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const nextData = await getHouseholdData(token);
        setData(nextData);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Unable to load household data.'));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadHousehold();
  }, [loadHousehold]);

  return (
    <Screen
      contentContainerStyle={styles.screenContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            void loadHousehold(true);
          }}
          tintColor={colors.tint}
        />
      }
      title="Household"
      subtitle="Shared inventory, collaborators, and recent household activity.">
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : null}

      {!isLoading && error ? (
        <View style={[styles.emptyBox, { borderColor: colors.danger }]}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Household unavailable</Text>
          <Text style={[styles.emptyCopy, { color: colors.mutedText }]}>{error}</Text>
          <Button
            title="Retry"
            variant="secondary"
            onPress={() => {
              void loadHousehold();
            }}
          />
        </View>
      ) : null}

      {!isLoading && data ? (
        <>
          <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.panelHeader}>
              <View style={styles.panelTitleGroup}>
                <Text style={[styles.panelTitle, { color: colors.text }]}>{data.household.name}</Text>
                <Text style={[styles.panelCopy, { color: colors.mutedText }]}>
                  You are {data.currentUserRole}. Timezone: {data.household.timezone ?? 'Not set'}.
                </Text>
              </View>
              <Ionicons name="home-outline" size={22} color={colors.tint} />
            </View>
          </View>

          <View style={styles.statsGrid}>
            {stats.map((item) => (
              <StatCard key={item.label} label={item.label} value={item.value} />
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Members</Text>
            {data.members.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                <Text style={[styles.emptyCopy, { color: colors.mutedText }]}>
                  No household members were found.
                </Text>
              </View>
            ) : (
              data.members.map((member) => (
                <View
                  key={member.id}
                  style={[styles.rowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{member.name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={[styles.rowTitle, { color: colors.text }]}>
                      {member.name}
                      {member.isCurrentUser ? ' (you)' : ''}
                    </Text>
                    <Text style={[styles.rowMeta, { color: colors.mutedText }]}>
                      {member.roleLabel} - {member.email}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {data.invitations.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Pending invitations</Text>
              {data.invitations.map((invitation) => (
                <View
                  key={invitation.id}
                  style={[styles.rowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={20} color={colors.tint} />
                  <View style={styles.rowCopy}>
                    <Text style={[styles.rowTitle, { color: colors.text }]}>{invitation.email}</Text>
                    <Text style={[styles.rowMeta, { color: colors.mutedText }]}>
                      {invitation.roleLabel} - expires {formatDate(invitation.expiresAt)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent activity</Text>
            {data.activity.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                <Text style={[styles.emptyCopy, { color: colors.mutedText }]}>
                  Activity from inventory, shopping, and meal updates will appear here.
                </Text>
              </View>
            ) : (
              data.activity.map((event) => (
                <View key={event.id} style={[styles.activityItem, { borderColor: colors.border }]}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>{event.summary}</Text>
                  <Text style={[styles.rowMeta, { color: colors.mutedText }]}>
                    {event.actorName} - {formatDate(event.createdAt)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <Text style={[styles.footerNote, { color: colors.mutedText }]}>
            Signed in as {user?.email ?? 'your account'}.
          </Text>
        </>
      ) : null}
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
  panel: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  panelTitleGroup: {
    flex: 1,
    gap: 6,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  panelCopy: {
    fontSize: 14,
    lineHeight: 20,
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
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  rowCard: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#DFF2E6',
  },
  avatarText: {
    color: '#2F7D4B',
    fontSize: 16,
    fontWeight: '800',
  },
  rowCopy: {
    flex: 1,
    gap: 3,
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
  activityItem: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 6,
    gap: 4,
  },
  emptyBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  emptyCopy: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerNote: {
    fontSize: 12,
    lineHeight: 18,
  },
});
