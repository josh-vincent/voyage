import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Pressable, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import GeoGlyph from '@/components/GeoGlyph';
import { findAirport } from '@/lib/airports';
import { getOrder, type StoredOrder } from '@/utils/trackedStorage';
import { linkToTrip, shareTrip } from '@/lib/links';

const INK = '#131a2a';
const PARCHMENT = '#f1ece4';
const PARCHMENT_DEEP = '#e9e3d7';
const SERIF = 'YoungSerif_400Regular';

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<StoredOrder | null>(null);

  useEffect(() => {
    if (!id) return;
    getOrder(String(id)).then((o) => setOrder(o ?? null));
  }, [id]);

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
        <ActivityIndicator color={INK} />
      </View>
    );
  }

  const first = order.slices[0];
  const last = order.slices[order.slices.length - 1];
  const from = findAirport(first?.origin);
  const to = findAirport(last?.destination);
  const link = linkToTrip(order.id);
  const summary = `${from?.city ?? first?.origin} → ${to?.city ?? last?.destination} · ${order.bookingReference}`;

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-6 pt-4 items-center">
        <View
          className="w-14 h-14 rounded-full items-center justify-center"
          style={{ backgroundColor: '#1f6b43' }}
        >
          <Icon name="Check" size={22} color={PARCHMENT} />
        </View>
        <ThemedText className="mt-4" style={{ fontFamily: SERIF, fontSize: 28, letterSpacing: -0.3 }}>
          You're booked
        </ThemedText>
        <ThemedText className="opacity-65 mt-1" style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic' }}>
          Confirmation {order.bookingReference}
        </ThemedText>
      </View>

      <View className="px-5 mt-6">
        <View
          className="rounded-3xl overflow-hidden"
          style={{ backgroundColor: INK }}
        >
          <View style={{ padding: 20 }}>
            <View className="flex-row items-end">
              <View className="flex-1">
                <Text style={{ color: PARCHMENT, opacity: 0.55, fontSize: 10, letterSpacing: 1 }}>FROM</Text>
                <Text style={{ fontFamily: SERIF, color: PARCHMENT, fontSize: 32, letterSpacing: -0.5 }}>
                  {first?.origin}
                </Text>
                <Text style={{ color: PARCHMENT, opacity: 0.55, fontSize: 11, marginTop: 2 }}>
                  {from?.city}
                </Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingBottom: 8 }}>
                <Icon name="Plane" size={16} color={PARCHMENT} />
              </View>
              <View className="flex-1 items-end">
                <Text style={{ color: PARCHMENT, opacity: 0.55, fontSize: 10, letterSpacing: 1 }}>TO</Text>
                <Text style={{ fontFamily: SERIF, color: PARCHMENT, fontSize: 32, letterSpacing: -0.5 }}>
                  {last?.destination}
                </Text>
                <Text style={{ color: PARCHMENT, opacity: 0.55, fontSize: 11, marginTop: 2 }}>
                  {to?.city}
                </Text>
              </View>
            </View>
            <View className="flex-row mt-4" style={{ alignItems: 'center' }}>
              <Text style={{ color: PARCHMENT, opacity: 0.6, fontSize: 12 }}>
                {order.passengerName}
              </Text>
              <Text style={{ marginLeft: 'auto', color: PARCHMENT, fontFamily: SERIF, fontSize: 15 }}>
                {order.totalCurrency} {Math.round(parseFloat(order.totalAmount))}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => shareTrip(order.id, summary)}
          className="rounded-2xl mt-4 flex-row items-center"
          style={{ backgroundColor: PARCHMENT_DEEP, paddingVertical: 14, paddingHorizontal: 16 }}
        >
          <Icon name="Share2" size={15} color={INK} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ fontFamily: SERIF, color: INK, fontSize: 14 }}>Share this trip</Text>
            <Text style={{ color: INK, opacity: 0.55, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
              {link}
            </Text>
          </View>
          <Icon name="ChevronRight" size={14} color={INK} />
        </Pressable>

        <View className="flex-row mt-4" style={{ gap: 10 }}>
          <Pressable
            onPress={() => router.replace({ pathname: '/screens/trip-detail', params: { id: order.id } })}
            className="flex-1 rounded-full items-center justify-center flex-row"
            style={{ backgroundColor: INK, paddingVertical: 14 }}
          >
            <Text style={{ color: PARCHMENT, fontFamily: SERIF, fontSize: 15 }}>Open trip</Text>
            <Icon name="ArrowRight" size={14} color={PARCHMENT} />
          </Pressable>
          <Pressable
            onPress={() => router.replace('/(tabs)/trips')}
            className="rounded-full items-center justify-center"
            style={{
              borderWidth: 1,
              borderColor: INK,
              paddingVertical: 14,
              paddingHorizontal: 18,
            }}
          >
            <Text style={{ color: INK, fontFamily: SERIF, fontSize: 14 }}>All trips</Text>
          </Pressable>
        </View>
      </View>

      <View className="px-5 mt-6 items-center">
        <GeoGlyph iata={last?.destination} size={90} color={INK} accent="#c97d4a" />
      </View>
    </View>
  );
}
