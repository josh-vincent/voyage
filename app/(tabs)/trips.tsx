import { useCallback, useMemo, useState } from 'react';
import { View, Pressable, ScrollView, RefreshControl, Text } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import GeoGlyph from '@/components/GeoGlyph';
import { listOrders, type StoredOrder } from '@/utils/trackedStorage';
import { findAirport } from '@/lib/airports';

const INK = '#131a2a';
const PARCHMENT = '#f1ece4';
const SERIF = 'YoungSerif_400Regular';

type ChecklistItem = { id: string; label: string; doneByDays: number };

const CHECKLIST: ChecklistItem[] = [
  { id: 'passport', label: 'Passport valid 6+ months', doneByDays: 30 },
  { id: 'seat', label: 'Pick a seat', doneByDays: 14 },
  { id: 'esim', label: 'Add an eSIM', doneByDays: 7 },
  { id: 'checkin', label: 'Online check-in', doneByDays: 1 },
];

export default function TripsTab() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setOrders(await listOrders());
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

  const { nextUp, upcoming, past } = useMemo(() => splitTrips(orders), [orders]);

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary" style={{ paddingTop: insets.top }}>
      <View className="px-global pt-4 pb-2">
        <ThemedText style={{ fontFamily: SERIF, fontSize: 14, opacity: 0.55 }}>
          Your trips
        </ThemedText>
        <ThemedText
          className="mt-1"
          style={{ fontFamily: SERIF, fontSize: 28, letterSpacing: -0.3 }}
        >
          {nextUp ? nextUpSubtitle(nextUp) : 'Quiet for now.'}
        </ThemedText>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {orders.length === 0 ? (
          <View
            className="items-center py-14 px-6 rounded-3xl mt-2"
            style={{ backgroundColor: '#efece6' }}
          >
            <GeoGlyph iata="compass" size={72} color={INK} accent="#c97d4a" />
            <ThemedText
              className="mt-4"
              style={{ fontFamily: SERIF, fontSize: 20, color: INK }}
            >
              No bookings yet
            </ThemedText>
            <ThemedText
              className="opacity-60 mt-2 text-center"
              style={{ fontStyle: 'italic', lineHeight: 20 }}
            >
              When you book something, it lives here with the boarding-pass view, countdown, and
              the little things left to do before wheels up.
            </ThemedText>
            <Pressable
              onPress={() => router.push('/(tabs)/(home)')}
              className="mt-5 px-5 py-2.5 rounded-full"
              style={{ backgroundColor: INK }}
            >
              <ThemedText style={{ color: PARCHMENT, fontWeight: '600' }}>Find a flight</ThemedText>
            </Pressable>
          </View>
        ) : null}

        {nextUp ? <BoardingPassCard order={nextUp} /> : null}
        {nextUp ? <ItineraryPreview order={nextUp} /> : null}
        {nextUp ? <StillToDo order={nextUp} /> : null}

        {upcoming.length > 0 ? (
          <View className="mt-7">
            <SectionLabel>Also on the calendar</SectionLabel>
            {upcoming.map((o) => (
              <TripRow key={o.id} order={o} />
            ))}
          </View>
        ) : null}

        {past.length > 0 ? (
          <View className="mt-7">
            <SectionLabel>Looking back</SectionLabel>
            {past.map((o) => (
              <TripRow key={o.id} order={o} muted />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <ThemedText style={{ fontFamily: SERIF, fontSize: 16, marginBottom: 10, opacity: 0.85 }}>
      {children}
    </ThemedText>
  );
}

function BoardingPassCard({ order }: { order: StoredOrder }) {
  const first = order.slices[0];
  const last = order.slices[order.slices.length - 1];
  const from = findAirport(first?.origin);
  const to = findAirport(last?.destination);
  const dep = first ? new Date(first.departing_at) : null;
  const days = dep ? daysUntil(dep) : null;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/screens/trip-detail', params: { id: order.id } })}
      className="rounded-3xl mt-2 overflow-hidden"
      style={{ backgroundColor: INK }}
    >
      <View style={{ padding: 22 }}>
        <View className="flex-row items-center">
          <Text style={{ fontFamily: SERIF, fontSize: 12, color: PARCHMENT, opacity: 0.65 }}>
            Next departure
          </Text>
          <Text
            style={{
              marginLeft: 'auto',
              color: PARCHMENT,
              opacity: 0.55,
              fontSize: 10,
              letterSpacing: 2,
            }}
          >
            {order.bookingReference}
          </Text>
        </View>

        <View className="flex-row items-end mt-4">
          <View className="flex-1">
            <Text style={{ color: PARCHMENT, opacity: 0.6, fontSize: 11, letterSpacing: 1 }}>
              FROM
            </Text>
            <Text
              style={{ fontFamily: SERIF, color: PARCHMENT, fontSize: 34, letterSpacing: -0.5 }}
            >
              {first?.origin}
            </Text>
            <Text style={{ color: PARCHMENT, opacity: 0.55, fontSize: 11, marginTop: 2 }}>
              {from?.city}
            </Text>
          </View>
          <View style={{ paddingHorizontal: 10, paddingBottom: 8 }}>
            <Icon name="Plane" size={18} color={PARCHMENT} />
          </View>
          <View className="flex-1 items-end">
            <Text style={{ color: PARCHMENT, opacity: 0.6, fontSize: 11, letterSpacing: 1 }}>
              TO
            </Text>
            <Text
              style={{ fontFamily: SERIF, color: PARCHMENT, fontSize: 34, letterSpacing: -0.5 }}
            >
              {last?.destination}
            </Text>
            <Text style={{ color: PARCHMENT, opacity: 0.55, fontSize: 11, marginTop: 2 }}>
              {to?.city}
            </Text>
          </View>
        </View>

        <View className="flex-row items-end justify-between mt-5">
          <View>
            <Text style={{ color: PARCHMENT, opacity: 0.55, fontSize: 11, letterSpacing: 1 }}>
              DEPARTS IN
            </Text>
            <Text style={{ fontFamily: SERIF, color: PARCHMENT, fontSize: 44, letterSpacing: -1 }}>
              {days === null ? '—' : days <= 0 ? 'today' : `${days} days`}
            </Text>
          </View>
          <View style={{ opacity: 0.9 }}>
            <GeoGlyph iata={last?.destination} size={76} color={PARCHMENT} accent="#d49565" />
          </View>
        </View>
      </View>

      <View className="flex-row items-center" style={{ paddingHorizontal: 22, paddingBottom: 16 }}>
        <Text style={{ color: PARCHMENT, opacity: 0.5, fontSize: 11 }}>
          {dep ? formatLongDate(dep) : ''}
        </Text>
        <Text style={{ marginLeft: 'auto', color: PARCHMENT, opacity: 0.5, fontSize: 11 }}>
          {first?.carrierName} {first?.flightNumber}
        </Text>
      </View>

      <View
        className="flex-row"
        style={{
          borderTopWidth: 1,
          borderStyle: 'dashed',
          borderColor: 'rgba(241,236,228,0.25)',
          paddingVertical: 14,
          paddingHorizontal: 22,
        }}
      >
        <Text style={{ color: PARCHMENT, opacity: 0.6, fontSize: 11 }}>Passenger</Text>
        <Text style={{ marginLeft: 'auto', color: PARCHMENT, fontSize: 12, fontWeight: '600' }}>
          {order.passengerName}
        </Text>
      </View>
    </Pressable>
  );
}

function ItineraryPreview({ order }: { order: StoredOrder }) {
  return (
    <View className="mt-5">
      <SectionLabel>The flight</SectionLabel>
      <View
        className="rounded-2xl"
        style={{ backgroundColor: '#efece6', paddingVertical: 14, paddingHorizontal: 16 }}
      >
        {order.slices.map((s, i) => {
          const dep = new Date(s.departing_at);
          const arr = new Date(s.arriving_at);
          return (
            <View
              key={i}
              className={i < order.slices.length - 1 ? 'pb-3 mb-3' : ''}
              style={
                i < order.slices.length - 1
                  ? { borderBottomWidth: 1, borderColor: 'rgba(19,26,42,0.1)' }
                  : undefined
              }
            >
              <View className="flex-row items-center">
                <ThemedText
                  style={{ fontFamily: SERIF, color: INK, fontSize: 18, letterSpacing: -0.2 }}
                >
                  {s.origin}
                </ThemedText>
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: 'rgba(19,26,42,0.2)',
                    marginHorizontal: 10,
                  }}
                />
                <ThemedText
                  style={{ fontFamily: SERIF, color: INK, fontSize: 18, letterSpacing: -0.2 }}
                >
                  {s.destination}
                </ThemedText>
              </View>
              <View className="flex-row mt-2">
                <ThemedText style={{ color: INK, opacity: 0.65, fontSize: 12 }}>
                  {formatTime(dep)} · {dep.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </ThemedText>
                <ThemedText
                  className="ml-auto"
                  style={{ color: INK, opacity: 0.65, fontSize: 12 }}
                >
                  {formatTime(arr)} · {s.carrierName} {s.flightNumber}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function StillToDo({ order }: { order: StoredOrder }) {
  const first = order.slices[0];
  const dep = first ? new Date(first.departing_at) : null;
  const days = dep ? daysUntil(dep) : 999;

  return (
    <View className="mt-6">
      <SectionLabel>Still to do</SectionLabel>
      <View>
        {CHECKLIST.map((item) => {
          const active = days <= item.doneByDays;
          return (
            <View
              key={item.id}
              className="flex-row items-center rounded-2xl mb-2"
              style={{
                backgroundColor: active ? '#efece6' : 'transparent',
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderWidth: active ? 0 : 1,
                borderColor: 'rgba(19,26,42,0.08)',
              }}
            >
              <View
                className="w-6 h-6 rounded-full mr-3 items-center justify-center"
                style={{
                  borderWidth: 1.5,
                  borderColor: active ? INK : 'rgba(19,26,42,0.3)',
                }}
              />
              <ThemedText
                style={{
                  fontFamily: SERIF,
                  color: INK,
                  fontSize: 15,
                  opacity: active ? 1 : 0.5,
                  flex: 1,
                }}
              >
                {item.label}
              </ThemedText>
              <ThemedText
                style={{
                  color: INK,
                  opacity: 0.5,
                  fontSize: 11,
                  fontStyle: 'italic',
                }}
              >
                {item.doneByDays === 1 ? 'day before' : `${item.doneByDays}d out`}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function TripRow({ order, muted }: { order: StoredOrder; muted?: boolean }) {
  const first = order.slices[0];
  const last = order.slices[order.slices.length - 1];
  const from = findAirport(first?.origin);
  const to = findAirport(last?.destination);
  const dep = first ? new Date(first.departing_at) : null;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/screens/trip-detail', params: { id: order.id } })}
      className="rounded-2xl p-4 mb-2 flex-row items-center"
      style={{
        backgroundColor: muted ? 'rgba(239,236,230,0.55)' : '#efece6',
      }}
    >
      <View style={{ opacity: muted ? 0.5 : 0.9, marginRight: 12 }}>
        <GeoGlyph iata={last?.destination} size={32} color={INK} accent="#c97d4a" />
      </View>
      <View className="flex-1">
        <ThemedText
          style={{
            fontFamily: SERIF,
            color: INK,
            fontSize: 16,
            opacity: muted ? 0.7 : 1,
          }}
        >
          {from?.city ?? first?.origin} → {to?.city ?? last?.destination}
        </ThemedText>
        <ThemedText style={{ color: INK, opacity: 0.6, fontSize: 12, marginTop: 2 }}>
          {dep ? formatShortDate(dep) : ''} · {order.bookingReference}
        </ThemedText>
      </View>
      <ThemedText style={{ fontFamily: SERIF, color: INK, opacity: 0.75, fontSize: 15 }}>
        {order.totalCurrency} {Math.round(parseFloat(order.totalAmount))}
      </ThemedText>
    </Pressable>
  );
}

function splitTrips(orders: StoredOrder[]): {
  nextUp: StoredOrder | null;
  upcoming: StoredOrder[];
  past: StoredOrder[];
} {
  const now = Date.now();
  const withDep = orders
    .map((o) => ({ order: o, depTs: new Date(o.slices[0]?.departing_at ?? 0).getTime() }))
    .filter((x) => !Number.isNaN(x.depTs));
  const future = withDep.filter((x) => x.depTs >= now).sort((a, b) => a.depTs - b.depTs);
  const past = withDep.filter((x) => x.depTs < now).sort((a, b) => b.depTs - a.depTs);
  return {
    nextUp: future[0]?.order ?? null,
    upcoming: future.slice(1).map((x) => x.order),
    past: past.map((x) => x.order),
  };
}

function nextUpSubtitle(order: StoredOrder): string {
  const first = order.slices[0];
  const last = order.slices[order.slices.length - 1];
  const to = findAirport(last?.destination)?.city ?? last?.destination ?? '';
  const dep = first ? new Date(first.departing_at) : null;
  const days = dep ? daysUntil(dep) : null;
  if (days === null) return `Heading to ${to}`;
  if (days <= 0) return `You're flying today — ${to}`;
  if (days === 1) return `Tomorrow — off to ${to}`;
  if (days <= 7) return `${days} days until ${to}`;
  return `${to} is on the calendar`;
}

function daysUntil(d: Date): number {
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
