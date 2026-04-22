import type { ToolFactory, ToolMap, VoyageContext } from './types';
import { mergeTools } from './types';
import { timeTools } from './time';
import { locationTools } from './location';
import { countryTools } from './country';
import { flightTools } from './flights';
import { trackingTools } from './tracking';
import { activityTools } from './activities';
import { weatherTools } from './weather';
import { itineraryTools } from './itinerary';
import { calendarTools } from './calendar';
import { calendarGapTools } from './calendarGaps';
import { holidayTools } from './holidays';
import { tripTools } from './trips';

const FACTORIES: ToolFactory[] = [
  timeTools,
  locationTools,
  countryTools,
  flightTools,
  trackingTools,
  activityTools,
  weatherTools,
  itineraryTools,
  calendarTools,
  calendarGapTools,
  holidayTools,
  tripTools,
];

export function buildTools(ctx: VoyageContext): ToolMap {
  return mergeTools(FACTORIES, ctx);
}

export type { VoyageContext, ToolFactory, ToolMap };
