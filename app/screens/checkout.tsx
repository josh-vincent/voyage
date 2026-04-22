import { useMemo, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import MultiStep, { Step } from '@/components/MultiStep';
import Section from '@/components/layout/Section';
import type { BookedPassenger, FlightOffer } from '@/lib/flightTypes';
import { saveOrder, markTrackedBooked, type StoredOrder } from '@/utils/trackedStorage';
import { api } from '@/lib/apiBase';

type PassengerForm = Omit<BookedPassenger, 'id'> & { id?: string };

async function fetchOffer(id: string): Promise<FlightOffer> {
  const res = await fetch(api('/api/flights/offer'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Could not load offer');
  return (await res.json()).offer;
}

async function createOrder(body: unknown) {
  const res = await fetch(api('/api/flights/order'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? 'Order creation failed');
  return data.order;
}

const emptyPassenger = (): PassengerForm => ({
  type: 'adult',
  title: 'mr',
  given_name: '',
  family_name: '',
  born_on: '',
  email: '',
  phone_number: '',
  gender: 'm',
});

export default function Checkout() {
  const { offerId, trackedId } = useLocalSearchParams<{ offerId: string; trackedId?: string }>();
  const q = useQuery({
    queryKey: ['offer', offerId],
    queryFn: () => fetchOffer(String(offerId)),
    enabled: !!offerId,
  });
  const [passenger, setPassenger] = useState<PassengerForm>(emptyPassenger);
  const [submitting, setSubmitting] = useState(false);

  const offer = q.data;
  const passengerIds = useMemo(() => offer?.passengerIds ?? [], [offer]);

  if (q.isLoading || !offer) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  const updateField = <K extends keyof PassengerForm>(k: K, v: PassengerForm[K]) =>
    setPassenger((p) => ({ ...p, [k]: v }));

  const onComplete = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const passengers = passengerIds.map((pid) => ({ ...passenger, id: pid })) as BookedPassenger[];
      const order = await createOrder({
        offerId: offer.id,
        amount: offer.totalAmount,
        currency: offer.totalCurrency,
        passengers,
      });
      const stored: StoredOrder = {
        id: order.id,
        bookingReference: order.booking_reference,
        totalAmount: offer.totalAmount,
        totalCurrency: offer.totalCurrency,
        passengerName: `${passenger.given_name} ${passenger.family_name}`.trim(),
        slices: offer.slices.flatMap((s) =>
          s.segments.map((seg) => ({
            origin: seg.origin,
            destination: seg.destination,
            departing_at: seg.departing_at,
            arriving_at: seg.arriving_at,
            carrierName: seg.marketingCarrierName,
            flightNumber: seg.flightNumber,
            carrierCode: seg.marketingCarrier,
          })),
        ),
        createdAt: Date.now(),
        trackedId: trackedId ? String(trackedId) : undefined,
      };
      await saveOrder(stored);
      if (trackedId) {
        await markTrackedBooked(String(trackedId), stored.id);
      }
      router.replace({ pathname: '/screens/order-detail', params: { id: stored.id } });
    } catch (e: any) {
      Alert.alert('Booking failed', e?.message ?? 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MultiStep onComplete={onComplete} showHeader>
      <Step title="Passenger">
        <ScrollView className="flex-1 p-4">
          <Section title="Passenger details" titleSize="2xl" subtitle="Matches Duffel test-mode format" className="mt-2 mb-6" />
          <Input label="First name" value={passenger.given_name} onChangeText={(v: string) => updateField('given_name', v)} />
          <Input label="Last name" value={passenger.family_name} onChangeText={(v: string) => updateField('family_name', v)} />
          <Input label="Date of birth (YYYY-MM-DD)" value={passenger.born_on} onChangeText={(v: string) => updateField('born_on', v)} />
          <Input label="Email" keyboardType="email-address" value={passenger.email} onChangeText={(v: string) => updateField('email', v)} />
          <Input label="Phone number (+E.164)" keyboardType="phone-pad" value={passenger.phone_number} onChangeText={(v: string) => updateField('phone_number', v)} />
        </ScrollView>
      </Step>

      <Step title="Review">
        <ScrollView className="flex-1 p-4">
          <Section title="Review" titleSize="2xl" subtitle="Double-check your flight" className="mt-2 mb-4" />
          {offer.slices.map((s, i) => (
            <View key={i} className="bg-light-primary dark:bg-dark-secondary rounded-2xl p-4 mb-3">
              <ThemedText className="font-bold mb-1">
                {s.origin} → {s.destination}
              </ThemedText>
              {s.segments.map((seg, j) => (
                <ThemedText key={j} className="text-sm opacity-70">
                  {seg.marketingCarrierName} {seg.flightNumber} · {seg.departing_at.slice(0, 16).replace('T', ' ')}
                </ThemedText>
              ))}
            </View>
          ))}
          <View className="flex-row justify-between mt-4">
            <ThemedText className="font-bold">Total</ThemedText>
            <ThemedText className="font-bold">
              {offer.totalCurrency} {Math.round(parseFloat(offer.totalAmount))}
            </ThemedText>
          </View>
        </ScrollView>
      </Step>

      <Step title="Confirm">
        <View className="flex-1 items-center justify-center p-6">
          {submitting ? (
            <>
              <ActivityIndicator />
              <ThemedText className="mt-3">Booking with Duffel test-mode…</ThemedText>
            </>
          ) : (
            <>
              <ThemedText className="text-xl font-bold text-center mb-2">Ready to book</ThemedText>
              <ThemedText className="opacity-70 text-center">
                Test-mode uses a balance payment. No real money is charged. Tap Complete to confirm.
              </ThemedText>
            </>
          )}
        </View>
      </Step>
    </MultiStep>
  );
}
