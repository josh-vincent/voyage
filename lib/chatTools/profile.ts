import { tool } from 'ai';
import { z } from 'zod';
import type { ToolFactory } from './types';

export const profileTools: ToolFactory = (ctx) => ({
  getMyProfile: tool({
    description:
      "Read the user's saved traveler profile (name, dietary, FF programs, passport, seat/bag preferences). Use to confirm details before booking or when the user asks what's on file.",
    inputSchema: z.object({}),
    execute: async () => ({
      profile: ctx.travelerProfile ?? null,
    }),
  }),

  updateMyProfile: tool({
    description:
      'When the user wants to update their saved travel profile ("change my dietary to vegan", "I have a new passport", "add my Star Alliance number"), return a deep-link that opens the Traveler details editor focused on the relevant section. The user finalizes the edit there.',
    inputSchema: z.object({
      section: z.enum([
        'personal',
        'contact',
        'travel_documents',
        'frequent_flyer',
        'dietary',
        'accessibility',
        'seat_bag_preferences',
        'emergency_contact',
        'hotel_loyalty',
        'notes',
      ]),
      headline: z.string().optional().describe('Short label for the tappable card'),
    }),
    execute: async ({ section, headline }) => ({
      kind: 'open-link',
      pathname: '/screens/profile/traveler-details',
      params: { focus: section },
      headline: headline ?? `Update ${section.replace(/_/g, ' ')}`,
      action: 'update-profile',
    }),
  }),

  addCompanion: tool({
    description:
      'Add a travel companion (partner, family member, frequent travel buddy) so the user can pick them as a co-passenger on bookings. Returns a deep-link to the editor.',
    inputSchema: z.object({
      nickname: z.string().optional().describe('Name or nickname of the companion to add'),
    }),
    execute: async ({ nickname }) => ({
      kind: 'open-link',
      pathname: '/screens/profile/traveler-details',
      params: { addCompanion: '1', ...(nickname ? { nickname } : {}) },
      headline: nickname ? `Add ${nickname}` : 'Add companion',
      action: 'add-companion',
    }),
  }),
});
