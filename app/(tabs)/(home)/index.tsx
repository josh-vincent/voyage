import { View, Pressable, FlatList, ScrollView, Text } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import SearchBar from '@/components/SearchBar';
import GeoGlyph from '@/components/GeoGlyph';
import { useFlightSearch } from '@/app/contexts/FlightSearchContext';
import { findAirport } from '@/lib/airports';
import type { FlightOffer, CabinClass } from '@/lib/flightTypes';
import {
  routeKey,
  saveTracked,
  listTracked,
  removeTracked,
  addRecent,
  listRecents,
  type RecentSearch,
  type TrackedRoute,
} from '@/utils/trackedStorage';
import { api } from '@/lib/apiBase';
import { INK, PARCHMENT, PARCHMENT_DEEP, PARCHMENT_COOL, SERIF, MOSS, BRICK } from '@/lib/theme';

type Query = {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  adults?: string;
  cabin?: string;
};

type Pill = {
  label: string;
  hint: string;
  destination: string;
  daysOut?: number;
  nights?: number;
  cabin?: CabinClass;
};

const PILLS: Pill[] = [
  { label: 'Weekend escape', hint: 'Two nights, somewhere warm', destination: 'MIA', daysOut: 10, nights: 2 },
  { label: 'City break', hint: 'Culture + late dinners', destination: 'CDG', daysOut: 30, nights: 4 },
  { label: 'Beach reset', hint: 'Toes in sand by Sunday', destination: 'LAX', daysOut: 21, nights: 5 },
  { label: 'Mountain air', hint: 'Cool, quiet, pine', destination: 'DEN', daysOut: 14, nights: 3 },
  { label: 'Sunshine break', hint: 'Chase the sun', destination: 'LAS', daysOut: 18, nights: 3 },
  { label: 'Europe this month', hint: 'Fly cheap, wander far', destination: 'LHR', daysOut: 25, nights: 5 },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Still up?';
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  if (h < 21) return 'Evening';
  return 'Late-night planning?';
}

