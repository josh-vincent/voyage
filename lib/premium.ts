import AsyncStorage from '@react-native-async-storage/async-storage';

const PREMIUM_KEY = '@voyage/premium-state';

export type PremiumPlan = 'free' | 'plus' | 'pro';

export type PremiumState = {
  plan: PremiumPlan;
  status: 'inactive' | 'active';
  renewalDate?: string;
  updatedAt: number;
  localMock: boolean;
};

export const FREE_PREMIUM_STATE: PremiumState = {
  plan: 'free',
  status: 'inactive',
  updatedAt: 0,
  localMock: true,
};

export async function getPremiumState(): Promise<PremiumState> {
  const raw = await AsyncStorage.getItem(PREMIUM_KEY);
  if (!raw) return FREE_PREMIUM_STATE;
  try {
    return { ...FREE_PREMIUM_STATE, ...(JSON.parse(raw) as PremiumState) };
  } catch {
    return FREE_PREMIUM_STATE;
  }
}

export async function savePremiumState(state: PremiumState): Promise<PremiumState> {
  await AsyncStorage.setItem(PREMIUM_KEY, JSON.stringify(state));
  return state;
}

export async function activateMockPremium(
  plan: Exclude<PremiumPlan, 'free'>
): Promise<PremiumState> {
  const renewal = new Date();
  renewal.setMonth(renewal.getMonth() + 1);
  return savePremiumState({
    plan,
    status: 'active',
    renewalDate: renewal.toISOString(),
    updatedAt: Date.now(),
    localMock: true,
  });
}

export async function cancelMockPremium(): Promise<PremiumState> {
  return savePremiumState({
    ...FREE_PREMIUM_STATE,
    updatedAt: Date.now(),
  });
}
