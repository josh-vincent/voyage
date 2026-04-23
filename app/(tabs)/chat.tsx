import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { fetch as expoFetch } from 'expo/fetch';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import GeoGlyph from '@/components/GeoGlyph';
import { api } from '@/lib/apiBase';
import { INK, PARCHMENT, PARCHMENT_DEEP, SERIF } from '@/lib/theme';
import {
  listRecents,
  listTracked,
  listOrders,
  saveTracked,
  routeKey,
  type StoredOrder,
  type TrackedRoute,
} from '@/utils/trackedStorage';
import type { CabinClass, FlightOffer } from '@/lib/flightTypes';
import {
  openAllInGoogleCalendar,
  readDeviceCalendar,
  saveToDeviceCalendar,
  type BusyEvent,
  type CalendarEvent,
} from '@/lib/calendarActions';
import {
  deleteChat,
  deriveChatTitle,
  getChat,
  listChats,
  newChatId,
  saveChat,
  type StoredChat,
  type StoredChatMessage,
} from '@/lib/chatStorage';

const QUICK_PROMPTS = [
  'Cheapest NYC → Tokyo next month for 2 adults under $800',
  'Weekend flight from SFO to Austin',
  'Plan a 4-day trip to Lisbon on a budget',
  'Watch London prices from JFK for the next 3 weeks',
];

