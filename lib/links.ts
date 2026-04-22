import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Share, Platform } from 'react-native';

const SCHEME = 'voyage';

export function linkToTrip(orderId: string): string {
  return `${SCHEME}://trips/${encodeURIComponent(orderId)}`;
}

export function linkToTracked(trackedId: string): string {
  return `${SCHEME}://tracked/${encodeURIComponent(trackedId)}`;
}

export function linkToOffer(offerId: string): string {
  return `${SCHEME}://offer/${encodeURIComponent(offerId)}`;
}

export function linkToChat(chatId: string): string {
  return `${SCHEME}://chat/${encodeURIComponent(chatId)}`;
}

export async function shareTrip(orderId: string, summary: string): Promise<void> {
  const url = linkToTrip(orderId);
  await Share.share({
    url,
    message: Platform.OS === 'android' ? `${summary}\n${url}` : summary,
    title: summary,
  });
}

const AIRLINE_CHECKIN: Record<string, string> = {
  AA: 'https://www.aa.com/checkin',
  AC: 'https://www.aircanada.com/checkin',
  AF: 'https://wwws.airfrance.us/web-check-in',
  AS: 'https://www.alaskaair.com/checkin',
  AY: 'https://www.finnair.com/checkin',
  BA: 'https://www.britishairways.com/travel/olcilandingpageauthreq/public/en_gb',
  CX: 'https://www.cathaypacific.com/cx/en_US/manage-booking/online-check-in.html',
  DL: 'https://www.delta.com/checkin',
  EK: 'https://www.emirates.com/checkin',
  EY: 'https://www.etihad.com/en/manage/online-check-in',
  IB: 'https://www.iberia.com/us/online-checkin/',
  JL: 'https://www.jal.co.jp/en/inter/checkin/',
  KE: 'https://www.koreanair.com/us/en/booking/checkin',
  KL: 'https://www.klm.com/checkin',
  LH: 'https://www.lufthansa.com/us/en/online-check-in',
  NH: 'https://www.ana.co.jp/en/us/travel-information/checkin/',
  QF: 'https://www.qantas.com/au/en/manage-booking/check-in-online.html',
  QR: 'https://www.qatarairways.com/en/check-in.html',
  SQ: 'https://www.singaporeair.com/en_UK/plan-travel/managing-your-booking/online-check-in/',
  TK: 'https://www.turkishairlines.com/en-int/flights/check-in/',
  UA: 'https://www.united.com/en/us/checkin',
  VS: 'https://www.virginatlantic.com/gb/en/manage-your-booking.html',
  WN: 'https://mobile.southwest.com/check-in',
};

export function checkInUrl(carrierCode: string, bookingReference?: string): string {
  const code = (carrierCode ?? '').toUpperCase().slice(0, 2);
  const base = AIRLINE_CHECKIN[code] ?? `https://www.google.com/search?q=${encodeURIComponent(code + ' airline online check-in')}`;
  if (bookingReference) {
    return `${base}${base.includes('?') ? '&' : '?'}pnr=${encodeURIComponent(bookingReference)}`;
  }
  return base;
}

export function flightStatusUrl(carrierCode: string, flightNumber: string): string {
  return `https://www.flightaware.com/live/flight/${encodeURIComponent((carrierCode + flightNumber).toUpperCase())}`;
}

export function handleDeepLink(url: string): boolean {
  try {
    const parsed = Linking.parse(url);
    const host = parsed.hostname;
    const path = (parsed.path ?? '').replace(/^\/+/, '');
    const id = path || (parsed.queryParams?.id as string | undefined);
    if (!host) return false;
    if (host === 'trips' && id) {
      router.push({ pathname: '/screens/trip-detail', params: { id } });
      return true;
    }
    if (host === 'tracked' && id) {
      router.push({ pathname: '/(tabs)/favorites' });
      return true;
    }
    if (host === 'offer' && id) {
      router.push({ pathname: '/screens/product-detail', params: { id } });
      return true;
    }
    if (host === 'chat') {
      router.push({ pathname: '/(tabs)/chat', params: id ? { chatId: id } : {} });
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
