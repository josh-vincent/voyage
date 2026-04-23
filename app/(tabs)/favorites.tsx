import { useCallback, useMemo, useState } from 'react';
import { View, Pressable, FlatList, RefreshControl, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import GeoGlyph from '@/components/GeoGlyph';
import {
  listTracked,
  removeTracked,
  updateTrackedPrice,
  setTrackedFrequency,
  type TrackedRoute,
} from '@/utils/trackedStorage';
import type { FlightOffer, ScanFrequency } from '@/lib/flightTypes';
import { api } from '@/lib/apiBase';
import { findAirport } from '@/lib/airports';

const FREQUENCIES: ScanFrequency[] = ['daily', 'weekly', 'manual'];

export default function TrackedTab() {
  const insets = useSafeAreaInsets();
  const [routes, setRoutes] = useState<TrackedRoute[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRoutes(await listTracked());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const recheck = async (r: TrackedRoute) => {
    setChecking(r.id);
    try {
      const res = await fetch(api('/api/flights/search'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          origin: r.origin,
          destination: r.destination,
          departureDate: r.departureDate,
          returnDate: r.returnDate,
          adults: r.adults,
          cabin: r.cabin,
        }),
      });
      if (!res.ok) throw new Error('Check failed');
      const { offers } = (await res.json()) as { offers: FlightOffer[] };
      const lowest = offers[0] ? parseFloat(offers[0].totalAmount) : 0;
      if (lowest <= 0) {
        Alert.alert('No offers', 'No prices available right now.');
        return;
      }
      await updateTrackedPrice(r.id, lowest, offers[0].totalCurrency);
      await load();
    } catch (e: any) {
      Alert.alert('Check failed', e?.message ?? 'Unknown error');
    } finally {
      setChecking(null);
    }
  };

  const cycleFrequency = async (r: TrackedRoute) => {
    const current = r.scanFrequency ?? 'daily';
    const next = FREQUENCIES[(FREQUENCIES.indexOf(current) + 1) % FREQUENCIES.length];
    await setTrackedFrequency(r.id, next);
    await load();
  };

  const remove = async (id: string) => {
    await removeTracked(id);
    await load();
  };

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary" style={{ paddingTop: insets.top }}>
      <View className="px-global pt-4 pb-2">
        <ThemedText className="text-3xl font-bold">Watching</ThemedText>
        <ThemedText className="opacity-60 mt-1 text-sm">
          I'll keep an eye on prices and ping you when they drop.
        </ThemedText>
      </View>
      <FlatList
        data={routes}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View
            className="rounded-3xl mt-6 items-center py-12 px-6"
            style={{ backgroundColor: '#efece6' }}
          >
            <GeoGlyph kind="skyline-generic" size={72} color="#131a2a" accent="#c97d4a" />
            <ThemedText
              className="mt-4"
              style={{ fontFamily: 'YoungSerif_400Regular', fontSize: 22, color: '#131a2a' }}
            >
              Nothing on the watchlist yet
            </ThemedText>
            <ThemedText
              className="mt-2 text-center"
              style={{ color: '#131a2a', opacity: 0.65, fontSize: 13, fontStyle: 'italic' }}
            >
              Save a route and I&apos;ll keep watch for soft mornings, sudden drops, and the moment a
              fare gets interesting.
            </ThemedText>
            <Pressable
              onPress={() => router.push('/(tabs)/(home)')}
              className="mt-5 px-4 py-2 bg-black dark:bg-white rounded-full"
            >
              <ThemedText className="text-white dark:text-black">Find me a deal</ThemedText>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <TrackedRow
            route={item}
            checking={checking === item.id}
            onCheck={() => recheck(item)}
            onCycleFrequency={() => cycleFrequency(item)}
            onRemove={() => remove(item.id)}
          />
        )}
      />
    </View>
  );
}

