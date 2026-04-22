import { tool } from 'ai';
import { z } from 'zod';
import type { ToolFactory } from './types';

type CountryInfo = {
  code: string;
  name: string;
  currency: string;
  language: string;
  continent: string;
  powerPlug: string;
  drivingSide: 'left' | 'right';
  visaFreeForUS?: boolean;
  callCode: string;
};

const COUNTRIES: Record<string, CountryInfo> = {
  US: { code: 'US', name: 'United States', currency: 'USD', language: 'English', continent: 'North America', powerPlug: 'A/B', drivingSide: 'right', callCode: '+1' },
  CA: { code: 'CA', name: 'Canada', currency: 'CAD', language: 'English/French', continent: 'North America', powerPlug: 'A/B', drivingSide: 'right', visaFreeForUS: true, callCode: '+1' },
  MX: { code: 'MX', name: 'Mexico', currency: 'MXN', language: 'Spanish', continent: 'North America', powerPlug: 'A/B', drivingSide: 'right', visaFreeForUS: true, callCode: '+52' },
  GB: { code: 'GB', name: 'United Kingdom', currency: 'GBP', language: 'English', continent: 'Europe', powerPlug: 'G', drivingSide: 'left', visaFreeForUS: true, callCode: '+44' },
  IE: { code: 'IE', name: 'Ireland', currency: 'EUR', language: 'English/Irish', continent: 'Europe', powerPlug: 'G', drivingSide: 'left', visaFreeForUS: true, callCode: '+353' },
  FR: { code: 'FR', name: 'France', currency: 'EUR', language: 'French', continent: 'Europe', powerPlug: 'C/E', drivingSide: 'right', visaFreeForUS: true, callCode: '+33' },
  DE: { code: 'DE', name: 'Germany', currency: 'EUR', language: 'German', continent: 'Europe', powerPlug: 'C/F', drivingSide: 'right', visaFreeForUS: true, callCode: '+49' },
  ES: { code: 'ES', name: 'Spain', currency: 'EUR', language: 'Spanish', continent: 'Europe', powerPlug: 'C/F', drivingSide: 'right', visaFreeForUS: true, callCode: '+34' },
  IT: { code: 'IT', name: 'Italy', currency: 'EUR', language: 'Italian', continent: 'Europe', powerPlug: 'C/F/L', drivingSide: 'right', visaFreeForUS: true, callCode: '+39' },
  NL: { code: 'NL', name: 'Netherlands', currency: 'EUR', language: 'Dutch', continent: 'Europe', powerPlug: 'C/F', drivingSide: 'right', visaFreeForUS: true, callCode: '+31' },
  PT: { code: 'PT', name: 'Portugal', currency: 'EUR', language: 'Portuguese', continent: 'Europe', powerPlug: 'C/F', drivingSide: 'right', visaFreeForUS: true, callCode: '+351' },
  GR: { code: 'GR', name: 'Greece', currency: 'EUR', language: 'Greek', continent: 'Europe', powerPlug: 'C/F', drivingSide: 'right', visaFreeForUS: true, callCode: '+30' },
  TR: { code: 'TR', name: 'Turkey', currency: 'TRY', language: 'Turkish', continent: 'Europe/Asia', powerPlug: 'C/F', drivingSide: 'right', visaFreeForUS: true, callCode: '+90' },
  AE: { code: 'AE', name: 'United Arab Emirates', currency: 'AED', language: 'Arabic', continent: 'Asia', powerPlug: 'G', drivingSide: 'right', visaFreeForUS: true, callCode: '+971' },
  QA: { code: 'QA', name: 'Qatar', currency: 'QAR', language: 'Arabic', continent: 'Asia', powerPlug: 'G', drivingSide: 'right', visaFreeForUS: true, callCode: '+974' },
  JP: { code: 'JP', name: 'Japan', currency: 'JPY', language: 'Japanese', continent: 'Asia', powerPlug: 'A/B', drivingSide: 'left', visaFreeForUS: true, callCode: '+81' },
  KR: { code: 'KR', name: 'South Korea', currency: 'KRW', language: 'Korean', continent: 'Asia', powerPlug: 'C/F', drivingSide: 'right', visaFreeForUS: true, callCode: '+82' },
  CN: { code: 'CN', name: 'China', currency: 'CNY', language: 'Mandarin', continent: 'Asia', powerPlug: 'A/C/I', drivingSide: 'right', visaFreeForUS: false, callCode: '+86' },
  HK: { code: 'HK', name: 'Hong Kong', currency: 'HKD', language: 'Cantonese/English', continent: 'Asia', powerPlug: 'G', drivingSide: 'left', visaFreeForUS: true, callCode: '+852' },
  SG: { code: 'SG', name: 'Singapore', currency: 'SGD', language: 'English', continent: 'Asia', powerPlug: 'G', drivingSide: 'left', visaFreeForUS: true, callCode: '+65' },
  TH: { code: 'TH', name: 'Thailand', currency: 'THB', language: 'Thai', continent: 'Asia', powerPlug: 'A/B/C', drivingSide: 'left', visaFreeForUS: true, callCode: '+66' },
  AU: { code: 'AU', name: 'Australia', currency: 'AUD', language: 'English', continent: 'Oceania', powerPlug: 'I', drivingSide: 'left', visaFreeForUS: true, callCode: '+61' },
  NZ: { code: 'NZ', name: 'New Zealand', currency: 'NZD', language: 'English', continent: 'Oceania', powerPlug: 'I', drivingSide: 'left', visaFreeForUS: true, callCode: '+64' },
};

export const countryTools: ToolFactory = (ctx) => ({
  countryInfo: tool({
    description:
      'Basic practical info about a country — currency, language, plug type, driving side, typical visa rules for US passport holders, dialing code. Use this when the user asks "what currency do they use", "do I need an adapter", etc.',
    inputSchema: z.object({
      country: z
        .string()
        .describe('ISO 3166-1 alpha-2 code (GB, FR, JP...) or country name'),
    }),
    execute: async ({ country }) => {
      const key = country.trim().toUpperCase();
      const match =
        COUNTRIES[key] ??
        Object.values(COUNTRIES).find((c) => c.name.toLowerCase() === country.toLowerCase());
      if (!match) return { found: false, country };
      return { found: true, ...match };
    },
  }),
});