const DRAWER_WIDTH = Math.min(320, Math.round(Dimensions.get('window').width * 0.84));

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ chatId?: string }>();
  const [input, setInput] = useState('');
  const [homeAirport, setHomeAirport] = useState<string | undefined>(undefined);
  const [chatId, setChatId] = useState<string>(() => (params.chatId as string) || newChatId());
  const [pastChats, setPastChats] = useState<StoredChat[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [upcomingTrips, setUpcomingTrips] = useState<StoredOrder[]>([]);
  const [watchedRoutes, setWatchedRoutes] = useState<TrackedRoute[]>([]);
  const drawerX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const lastSavedRef = useRef<string>('');

  const loadUserState = useCallback(async () => {
    const [recents, tracked, orders] = await Promise.all([
      listRecents(),
      listTracked(),
      listOrders(),
    ]);
    const home = recents[0]?.origin ?? tracked[0]?.origin;
    if (home) setHomeAirport(home);
    setWatchedRoutes(tracked);
    const now = Date.now();
    const upcoming = orders
      .filter((o) => {
        const t = new Date(o.slices[0]?.departing_at ?? 0).getTime();
        return !Number.isNaN(t) && t >= now - 24 * 60 * 60 * 1000;
      })
      .sort(
        (a, b) =>
          new Date(a.slices[0]?.departing_at ?? 0).getTime() -
          new Date(b.slices[0]?.departing_at ?? 0).getTime(),
      );
    setUpcomingTrips(upcoming);
  }, []);

  useEffect(() => {
    loadUserState();
  }, [loadUserState]);

  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return undefined;
    }
  }, []);
  const locale = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().locale;
    } catch {
      return undefined;
    }
  }, []);
  const countryCode = useMemo(() => {
    const m = (locale ?? '').match(/-([A-Z]{2})\b/);
    return m?.[1];
  }, [locale]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: api('/api/chat'),
        fetch: expoFetch as unknown as typeof fetch,
        body: {
          userContext: {
            homeAirport,
            timezone,
            locale,
            upcomingTrips: upcomingTrips.map((o) => ({
              bookingReference: o.bookingReference,
              passengerName: o.passengerName,
              origin: o.slices[0]?.origin ?? '',
              destination: o.slices[o.slices.length - 1]?.destination ?? '',
              departingAt: o.slices[0]?.departing_at ?? '',
              carrierName: o.slices[0]?.carrierName,
              flightNumber: o.slices[0]?.flightNumber,
              totalAmount: o.totalAmount,
              totalCurrency: o.totalCurrency,
            })),
            watchedRoutes: watchedRoutes.slice(0, 8).map((r) => ({
              origin: r.origin,
              destination: r.destination,
              departureDate: r.departureDate,
              returnDate: r.returnDate,
              adults: r.adults,
              cabin: r.cabin,
              lastPrice: r.lastPrice,
              currency: r.currency,
              lowestPrice: r.lowestPrice,
            })),
          },
        },
      }),
    [homeAirport, timezone, locale, upcomingTrips, watchedRoutes],
  );

  const { messages, sendMessage, setMessages, status, error } = useChat({ transport });

  const refreshPast = useCallback(async () => {
    setPastChats(await listChats());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshPast();
    }, [refreshPast]),
  );

  useEffect(() => {
    if (params.chatId && params.chatId !== chatId) {
      setChatId(params.chatId as string);
    }
  }, [params.chatId, chatId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const existing = await getChat(chatId);
      if (!active) return;
      if (existing) {
        setMessages(existing.messages as any);
        lastSavedRef.current = JSON.stringify(existing.messages);
      } else {
        setMessages([] as any);
        lastSavedRef.current = '[]';
      }
    })();
    return () => {
      active = false;
    };
  }, [chatId, setMessages]);

  useEffect(() => {
    if (status === 'streaming' || status === 'submitted') return;
    if (!messages.length) return;
    const serialized = JSON.stringify(messages);
    if (serialized === lastSavedRef.current) return;
    lastSavedRef.current = serialized;
    const chat: StoredChat = {
      id: chatId,
      title: deriveChatTitle(messages as StoredChatMessage[]),
      messages: messages as StoredChatMessage[],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    getChat(chatId).then((prev) => {
      saveChat({
        ...chat,
        createdAt: prev?.createdAt ?? chat.createdAt,
      }).then(refreshPast);
    });
  }, [messages, status, chatId, refreshPast]);

  useEffect(() => {
    Animated.timing(drawerX, {
      toValue: drawerOpen ? 0 : DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [drawerOpen, drawerX]);

  const sendText = async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;
    setInput('');
    const now = Date.now();
    const calStart = new Date(now).toISOString();
    const calEnd = new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString();
    const [recents, tracked, orders, cal] = await Promise.all([
      listRecents(),
      listTracked(),
      listOrders(),
      readDeviceCalendar(calStart, calEnd).catch((): {
        status: 'granted' | 'denied' | 'undetermined';
        events: BusyEvent[];
      } => ({ status: 'undetermined', events: [] })),
    ]);
    const upcoming = orders
      .filter((o) => {
        const t = new Date(o.slices[0]?.departing_at ?? 0).getTime();
        return !Number.isNaN(t) && t >= now - 24 * 60 * 60 * 1000;
      })
      .sort(
        (a, b) =>
          new Date(a.slices[0]?.departing_at ?? 0).getTime() -
          new Date(b.slices[0]?.departing_at ?? 0).getTime(),
      );
    setUpcomingTrips(upcoming);
    setWatchedRoutes(tracked);
    const home = recents[0]?.origin ?? tracked[0]?.origin ?? homeAirport;
    const calendarEvents = cal.events.slice(0, 120);
    const userContext = {
      homeAirport: home,
      timezone,
      locale,
      countryCode,
      upcomingTrips: upcoming.map((o) => ({
        bookingReference: o.bookingReference,
        passengerName: o.passengerName,
        origin: o.slices[0]?.origin ?? '',
        destination: o.slices[o.slices.length - 1]?.destination ?? '',
        departingAt: o.slices[0]?.departing_at ?? '',
        carrierName: o.slices[0]?.carrierName,
        flightNumber: o.slices[0]?.flightNumber,
        totalAmount: o.totalAmount,
        totalCurrency: o.totalCurrency,
      })),
      watchedRoutes: tracked.slice(0, 8).map((r) => ({
        origin: r.origin,
        destination: r.destination,
        departureDate: r.departureDate,
        returnDate: r.returnDate,
        adults: r.adults,
        cabin: r.cabin,
        lastPrice: r.lastPrice,
        currency: r.currency,
        lowestPrice: r.lowestPrice,
      })),
      calendarAccess: cal.status,
      calendarRange: { start: calStart.slice(0, 10), end: calEnd.slice(0, 10) },
      calendarEvents,
    };
    sendMessage({ text }, { body: { userContext } });
  };

  const send = async () => {
    await sendText(input);
  };

  const startNewChat = () => {
    const id = newChatId();
    setChatId(id);
    setMessages([] as any);
    lastSavedRef.current = '[]';
    setDrawerOpen(false);
  };

  const openChat = (id: string) => {
    setChatId(id);
    setDrawerOpen(false);
  };

  const removeChat = (id: string) => {
    Alert.alert('Delete chat', 'This conversation will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteChat(id);
          await refreshPast();
          if (id === chatId) startNewChat();
        },
      },
    ]);
  };

  const activeTitle = useMemo(() => {
    const found = pastChats.find((c) => c.id === chatId);
    if (found) return found.title;
    if (messages.length) return deriveChatTitle(messages as StoredChatMessage[]);
    return 'New chat';
  }, [pastChats, chatId, messages]);

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="px-global pt-4 pb-2 flex-row items-start">
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontFamily: SERIF, fontSize: 14, opacity: 0.55 }}>
              At your service
            </ThemedText>
            <ThemedText
              className="mt-1"
              style={{ fontFamily: SERIF, fontSize: 28, letterSpacing: -0.3 }}
              numberOfLines={1}
            >
              {activeTitle}
            </ThemedText>
            <ThemedText
              className="opacity-65 mt-1"
              style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic' }}
            >
              Find deals, track prices, plan itineraries.
            </ThemedText>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Pressable
              onPress={startNewChat}
              className="w-10 h-10 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(19,26,42,0.06)' }}
              accessibilityRole="button"
              accessibilityLabel="Start a new chat"
            >
              <Icon name="Plus" size={16} color={INK} />
            </Pressable>
            <Pressable
              onPress={() => setDrawerOpen((v) => !v)}
              className="w-10 h-10 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(19,26,42,0.06)' }}
              accessibilityRole="button"
              accessibilityLabel={drawerOpen ? 'Close conversations' : 'Open conversations'}
            >
              <Icon name="Menu" size={16} color={INK} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View className="mt-4">
              <ThemedText
                style={{ fontFamily: SERIF, fontSize: 14, opacity: 0.7, marginBottom: 10 }}
              >
                Try one of these
              </ThemedText>
              {QUICK_PROMPTS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => sendText(p)}
                  className="rounded-2xl p-4 mb-2 flex-row items-center"
                  style={{ backgroundColor: PARCHMENT_DEEP }}
                  accessibilityRole="button"
                  accessibilityLabel={`Ask: ${p}`}
                >
                  <ThemedText
                    className="flex-1"
                    style={{ fontFamily: SERIF, color: INK, fontSize: 15 }}
                  >
                    {p}
                  </ThemedText>
                  <Icon name="ArrowUpRight" size={14} color={INK} />
                </Pressable>
              ))}
            </View>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
          {status === 'submitted' || status === 'streaming' ? (
            <View className="py-2 flex-row items-center">
              <ActivityIndicator size="small" color={INK} />
              <ThemedText
                className="ml-2 opacity-60"
                style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic' }}
              >
                Thinking…
              </ThemedText>
            </View>
          ) : null}
          {error ? (
            <ThemedText className="text-red-500 mt-2">{error.message}</ThemedText>
          ) : null}
        </ScrollView>

        <View
          style={{
            paddingBottom: insets.bottom + 10,
            borderTopColor: 'rgba(19,26,42,0.08)',
            borderTopWidth: 1,
          }}
          className="px-4 pt-3"
        >
          <View className="flex-row items-end">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask the concierge"
              placeholderTextColor="rgba(19,26,42,0.45)"
              className="flex-1 px-4 py-3 rounded-2xl"
              style={{
                backgroundColor: PARCHMENT_DEEP,
                color: INK,
                fontFamily: SERIF,
                fontSize: 15,
              }}
              multiline
              onSubmitEditing={send}
            />
            <Pressable
              onPress={send}
              className="ml-2 w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: INK }}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Icon name="Send" size={18} color={PARCHMENT} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {drawerOpen ? (
        <Pressable
          onPress={() => setDrawerOpen(false)}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(19,26,42,0.25)',
          }}
        />
      ) : null}

      <Animated.View
        pointerEvents={drawerOpen ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: DRAWER_WIDTH,
          backgroundColor: PARCHMENT,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 12,
          shadowOffset: { width: -4, height: 0 },
          transform: [{ translateX: drawerX }],
          paddingTop: insets.top + 16,
          paddingHorizontal: 18,
        }}
      >
        <View className="flex-row items-center mb-4">
          <Text style={{ fontFamily: SERIF, fontSize: 22, color: INK, letterSpacing: -0.3 }}>
            Conversations
          </Text>
          <Pressable
            onPress={() => setDrawerOpen(false)}
            className="ml-auto w-8 h-8 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(19,26,42,0.06)' }}
            accessibilityRole="button"
            accessibilityLabel="Close conversations"
          >
            <Icon name="X" size={14} color={INK} />
          </Pressable>
        </View>
        <Pressable
          onPress={startNewChat}
          className="rounded-2xl flex-row items-center mb-4"
          style={{ backgroundColor: INK, paddingVertical: 12, paddingHorizontal: 14 }}
        >
          <Icon name="Plus" size={14} color={PARCHMENT} />
          <Text style={{ color: PARCHMENT, fontFamily: SERIF, fontSize: 15, marginLeft: 8 }}>
            New chat
          </Text>
        </Pressable>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {pastChats.length === 0 ? (
            <Text style={{ color: INK, opacity: 0.55, fontSize: 13, fontStyle: 'italic' }}>
              No past chats yet. Ask me something.
            </Text>
          ) : (
            pastChats.map((c) => (
              <View
                key={c.id}
                className="rounded-2xl mb-2 flex-row items-center"
                style={{
                  backgroundColor: c.id === chatId ? PARCHMENT_DEEP : 'transparent',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                }}
              >
                <Pressable onPress={() => openChat(c.id)} style={{ flex: 1 }}>
                  <Text
                    style={{ fontFamily: SERIF, color: INK, fontSize: 14 }}
                    numberOfLines={2}
                  >
                    {c.title}
                  </Text>
                  <Text style={{ color: INK, opacity: 0.5, fontSize: 11, marginTop: 2 }}>
                    {relativeDate(c.updatedAt)} · {c.messages.length} msg
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => removeChat(c.id)}
                  className="w-7 h-7 items-center justify-center rounded-full ml-2"
                  hitSlop={8}
                >
                  <Icon name="Trash2" size={12} color={INK} />
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function relativeDate(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function MessageBubble({ message }: { message: any }) {
  const isUser = message.role === 'user';
  return (
    <View className={`mb-3 ${isUser ? 'items-end' : 'items-start'}`}>
      <View
        className="rounded-2xl"
        style={{
          maxWidth: '88%',
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: isUser ? INK : PARCHMENT_DEEP,
        }}
      >
        {(message.parts ?? []).map((part: any, i: number) => {
          if (part.type === 'text') {
            if (isUser) {
              return (
                <Text
                  key={i}
                  style={{
                    color: PARCHMENT,
                    fontFamily: SERIF,
                    fontSize: 15,
                    lineHeight: 21,
                  }}
                >
                  {part.text}
                </Text>
              );
            }
            return <AssistantMarkdown key={i} text={part.text} />;
          }
          if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
            return <ToolPart key={i} part={part} />;
          }
          return null;
        })}
      </View>
    </View>
  );
}

function AssistantMarkdown({ text }: { text: string }) {
  return (
    <Markdown
      style={{
        body: { color: INK, fontSize: 15, lineHeight: 22, fontFamily: SERIF },
        paragraph: { marginTop: 0, marginBottom: 8, color: INK },
        bullet_list: { marginBottom: 4 },
        ordered_list: { marginBottom: 4 },
        list_item: { marginBottom: 2, color: INK },
        code_inline: {
          backgroundColor: 'rgba(19,26,42,0.08)',
          color: INK,
          paddingHorizontal: 4,
          borderRadius: 4,
        },
        code_block: {
          backgroundColor: 'rgba(19,26,42,0.06)',
          color: INK,
          padding: 8,
          borderRadius: 8,
        },
        strong: { fontWeight: '700', color: INK },
        em: { fontStyle: 'italic', color: INK },
        link: { color: '#1f6b43' },
        heading1: { fontFamily: SERIF, fontSize: 19, marginBottom: 4, color: INK },
        heading2: { fontFamily: SERIF, fontSize: 17, marginBottom: 4, color: INK },
        heading3: { fontFamily: SERIF, fontSize: 15, marginBottom: 4, color: INK },
      }}
    >
      {text}
    </Markdown>
  );
}

function ToolPart({ part }: { part: any }) {
  const toolName = part.type.replace(/^tool-/, '');
  if (part.state === 'output-available' && toolName === 'addToCalendar') {
    return <CalendarCard output={part.output} />;
  }
  if (part.state === 'output-available' && toolName === 'trackPrice') {
    return <TrackProposalCard output={part.output} />;
  }
  if (part.state === 'output-available' && toolName === 'openTrip') {
    return <TripLinkCard output={part.output} />;
  }
  if (part.state === 'output-available' && toolName === 'searchFlights') {
    const offers = part.output?.offers ?? [];
    return (
      <View className="mt-2">
        <Text
          style={{
            fontFamily: SERIF,
            color: INK,
            opacity: 0.6,
            fontSize: 12,
            marginBottom: 6,
            fontStyle: 'italic',
          }}
        >
          I found {part.output?.count ?? offers.length} for you
        </Text>
        {offers.map((o: any) => {
          const firstSlice = o.slices?.[0];
          return (
            <Pressable
              key={o.id}
              onPress={() => router.push({ pathname: '/screens/product-detail', params: { id: o.id } })}
              className="rounded-2xl p-3 mb-2 flex-row items-center"
              style={{ backgroundColor: PARCHMENT }}
            >
              {firstSlice ? (
                <View style={{ marginRight: 10 }}>
                  <GeoGlyph iata={firstSlice.destination} size={34} color={INK} accent="#c97d4a" />
                </View>
              ) : null}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: SERIF, color: INK, fontSize: 15 }}>
                  {o.airline}
                </Text>
                {firstSlice ? (
                  <Text style={{ color: INK, opacity: 0.6, fontSize: 12, marginTop: 2 }}>
                    {firstSlice.origin} → {firstSlice.destination} ·{' '}
                    {firstSlice.stops === 0
                      ? 'nonstop'
                      : `${firstSlice.stops} stop${firstSlice.stops > 1 ? 's' : ''}`}
                  </Text>
                ) : null}
              </View>
              <Text style={{ fontFamily: SERIF, color: INK, fontSize: 18 }}>{o.price}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }
  if (part.state === 'input-streaming' || part.state === 'input-available') {
    return (
      <Text
        style={{
          fontFamily: SERIF,
          color: INK,
          opacity: 0.55,
          fontSize: 12,
          fontStyle: 'italic',
          marginTop: 6,
        }}
      >
        Searching {toolName}…
      </Text>
    );
  }
  if (part.state === 'output-available') {
    return (
      <Text
        style={{
          fontFamily: SERIF,
          color: INK,
          opacity: 0.55,
          fontSize: 12,
          fontStyle: 'italic',
          marginTop: 6,
        }}
      >
        {toolName} done
      </Text>
    );
  }
  return null;
}

function formatEventWhen(e: CalendarEvent): string {
  const start = new Date(e.start);
  const end = new Date(e.end);
  const dateFmt: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  const timeFmt: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  if (e.allDay) return start.toLocaleDateString(undefined, dateFmt);
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${start.toLocaleDateString(undefined, dateFmt)} · ${start.toLocaleTimeString(undefined, timeFmt)} – ${end.toLocaleTimeString(undefined, timeFmt)}`;
  }
  return `${start.toLocaleDateString(undefined, dateFmt)} → ${end.toLocaleDateString(undefined, dateFmt)}`;
}

type TrackProposal = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  cabin: CabinClass;
  frequency?: 'manual' | 'daily' | 'weekly';
  lastPrice?: number;
  currency?: string;
  nickname?: string;
};

function TrackProposalCard({
  output,
}: {
  output: { proposal?: TrackProposal; message?: string };
}) {
  const proposal = output?.proposal;
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  if (!proposal) return null;

  const onTrack = async () => {
    if (busy || done) return;
    setBusy(true);
    try {
      let price = proposal.lastPrice;
      let currency = proposal.currency;
      if (!price) {
        const res = await fetch(api('/api/flights/search'), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            origin: proposal.origin,
            destination: proposal.destination,
            departureDate: proposal.departureDate,
            returnDate: proposal.returnDate,
            adults: proposal.adults,
            cabin: proposal.cabin,
          }),
        });
        if (res.ok) {
          const { offers } = (await res.json()) as { offers: FlightOffer[] };
          const cheapest = offers[0];
          if (cheapest) {
            price = parseFloat(cheapest.totalAmount);
            currency = cheapest.totalCurrency;
          }
        }
      }
      const id = routeKey({
        origin: proposal.origin,
        destination: proposal.destination,
        departureDate: proposal.departureDate,
        returnDate: proposal.returnDate,
        adults: proposal.adults,
        cabin: proposal.cabin,
      });
      const now = Date.now();
      await saveTracked({
        id,
        origin: proposal.origin,
        destination: proposal.destination,
        departureDate: proposal.departureDate,
        returnDate: proposal.returnDate,
        adults: proposal.adults,
        cabin: proposal.cabin,
        lastPrice: price ?? 0,
        currency: currency ?? 'USD',
        lastCheckedAt: now,
        createdAt: now,
        scanFrequency: proposal.frequency ?? 'daily',
        lowestPrice: price,
        history: price ? [{ price, at: now }] : [],
        nickname: proposal.nickname,
      });
      setDone(true);
    } catch {
      // noop
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="mt-2">
      {output.message ? (
        <Text
          style={{
            fontFamily: SERIF,
            color: INK,
            opacity: 0.6,
            fontSize: 12,
            marginBottom: 6,
            fontStyle: 'italic',
          }}
        >
          {output.message}
        </Text>
      ) : null}
      <View className="rounded-2xl p-3 mb-2" style={{ backgroundColor: PARCHMENT }}>
        <View className="flex-row items-center">
          <GeoGlyph iata={proposal.destination} size={34} color={INK} accent="#c97d4a" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ fontFamily: SERIF, color: INK, fontSize: 15 }}>
              {proposal.origin} → {proposal.destination}
            </Text>
            <Text style={{ color: INK, opacity: 0.6, fontSize: 12, marginTop: 2 }}>
              {proposal.departureDate}
              {proposal.returnDate ? ` – ${proposal.returnDate}` : ''} · {proposal.adults} adult
              {proposal.adults > 1 ? 's' : ''} · {proposal.cabin.replace('_', ' ')}
            </Text>
          </View>
          {proposal.lastPrice ? (
            <Text style={{ fontFamily: SERIF, color: INK, fontSize: 17 }}>
              {proposal.currency ?? ''} {Math.round(proposal.lastPrice)}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={done ? () => router.push('/(tabs)/favorites') : onTrack}
          disabled={busy}
          className="mt-3 rounded-xl py-3 flex-row items-center justify-center"
          style={{
            backgroundColor: done ? '#1f6b43' : INK,
            opacity: busy ? 0.5 : 1,
          }}
        >
          <Icon name={done ? 'Check' : 'Bell'} size={14} color={PARCHMENT} />
          <Text style={{ color: PARCHMENT, fontFamily: SERIF, fontSize: 14, marginLeft: 6 }}>
            {busy ? 'Saving…' : done ? 'Watching · view watchlist' : 'Track this route'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

type TripLinkOutput = {
  found?: boolean;
  note?: string;
  trip?: {
    bookingReference: string;
    origin: string;
    destination: string;
    departingAt: string;
    carrierName?: string;
    flightNumber?: string;
  };
  available?: Array<{
    bookingReference: string;
    origin: string;
    destination: string;
    departingAt: string;
  }>;
};

function TripLinkCard({ output }: { output: TripLinkOutput }) {
  const [resolving, setResolving] = useState(false);
  const openByRef = useCallback(async (ref: string) => {
    if (resolving) return;
    setResolving(true);
    try {
      const orders = await listOrders();
      const match = orders.find((o) => o.bookingReference === ref);
      if (match) {
        router.push({ pathname: '/screens/trip-detail', params: { id: match.id } });
      } else {
        router.push('/(tabs)/trips');
      }
    } finally {
      setResolving(false);
    }
  }, [resolving]);

  if (!output) return null;

  if (output.found && output.trip) {
    const t = output.trip;
    const when = t.departingAt ? new Date(t.departingAt) : null;
    return (
      <View className="mt-2">
        {output.note ? (
          <Text
            style={{
              fontFamily: SERIF,
              color: INK,
              opacity: 0.6,
              fontSize: 12,
              marginBottom: 6,
              fontStyle: 'italic',
            }}
          >
            {output.note}
          </Text>
        ) : null}
        <Pressable
          onPress={() => openByRef(t.bookingReference)}
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: INK, padding: 16 }}
        >
          <View className="flex-row items-center">
            <Text style={{ color: PARCHMENT, opacity: 0.6, fontSize: 11, letterSpacing: 1 }}>
              TRIP
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
              {t.bookingReference}
            </Text>
          </View>
          <View className="flex-row items-end mt-2">
            <Text style={{ fontFamily: SERIF, color: PARCHMENT, fontSize: 26, letterSpacing: -0.4 }}>
              {t.origin}
            </Text>
            <View style={{ paddingHorizontal: 10, paddingBottom: 4 }}>
              <Icon name="Plane" size={14} color={PARCHMENT} />
            </View>
            <Text style={{ fontFamily: SERIF, color: PARCHMENT, fontSize: 26, letterSpacing: -0.4 }}>
              {t.destination}
            </Text>
            <Text
              style={{
                marginLeft: 'auto',
                color: PARCHMENT,
                opacity: 0.65,
                fontSize: 12,
              }}
            >
              {when ? when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
            </Text>
          </View>
          <View className="flex-row items-center mt-3">
            <Text style={{ color: PARCHMENT, opacity: 0.6, fontSize: 11 }}>
              {[t.carrierName, t.flightNumber].filter(Boolean).join(' ') || 'Tap to open'}
            </Text>
            <Text style={{ marginLeft: 'auto', color: PARCHMENT, fontFamily: SERIF, fontSize: 13 }}>
              Open →
            </Text>
          </View>
        </Pressable>
      </View>
    );
  }

  const available = output.available ?? [];
  return (
    <View className="mt-2">
      <Text
        style={{
          fontFamily: SERIF,
          color: INK,
          opacity: 0.6,
          fontSize: 12,
          marginBottom: 6,
          fontStyle: 'italic',
        }}
      >
        {output.note ?? 'Nothing matches that.'}
      </Text>
      {available.map((t) => (
        <Pressable
          key={t.bookingReference}
          onPress={() => openByRef(t.bookingReference)}
          className="rounded-2xl p-3 mb-2 flex-row items-center"
          style={{ backgroundColor: PARCHMENT }}
        >
          <View style={{ marginRight: 10 }}>
            <GeoGlyph iata={t.destination} size={28} color={INK} accent="#c97d4a" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: SERIF, color: INK, fontSize: 14 }}>
              {t.origin} → {t.destination}
            </Text>
            <Text style={{ color: INK, opacity: 0.55, fontSize: 11, marginTop: 2 }}>
              {t.bookingReference} · {t.departingAt?.slice(0, 10)}
            </Text>
          </View>
          <Icon name="ChevronRight" size={14} color={INK} />
        </Pressable>
      ))}
    </View>
  );
}

function CalendarCard({ output }: { output: { summary: string; events: CalendarEvent[] } }) {
  const [busy, setBusy] = useState(false);
  const events = output?.events ?? [];
  if (!events.length) return null;

  const onApple = async () => {
    setBusy(true);
    try { await saveToDeviceCalendar(events); } finally { setBusy(false); }
  };
  const onGoogle = async () => {
    setBusy(true);
    try { await openAllInGoogleCalendar(events); } finally { setBusy(false); }
  };

  return (
    <View className="mt-2">
      <Text
        style={{
          fontFamily: SERIF,
          color: INK,
          opacity: 0.6,
          fontSize: 12,
          marginBottom: 6,
          fontStyle: 'italic',
        }}
      >
        {output.summary ?? 'Ready to add to your calendar'}
      </Text>
      <View className="rounded-2xl p-3 mb-2" style={{ backgroundColor: PARCHMENT }}>
        {events.map((e, i) => (
          <View
            key={`${e.title}-${i}`}
            style={{
              paddingVertical: 8,
              borderBottomColor: 'rgba(19,26,42,0.08)',
              borderBottomWidth: i < events.length - 1 ? 1 : 0,
            }}
          >
            <Text style={{ fontFamily: SERIF, color: INK, fontSize: 15 }} numberOfLines={2}>
              {e.title}
            </Text>
            <Text style={{ color: INK, opacity: 0.6, fontSize: 12, marginTop: 2 }}>
              {formatEventWhen(e)}
            </Text>
            {e.location ? (
              <Text style={{ color: INK, opacity: 0.55, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                {e.location}
              </Text>
            ) : null}
          </View>
        ))}
        <View className="flex-row mt-3" style={{ gap: 8 }}>
          <Pressable
            onPress={onApple}
            disabled={busy}
            className="flex-1 rounded-xl py-3 items-center justify-center flex-row"
            style={{ backgroundColor: INK, opacity: busy ? 0.5 : 1 }}
          >
            <Icon name="Calendar" size={14} color={PARCHMENT} />
            <Text style={{ color: PARCHMENT, fontFamily: SERIF, fontSize: 14, marginLeft: 6 }}>
              Apple Calendar
            </Text>
          </Pressable>
          <Pressable
            onPress={onGoogle}
            disabled={busy}
            className="flex-1 rounded-xl py-3 items-center justify-center flex-row"
            style={{
              borderWidth: 1,
              borderColor: INK,
              backgroundColor: PARCHMENT,
              opacity: busy ? 0.5 : 1,
            }}
          >
            <Icon name="ExternalLink" size={14} color={INK} />
            <Text style={{ color: INK, fontFamily: SERIF, fontSize: 14, marginLeft: 6 }}>
              Google Calendar
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
