import { useCallback, useState } from 'react';
import { View, Pressable, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import GeoGlyph from '@/components/GeoGlyph';
import ThemeToggle from '@/components/ThemeToggle';
import { listOrders, listTracked, listRecents } from '@/utils/trackedStorage';
import { INK, PARCHMENT, PARCHMENT_DEEP, PARCHMENT_COOL, SERIF, MOSS } from '@/lib/theme';

type Counts = { trips: number; tracked: number; recents: number };

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [counts, setCounts] = useState<Counts>({ trips: 0, tracked: 0, recents: 0 });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [orders, tracked, recents] = await Promise.all([
          listOrders(),
          listTracked(),
          listRecents(),
        ]);
        if (!active) return;
        setCounts({ trips: orders.length, tracked: tracked.length, recents: recents.length });
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <View
      className="flex-1 bg-light-primary dark:bg-dark-primary"
      style={{ paddingTop: insets.top }}
    >
      <View className="px-global pt-4 pb-2 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <ThemedText style={{ fontFamily: SERIF, fontSize: 14, opacity: 0.55 }}>
            The traveler
          </ThemedText>
          <ThemedText
            className="mt-1"
            style={{ fontFamily: SERIF, fontSize: 30, letterSpacing: -0.3 }}
          >
            Hello, wanderer
          </ThemedText>
          <ThemedText
            className="opacity-65 mt-1"
            style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic' }}
          >
            Everything you've set in motion, in one place.
          </ThemedText>
        </View>
        <View className="flex-row items-center">
          <ThemeToggle />
          <Pressable
            onPress={() => router.push('/screens/notifications')}
            className="ml-2 w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: PARCHMENT_DEEP }}
          >
            <Icon name="Bell" size={16} color={INK} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className="rounded-3xl mt-4 overflow-hidden"
          style={{ backgroundColor: INK }}
        >
          <View className="flex-row items-center px-5 pt-5 pb-3">
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: PARCHMENT }}
            >
              <Text style={{ fontFamily: SERIF, fontSize: 18, color: INK }}>T</Text>
            </View>
            <View className="ml-3 flex-1">
              <Text
                style={{ fontFamily: SERIF, fontSize: 20, color: PARCHMENT, letterSpacing: -0.2 }}
              >
                Traveler
              </Text>
              <Text
                style={{
                  fontFamily: SERIF,
                  fontSize: 13,
                  color: PARCHMENT,
                  opacity: 0.65,
                  fontStyle: 'italic',
                  marginTop: 2,
                }}
              >
                Based nowhere in particular
              </Text>
            </View>
            <GeoGlyph kind="compass" size={48} color={PARCHMENT} accent="#c97d4a" />
          </View>

          <View
            className="mx-5 mb-5 rounded-2xl flex-row"
            style={{
              backgroundColor: 'rgba(241,236,228,0.07)',
              borderColor: 'rgba(241,236,228,0.15)',
              borderWidth: 1,
            }}
          >
            <StatCell label="Trips" value={counts.trips} />
            <View style={{ width: 1, backgroundColor: 'rgba(241,236,228,0.12)' }} />
            <StatCell label="Tracked" value={counts.tracked} />
            <View style={{ width: 1, backgroundColor: 'rgba(241,236,228,0.12)' }} />
            <StatCell label="Recent" value={counts.recents} />
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/chat')}
          className="rounded-3xl mt-3 p-5 flex-row items-center"
          style={{ backgroundColor: PARCHMENT_DEEP }}
        >
          <View style={{ marginRight: 14 }}>
            <GeoGlyph kind="sun" size={54} color={INK} accent="#c97d4a" />
          </View>
          <View className="flex-1">
            <Text style={{ fontFamily: SERIF, fontSize: 18, color: INK, letterSpacing: -0.2 }}>
              Plan your next trip
            </Text>
            <Text
              style={{
                fontFamily: SERIF,
                fontSize: 13,
                color: INK,
                opacity: 0.65,
                fontStyle: 'italic',
                marginTop: 3,
              }}
            >
              Ask the concierge for deals, itineraries, alerts.
            </Text>
          </View>
          <Icon name="ArrowUpRight" size={16} color={INK} />
        </Pressable>

        <View className="flex-row mt-3">
          <ShortcutCard
            label="Your trips"
            sub={counts.trips === 0 ? 'Nothing booked yet' : `${counts.trips} in the calendar`}
            glyph="skyline-generic"
            onPress={() => router.push('/(tabs)/trips')}
            bg={PARCHMENT_COOL}
          />
          <View style={{ width: 10 }} />
          <ShortcutCard
            label="Tracked routes"
            sub={counts.tracked === 0 ? 'None watched' : `${counts.tracked} watched`}
            glyph="mountain"
            onPress={() => router.push('/(tabs)/favorites')}
            bg={PARCHMENT_DEEP}
          />
        </View>

        <Text
          className="mt-6 mb-2 px-1"
          style={{ fontFamily: SERIF, fontSize: 18, color: INK, letterSpacing: -0.2 }}
        >
          Your account
        </Text>
        <View className="rounded-3xl overflow-hidden" style={{ backgroundColor: PARCHMENT_DEEP }}>
          <ProfileRow
            title="Account settings"
            hint="Profile, security, preferences"
            icon="Settings"
            onPress={() => router.push('/screens/settings')}
          />
          <Rule />
          <ProfileRow
            title="Edit profile"
            hint="Name, photo, contact info"
            icon="UserRoundPen"
            onPress={() => router.push('/screens/edit-profile')}
          />
          <Rule />
          <ProfileRow
            title="Notifications"
            hint="Price drops, reminders"
            icon="Bell"
            onPress={() => router.push('/screens/notifications')}
          />
        </View>

        <Text
          className="mt-6 mb-2 px-1"
          style={{ fontFamily: SERIF, fontSize: 18, color: INK, letterSpacing: -0.2 }}
        >
          Support
        </Text>
        <View className="rounded-3xl overflow-hidden" style={{ backgroundColor: PARCHMENT_DEEP }}>
          <ProfileRow
            title="Get help"
            hint="Docs, contact, FAQs"
            icon="HelpCircle"
            onPress={() => router.push('/screens/help')}
          />
          <Rule />
          <ProfileRow
            title="Sign out"
            hint="See you on the next trip"
            icon="LogOut"
            onPress={() => router.push('/screens/welcome')}
            tone="brick"
          />
        </View>

        <Text
          className="text-center mt-6"
          style={{
            fontFamily: SERIF,
            fontSize: 13,
            color: INK,
            opacity: 0.45,
            fontStyle: 'italic',
          }}
        >
          Voyage — a small atlas of where you're going.
        </Text>
      </ScrollView>
    </View>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 py-4 items-center">
      <Text
        style={{
          fontFamily: SERIF,
          fontSize: 26,
          color: PARCHMENT,
          letterSpacing: -0.5,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: SERIF,
          fontSize: 11,
          color: PARCHMENT,
          opacity: 0.6,
          marginTop: 2,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function ShortcutCard({
  label,
  sub,
  glyph,
  onPress,
  bg,
}: {
  label: string;
  sub: string;
  glyph: any;
  onPress: () => void;
  bg: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 rounded-3xl p-4"
      style={{ backgroundColor: bg, minHeight: 130 }}
    >
      <View className="flex-row items-start justify-between">
        <GeoGlyph kind={glyph} size={38} color={INK} accent="#c97d4a" />
        <Icon name="ArrowUpRight" size={14} color={INK} />
      </View>
      <Text
        style={{
          fontFamily: SERIF,
          fontSize: 16,
          color: INK,
          marginTop: 14,
          letterSpacing: -0.2,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: SERIF,
          fontSize: 12,
          color: INK,
          opacity: 0.6,
          marginTop: 3,
          fontStyle: 'italic',
        }}
      >
        {sub}
      </Text>
    </Pressable>
  );
}

function ProfileRow({
  title,
  hint,
  icon,
  onPress,
  tone,
}: {
  title: string;
  hint: string;
  icon: string;
  onPress: () => void;
  tone?: 'brick';
}) {
  const color = tone === 'brick' ? '#c97d4a' : INK;
  return (
    <Pressable onPress={onPress} className="px-5 py-4 flex-row items-center">
      <View
        className="w-9 h-9 rounded-full items-center justify-center"
        style={{ backgroundColor: tone === 'brick' ? 'rgba(201,125,74,0.12)' : 'rgba(19,26,42,0.06)' }}
      >
        <Icon name={icon as any} size={15} color={color} />
      </View>
      <View className="flex-1 ml-3">
        <Text style={{ fontFamily: SERIF, fontSize: 15, color, letterSpacing: -0.1 }}>
          {title}
        </Text>
        <Text
          style={{
            fontFamily: SERIF,
            fontSize: 12,
            color: INK,
            opacity: 0.5,
            marginTop: 1,
            fontStyle: 'italic',
          }}
        >
          {hint}
        </Text>
      </View>
      <Icon name="ChevronRight" size={14} color={INK} />
    </Pressable>
  );
}

function Rule() {
  return (
    <View
      style={{ height: 1, marginLeft: 60, backgroundColor: 'rgba(19,26,42,0.06)' }}
    />
  );
}