function TrackedRow({
  route,
  checking,
  onCheck,
  onCycleFrequency,
  onRemove,
}: {
  route: TrackedRoute;
  checking: boolean;
  onCheck: () => void;
  onCycleFrequency: () => void;
  onRemove: () => void;
}) {
  const from = findAirport(route.origin);
  const to = findAirport(route.destination);
  const history = route.history ?? [];
  const previous = history.length > 1 ? history[history.length - 2].price : undefined;
  const delta = previous !== undefined ? route.lastPrice - previous : 0;
  const lowest = route.lowestPrice ?? route.lastPrice;
  const isAtLowest = route.lastPrice <= lowest;

  const freq = route.scanFrequency ?? 'daily';

  const deltaColor =
    delta < 0 ? 'text-emerald-600 dark:text-emerald-400' : delta > 0 ? 'text-red-500' : 'opacity-50';
  const deltaIcon = delta < 0 ? '↓' : delta > 0 ? '↑' : '→';
  const deltaLabel =
    delta === 0
      ? 'no change'
      : `${deltaIcon} ${route.currency} ${Math.abs(Math.round(delta))}`;

  return (
    <View
      className="bg-light-primary dark:bg-dark-secondary rounded-3xl p-4 mb-3"
      style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
    >
      <View className="flex-row items-start">
        <View className="flex-1">
          <ThemedText className="font-bold text-lg">
            {from?.city ?? route.origin} → {to?.city ?? route.destination}
          </ThemedText>
          <ThemedText className="text-xs opacity-60 mt-1">
            {route.departureDate}
            {route.returnDate ? ` – ${route.returnDate}` : ''} · {route.adults} adult
            {route.adults > 1 ? 's' : ''} · {route.cabin.replace('_', ' ')}
          </ThemedText>
        </View>
        <View className="items-end">
          <ThemedText className="text-2xl font-bold">
            {route.currency} {Math.round(route.lastPrice)}
          </ThemedText>
          <ThemedText className={`text-xs mt-0.5 ${deltaColor}`}>{deltaLabel}</ThemedText>
        </View>
      </View>

      {history.length > 1 ? (
        <Sparkline history={history} currency={route.currency} />
      ) : null}

      <View className="flex-row items-center mt-3">
        <View className="flex-row items-center">
          <Icon name="TrendingDown" size={12} />
          <ThemedText className="text-xs opacity-70 ml-1">
            Lowest {route.currency} {Math.round(lowest)}
          </ThemedText>
          {isAtLowest && lowest < route.lastPrice + 1 && history.length > 1 ? (
            <ThemedText className="text-xs ml-2 text-emerald-600 dark:text-emerald-400">
              · at best
            </ThemedText>
          ) : null}
        </View>
        <ThemedText className="ml-auto text-xs opacity-50">
          {timeAgo(route.lastCheckedAt)}
        </ThemedText>
      </View>

      <View className="flex-row items-center mt-3">
        {route.bookedOrderId ? (
          <Pressable
            onPress={() => router.push({ pathname: '/screens/trip-detail', params: { id: route.bookedOrderId! } })}
            className="flex-row items-center px-3 py-1.5 rounded-full bg-emerald-600"
          >
            <Icon name="Check" size={12} color="white" />
            <ThemedText className="text-xs ml-1 text-white">Booked · view trip</ThemedText>
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={onCycleFrequency}
              className="flex-row items-center px-3 py-1.5 rounded-full bg-light-secondary dark:bg-white/10 mr-2"
            >
              <Icon name="Clock" size={12} />
              <ThemedText className="text-xs ml-1 capitalize">Scan {freq}</ThemedText>
            </Pressable>
            <Pressable
              onPress={onCheck}
              disabled={checking}
              className="flex-row items-center px-3 py-1.5 rounded-full bg-black dark:bg-white"
            >
              <Icon name="RefreshCw" size={12} color="white" />
              <ThemedText className="text-xs ml-1 text-white dark:text-black">
                {checking ? 'Checking…' : 'Check now'}
              </ThemedText>
            </Pressable>
          </>
        )}
        <Pressable
          onPress={onRemove}
          className="ml-auto w-8 h-8 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700"
        >
          <Icon name="Trash2" size={14} />
        </Pressable>
      </View>
    </View>
  );
}

function Sparkline({
  history,
  currency,
}: {
  history: { price: number; at: number }[];
  currency: string;
}) {
  const values = useMemo(() => history.slice(-8).map((h) => h.price), [history]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return (
    <View className="flex-row items-end h-8 mt-3">
      {values.map((v, i) => {
        const heightPct = ((v - min) / range) * 100;
        const minH = 4;
        const h = minH + (heightPct / 100) * 24;
        const isLast = i === values.length - 1;
        return (
          <View
            key={i}
            style={{ height: h }}
            className={`flex-1 mx-0.5 rounded-t ${isLast ? 'bg-black dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-700'}`}
          />
        );
      })}
    </View>
  );
}

function timeAgo(ts: number) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