async function fetchOffers(body: Record<string, unknown>): Promise<FlightOffer[]> {
  const res = await fetch(api('/api/flights/search'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(msg.error || `Search failed (${res.status})`);
  }
  const data = (await res.json().catch(() => ({}))) as { offers?: FlightOffer[] };
  return Array.isArray(data.offers) ? data.offers : [];
}

export default function HomeScreen() {
  const url = useLocalSearchParams<Query>();
  const { params, setParams } = useFlightSearch();

  useEffect(() => {
    if (url.origin && url.origin !== params.origin) {
      setParams({
        origin: String(url.origin),
        destination: String(url.destination ?? ''),
        departureDate: String(url.departureDate ?? ''),
        returnDate: url.returnDate ? String(url.returnDate) : undefined,
        adults: url.adults ? Number(url.adults) : 1,
        cabin: (url.cabin as any) ?? 'economy',
      });
    }
  }, [url.origin, url.destination, url.departureDate, url.returnDate, url.adults, url.cabin]);

  const ready = Boolean(params.origin && params.destination && params.departureDate);

  useEffect(() => {
    if (ready) addRecent(params.origin, params.destination);
  }, [ready, params.origin, params.destination]);

  const q = useQuery({
    queryKey: ['flights', params],
    queryFn: () =>
      fetchOffers({
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        returnDate: params.returnDate || undefined,
        adults: params.adults,
        cabin: params.cabin,
      }),
    enabled: ready,
    staleTime: 5 * 60 * 1000,
  });

  if (!ready) return <AssistantHome />;

  return (
    <>
      <SearchBar />
      <ThemeScroller>
        <AnimatedView animation="scaleIn" className="flex-1 mt-2">
          <RouteHeader />
          {q.isLoading ? (
            <OfferSkeletons />
          ) : q.error ? (
            <View className="mt-4 rounded-3xl p-5" style={{ backgroundColor: '#f6e1d7' }}>
              <Text style={{ fontFamily: SERIF, color: BRICK, fontSize: 22, letterSpacing: -0.2 }}>
                No live fares just yet.
              </Text>
              <Text
                style={{
                  fontFamily: SERIF,
                  color: INK,
                  opacity: 0.75,
                  fontSize: 14,
                  marginTop: 8,
                  fontStyle: 'italic',
                  lineHeight: 20,
                }}
              >
                The route is saved, but I couldn't bring back prices for this search. Try again in a
                moment, tweak the dates, or ask the concierge to hunt for alternatives.
              </Text>
              <View className="flex-row mt-4">
                <Pressable
                  onPress={() => q.refetch()}
                  className="px-4 py-2 rounded-full mr-2"
                  style={{ backgroundColor: INK }}
                >
                  <ThemedText style={{ color: PARCHMENT, fontWeight: '600', fontSize: 12 }}>
                    Try again
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/(tabs)/chat')}
                  className="px-4 py-2 rounded-full"
                  style={{ backgroundColor: 'rgba(19,26,42,0.08)' }}
                >
                  <ThemedText style={{ color: INK, fontWeight: '600', fontSize: 12 }}>
                    Ask assistant
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          ) : !q.data?.length ? (
            <EmptyOffers />
          ) : (
            <>
              <ResultsSummary offers={q.data} />
              <FlatList
                scrollEnabled={false}
                data={q.data}
                keyExtractor={(o) => o.id}
                renderItem={({ item, index }) => (
                  <OfferRow offer={item} rank={index} cheapest={q.data![0].totalAmount} />
                )}
                ItemSeparatorComponent={() => <View className="h-3" />}
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            </>
          )}
        </AnimatedView>
      </ThemeScroller>
    </>
  );
}

function AssistantHome() {
  const { setParams } = useFlightSearch();
  const [tracked, setTracked] = useState<TrackedRoute[]>([]);
  const [recents, setRecents] = useState<RecentSearch[]>([]);

  const load = useCallback(async () => {
    const [t, r] = await Promise.all([listTracked(), listRecents()]);
    setTracked(t);
    setRecents(r);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const homeAirport = recents[0]?.origin ?? tracked[0]?.origin ?? 'JFK';
  const homeCity = findAirport(homeAirport)?.city ?? homeAirport;

  const pills = useMemo<Pill[]>(() => {
    if (recents.length === 0) return PILLS;
    const seen = new Set(recents.map((r) => r.destination));
    const learned: Pill[] = recents.slice(0, 2).map((r) => {
      const ap = findAirport(r.destination);
      return {
        label: `Back to ${ap?.city ?? r.destination}`,
        hint: 'You looked recently',
        destination: r.destination,
        daysOut: 21,
        nights: 3,
      };
    });
    const rest = PILLS.filter((p) => !seen.has(p.destination)).slice(0, 4);
    return [...learned, ...rest];
  }, [recents]);

  const hero = pills[0];
  const remaining = pills.slice(1);

  const drops = useMemo(
    () =>
      tracked
        .filter(
          (r) =>
            (r.history?.length ?? 0) > 1 &&
            r.lastPrice < r.history![r.history!.length - 2].price,
        )
        .slice(0, 3),
    [tracked],
  );

  const pickDate = (daysOut: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOut);
    return d.toISOString().slice(0, 10);
  };

  const runPill = (p: Pill) => {
    const daysOut = p.daysOut ?? 21;
    const nights = p.nights;
    const departureDate = pickDate(daysOut);
    const returnDate = nights ? pickDate(daysOut + nights) : undefined;
    setParams({
      origin: homeAirport,
      destination: p.destination,
      departureDate,
      returnDate,
      adults: 1,
      cabin: p.cabin ?? 'economy',
    });
    router.setParams({
      origin: homeAirport,
      destination: p.destination,
      departureDate,
      returnDate: returnDate ?? '',
      adults: '1',
      cabin: p.cabin ?? 'economy',
    });
  };

  return (
    <ThemeScroller>
      <AnimatedView animation="scaleIn" className="flex-1 pt-4">
        <View className="mb-7">
          <ThemedText style={{ fontFamily: SERIF, fontSize: 16, opacity: 0.6 }}>
            {greeting()},
          </ThemedText>
          <ThemedText className="text-4xl font-bold mt-1" style={{ letterSpacing: -0.5 }}>
            Where's next?
          </ThemedText>
          <ThemedText
            className="mt-2 opacity-70"
            style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic' }}
          >
            I'll watch prices and bring deals back to you.
          </ThemedText>
        </View>

        {hero ? (
          <Pressable onPress={() => runPill(hero)} className="mb-3">
            <View
              className="rounded-3xl overflow-hidden"
              style={{
                backgroundColor: '#f1ece4',
                minHeight: 180,
                padding: 22,
                justifyContent: 'space-between',
              }}
            >
              <View>
                <ThemedText
                  style={{ fontFamily: SERIF, color: INK, opacity: 0.55, fontSize: 13 }}
                >
                  For you today
                </ThemedText>
                <ThemedText
                  style={{
                    fontFamily: SERIF,
                    color: INK,
                    fontSize: 30,
                    marginTop: 6,
                    lineHeight: 34,
                  }}
                >
                  {hero.label}
                </ThemedText>
                <ThemedText style={{ color: INK, opacity: 0.65, marginTop: 4, fontSize: 13 }}>
                  {hero.hint} · from {homeCity}
                </ThemedText>
              </View>
              <View className="flex-row items-end justify-between">
                <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: INK }}>
                  <ThemedText style={{ color: '#f1ece4', fontSize: 12, fontWeight: '600' }}>
                    Show me flights
                  </ThemedText>
                </View>
                <View style={{ opacity: 0.9 }}>
                  <GeoGlyph iata={hero.destination} size={88} color={INK} accent="#c97d4a" />
                </View>
              </View>
            </View>
          </Pressable>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-5 px-5 mb-7"
          style={{ marginTop: 4 }}
        >
          {remaining.map((p, i) => (
            <Pressable
              key={p.label}
              onPress={() => runPill(p)}
              className="mr-2 rounded-2xl"
              style={{
                width: 150,
                padding: 14,
                backgroundColor: i % 2 === 0 ? '#eceae4' : '#e3e7e1',
              }}
            >
              <GeoGlyph iata={p.destination} size={42} color={INK} accent="#b86b3d" />
              <ThemedText
                style={{ fontFamily: SERIF, color: INK, fontSize: 16, marginTop: 10 }}
                numberOfLines={1}
              >
                {p.label}
              </ThemedText>
              <ThemedText
                style={{ color: INK, opacity: 0.6, fontSize: 11, marginTop: 2 }}
                numberOfLines={1}
              >
                {p.hint}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {drops.length > 0 ? (
          <View className="mb-6">
            <SectionHeader>A price just dropped</SectionHeader>
            {drops.map((r) => {
              const prev = r.history![r.history!.length - 2].price;
              const saved = Math.round(prev - r.lastPrice);
              const from = findAirport(r.origin);
              const to = findAirport(r.destination);
              return (
                <Pressable
                  key={r.id}
                  onPress={() => router.push('/(tabs)/favorites')}
                  className="rounded-2xl p-4 mb-2 flex-row items-center"
                  style={{ backgroundColor: '#e6f2eb' }}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: '#b8dcc6' }}
                  >
                    <Icon name="TrendingDown" size={18} color="#1f6b43" />
                  </View>
                  <View className="flex-1">
                    <ThemedText style={{ color: INK, fontWeight: '600' }}>
                      {from?.city ?? r.origin} → {to?.city ?? r.destination}
                    </ThemedText>
                    <ThemedText style={{ color: INK, opacity: 0.7, fontSize: 12, marginTop: 2 }}>
                      saved {r.currency} {saved} · now {r.currency} {Math.round(r.lastPrice)}
                    </ThemedText>
                  </View>
                  <Icon name="ChevronRight" size={18} color={INK} />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {tracked.length > 0 ? (
          <View className="mb-7">
            <SectionHeader>What I'm watching</SectionHeader>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
              {tracked.slice(0, 6).map((r) => {
                const from = findAirport(r.origin);
                const to = findAirport(r.destination);
                const lowest = r.lowestPrice ?? r.lastPrice;
                const atBest = r.lastPrice <= lowest;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => router.push('/(tabs)/favorites')}
                    className="mr-2 p-3 rounded-2xl"
                    style={{ width: 170, backgroundColor: '#efece6' }}
                  >
                    <GeoGlyph iata={r.destination} size={36} color={INK} accent="#c97d4a" />
                    <ThemedText
                      style={{ color: INK, fontWeight: '600', fontSize: 14, marginTop: 8 }}
                      numberOfLines={1}
                    >
                      {from?.city ?? r.origin} → {to?.city ?? r.destination}
                    </ThemedText>
                    <ThemedText
                      style={{ fontFamily: SERIF, color: INK, fontSize: 22, marginTop: 2 }}
                    >
                      {r.currency} {Math.round(r.lastPrice)}
                    </ThemedText>
                    <ThemedText
                      style={{
                        color: atBest ? '#1f6b43' : INK,
                        opacity: atBest ? 1 : 0.6,
                        fontSize: 11,
                        marginTop: 2,
                        fontStyle: atBest ? 'italic' : 'normal',
                      }}
                    >
                      {atBest ? 'at best price' : `low ${r.currency} ${Math.round(lowest)}`}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View className="mb-8">
          <SectionHeader>Want me to…</SectionHeader>
          <Pressable
            onPress={() => router.push('/(tabs)/chat')}
            className="flex-row items-center rounded-2xl p-4 mb-2"
            style={{ backgroundColor: '#efece6' }}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: INK }}
            >
              <Icon name="Sparkles" size={18} color="#f1ece4" />
            </View>
            <View className="flex-1">
              <ThemedText style={{ color: INK, fontWeight: '600' }}>Find you something</ThemedText>
              <ThemedText
                style={{ color: INK, opacity: 0.6, fontSize: 12, marginTop: 2, fontStyle: 'italic' }}
              >
                "Cheapest to Tokyo in June under $800"
              </ThemedText>
            </View>
            <Icon name="ChevronRight" size={18} color={INK} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(tabs)/favorites')}
            className="flex-row items-center rounded-2xl p-4"
            style={{ backgroundColor: '#efece6' }}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: '#f1ece4', borderWidth: 1, borderColor: '#d8d2c4' }}
            >
              <Icon name="Bell" size={18} color={INK} />
            </View>
            <View className="flex-1">
              <ThemedText style={{ color: INK, fontWeight: '600' }}>
                Keep watch over {tracked.length} {tracked.length === 1 ? 'route' : 'routes'}
              </ThemedText>
              <ThemedText
                style={{ color: INK, opacity: 0.6, fontSize: 12, marginTop: 2, fontStyle: 'italic' }}
              >
                Daily, weekly, or on demand
              </ThemedText>
            </View>
            <Icon name="ChevronRight" size={18} color={INK} />
          </Pressable>
        </View>

        <View className="items-center mb-8" style={{ opacity: 0.5 }}>
          <ThemedText style={{ fontFamily: SERIF, fontSize: 12, fontStyle: 'italic' }}>
            flying from {homeCity}
          </ThemedText>
        </View>
      </AnimatedView>
    </ThemeScroller>
  );
}

function SectionHeader({ children }: { children: string }) {
  return (
    <ThemedText
      style={{
        fontFamily: SERIF,
        fontSize: 18,
        marginBottom: 10,
        letterSpacing: -0.2,
      }}
    >
      {children}
    </ThemedText>
  );
}

function RouteHeader() {
  const { params } = useFlightSearch();
  const from = findAirport(params.origin);
  const to = findAirport(params.destination);
  return (
    <View className="mb-3">
      <ThemedText style={{ fontFamily: SERIF, fontSize: 26, letterSpacing: -0.3 }}>
        {from?.city ?? params.origin} → {to?.city ?? params.destination}
      </ThemedText>
      <ThemedText className="opacity-60 text-sm mt-1">
        {params.departureDate}
        {params.returnDate ? ` – ${params.returnDate}` : ''} · {params.adults} adult
        {params.adults > 1 ? 's' : ''} · {params.cabin.replace('_', ' ')}
      </ThemedText>
    </View>
  );
}

function ResultsSummary({ offers }: { offers: FlightOffer[] }) {
  const prices = offers.map((o) => parseFloat(o.totalAmount)).filter((n) => !Number.isNaN(n));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const currency = offers[0]?.totalCurrency ?? 'USD';
  const nonstopCount = offers.filter((o) =>
    o.slices.every((s) => s.segments.length === 1),
  ).length;
  return (
    <View
      className="flex-row items-center rounded-2xl mb-3 px-4 py-3"
      style={{ backgroundColor: PARCHMENT_COOL }}
    >
      <Text style={{ fontFamily: SERIF, color: INK, fontSize: 14 }}>
        {offers.length} offer{offers.length === 1 ? '' : 's'}
      </Text>
      <Text style={{ color: INK, opacity: 0.4, fontSize: 13, marginHorizontal: 8 }}>·</Text>
      <Text style={{ fontFamily: SERIF, color: INK, opacity: 0.7, fontSize: 13 }}>
        from {currency} {Math.round(min)}
        {max > min ? ` · to ${Math.round(max)}` : ''}
      </Text>
      <View className="ml-auto flex-row items-center">
        <Text style={{ fontFamily: SERIF, color: INK, opacity: 0.6, fontSize: 12, fontStyle: 'italic' }}>
          {nonstopCount > 0 ? `${nonstopCount} nonstop` : 'all with stops'}
        </Text>
      </View>
    </View>
  );
}

function EmptyOffers() {
  return (
    <View
      className="mt-4 rounded-3xl p-6 items-center"
      style={{ backgroundColor: PARCHMENT_DEEP }}
    >
      <GeoGlyph kind="compass" size={54} color={INK} accent="#c97d4a" />
      <Text
        style={{ fontFamily: SERIF, color: INK, fontSize: 18, marginTop: 10, letterSpacing: -0.2 }}
      >
        Nothing on this route today
      </Text>
      <Text
        style={{
          fontFamily: SERIF,
          color: INK,
          opacity: 0.6,
          fontSize: 13,
          marginTop: 4,
          fontStyle: 'italic',
          textAlign: 'center',
        }}
      >
        Try different dates, or loosen the cabin. I'll keep looking.
      </Text>
    </View>
  );
}

function OfferSkeletons() {
  return (
    <View className="mt-1">
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          className="rounded-2xl mb-3 p-4"
          style={{ backgroundColor: PARCHMENT_DEEP, opacity: 1 - i * 0.2 }}
        >
          <View className="flex-row justify-between mb-4">
            <View style={{ height: 16, width: 110, backgroundColor: 'rgba(19,26,42,0.08)', borderRadius: 4 }} />
            <View style={{ height: 20, width: 80, backgroundColor: 'rgba(19,26,42,0.1)', borderRadius: 4 }} />
          </View>
          <View className="flex-row items-center">
            <View style={{ height: 28, width: 48, backgroundColor: 'rgba(19,26,42,0.08)', borderRadius: 4 }} />
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(19,26,42,0.1)', marginHorizontal: 10 }} />
            <View style={{ height: 28, width: 48, backgroundColor: 'rgba(19,26,42,0.08)', borderRadius: 4 }} />
          </View>
          <View style={{ height: 12, width: '40%', backgroundColor: 'rgba(19,26,42,0.06)', borderRadius: 4, marginTop: 10 }} />
        </View>
      ))}
    </View>
  );
}

function OfferRow({
  offer,
  rank,
  cheapest,
}: {
  offer: FlightOffer;
  rank: number;
  cheapest: string;
}) {
  const price = parseFloat(offer.totalAmount);
  const cheapestNum = parseFloat(cheapest);
  const isCheapest = rank === 0;
  const premium = price - cheapestNum;
  const first = offer.slices[0];
  const firstSeg = first?.segments[0];
  const lastSeg = first?.segments[first.segments.length - 1];
  const stops = Math.max(0, (first?.segments.length ?? 1) - 1);
  const dur = parseDurationMin(first?.duration);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/screens/product-detail', params: { id: offer.id } })}
      className="rounded-3xl overflow-hidden"
      style={{ backgroundColor: PARCHMENT_DEEP }}
    >
      {isCheapest ? (
        <View
          className="flex-row items-center px-4 py-1.5"
          style={{ backgroundColor: MOSS }}
        >
          <Text
            style={{
              fontFamily: SERIF,
              color: PARCHMENT,
              fontSize: 11,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Lowest fare
          </Text>
          <Text
            style={{
              fontFamily: SERIF,
              color: PARCHMENT,
              opacity: 0.75,
              fontSize: 11,
              marginLeft: 8,
              fontStyle: 'italic',
            }}
          >
            among {rank + 1}+
          </Text>
        </View>
      ) : null}

      <View className="p-4">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-row items-center flex-1 pr-3">
            <View
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: PARCHMENT }}
            >
              <Text style={{ fontFamily: SERIF, color: INK, fontSize: 13 }}>
                {offer.owner.iata_code ?? offer.owner.name.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View className="ml-3 flex-1">
              <Text
                style={{ fontFamily: SERIF, color: INK, fontSize: 15, letterSpacing: -0.1 }}
                numberOfLines={1}
              >
                {offer.owner.name}
              </Text>
              <Text
                style={{ fontFamily: SERIF, color: INK, opacity: 0.55, fontSize: 12, marginTop: 1 }}
              >
                {stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`}
                {dur ? ` · ${formatMin(dur)}` : ''}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text
              style={{
                fontFamily: SERIF,
                color: INK,
                fontSize: 22,
                letterSpacing: -0.3,
              }}
            >
              {offer.totalCurrency} {Math.round(price)}
            </Text>
            {!isCheapest && premium > 0 ? (
              <Text
                style={{
                  fontFamily: SERIF,
                  color: INK,
                  opacity: 0.55,
                  fontSize: 11,
                  marginTop: 2,
                  fontStyle: 'italic',
                }}
              >
                + {offer.totalCurrency} {Math.round(premium)}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="flex-row items-center">
          <View>
            <Text style={{ fontFamily: SERIF, color: INK, fontSize: 22, letterSpacing: -0.5 }}>
              {first?.origin}
            </Text>
            <Text style={{ fontFamily: SERIF, color: INK, opacity: 0.55, fontSize: 11, marginTop: 1 }}>
              {formatTime(firstSeg?.departing_at)}
            </Text>
          </View>
          <View className="flex-1 items-center mx-3">
            <View
              style={{
                height: 1,
                width: '100%',
                backgroundColor: 'rgba(19,26,42,0.15)',
                position: 'absolute',
                top: 11,
              }}
            />
            <View
              className="px-2 items-center"
              style={{ backgroundColor: PARCHMENT_DEEP, zIndex: 1 }}
            >
              <Icon name="Plane" size={14} color={INK} />
            </View>
          </View>
          <View className="items-end">
            <Text style={{ fontFamily: SERIF, color: INK, fontSize: 22, letterSpacing: -0.5 }}>
              {first?.destination}
            </Text>
            <Text style={{ fontFamily: SERIF, color: INK, opacity: 0.55, fontSize: 11, marginTop: 1 }}>
              {formatTime(lastSeg?.arriving_at)}
            </Text>
          </View>
        </View>

        <View
          style={{
            height: 1,
            marginTop: 14,
            marginBottom: 12,
            borderTopWidth: 1,
            borderStyle: 'dashed',
            borderColor: 'rgba(19,26,42,0.12)',
          }}
        />

        <View className="flex-row items-center">
          <TrackButton offer={offer} />
          <View className="ml-auto flex-row items-center">
            <Text
              style={{
                fontFamily: SERIF,
                color: INK,
                opacity: 0.55,
                fontSize: 11,
                fontStyle: 'italic',
                marginRight: 6,
              }}
            >
              {offer.expires_at ? 'expires soon' : 'see details'}
            </Text>
            <Icon name="ChevronRight" size={14} color={INK} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function parseDurationMin(iso?: string) {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  const h = parseInt(m[1] ?? '0', 10);
  const mm = parseInt(m[2] ?? '0', 10);
  return h * 60 + mm;
}

function formatMin(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function TrackButton({ offer }: { offer: FlightOffer }) {
  const { params } = useFlightSearch();
  const id = routeKey({ ...params });
  const onTrack = async () => {
    const existing = await listTracked();
    if (existing.find((t) => t.id === id)) {
      await removeTracked(id);
      return;
    }
    await saveTracked({
      id,
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      adults: params.adults,
      cabin: params.cabin,
      lastPrice: parseFloat(offer.totalAmount),
      currency: offer.totalCurrency,
      lastCheckedAt: Date.now(),
      createdAt: Date.now(),
      scanFrequency: 'daily',
      lowestPrice: parseFloat(offer.totalAmount),
      history: [{ price: parseFloat(offer.totalAmount), at: Date.now() }],
    });
  };
  return (
    <Pressable
      onPress={onTrack}
      className="flex-row items-center px-3 py-1.5 rounded-full"
      style={{ backgroundColor: 'rgba(19,26,42,0.08)' }}
    >
      <Icon name="Bell" size={12} color={INK} />
      <Text
        style={{
          fontFamily: SERIF,
          color: INK,
          fontSize: 12,
          marginLeft: 6,
        }}
      >
        Watch price
      </Text>
    </Pressable>
  );
}

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
