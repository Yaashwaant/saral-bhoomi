import { debounce } from './crm-operations';

type EventCategory = 'ui' | 'data' | 'user' | 'finance' | 'parcels' | 'crops' | 'inventory';
type EventAction = 'view' | 'click' | 'create' | 'update' | 'delete' | 'export' | 'import' | 'search' | 'filter';

interface EventData {
  [key: string]: string | number | boolean | undefined;
}

// Add types for analytics event tracking
export interface AnalyticsEvent {
  category: EventCategory;
  action: EventAction;
  label?: string;
  value?: number;
  data?: EventData;
  timestamp: number;
}

// Local storage key for storing events
const ANALYTICS_STORAGE_KEY = 'crm_analytics_events';
const MAX_STORED_EVENTS = 1000;

// Queue for storing events before sending to server
let eventQueue: AnalyticsEvent[] = [];

// Load events from localStorage
const loadEvents = (): AnalyticsEvent[] => {
  try {
    const storedEvents = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    return storedEvents ? JSON.parse(storedEvents) : [];
  } catch (error) {
    console.error('Failed to load analytics events:', error);
    return [];
  }
};

// Save events to localStorage
const saveEvents = (events: AnalyticsEvent[]): void => {
  try {
    // Keep only the latest events up to MAX_STORED_EVENTS
    const eventsToStore = events.slice(-MAX_STORED_EVENTS);
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(eventsToStore));
  } catch (error) {
    console.error('Failed to save analytics events:', error);
  }
};

// Initialize by loading stored events
const initAnalytics = (): void => {
  eventQueue = loadEvents();
  if (import.meta.env.DEV && eventQueue.length === 0) {
    // Auto-seed demo analytics in development when empty
    try {
      const seeded = seedDemoAnalyticsEvents();
      eventQueue = seeded;
      saveEvents(eventQueue);
      console.log(`Seeded ${seeded.length} demo analytics events`);
    } catch (e) {
      console.warn('Failed to seed analytics events', e);
    }
  }
  console.log(`Analytics initialized with ${eventQueue.length} stored events`);
};

// Track a user event
export const trackEvent = (
  category: EventCategory,
  action: EventAction,
  label?: string,
  value?: number,
  data?: EventData
): void => {
  const event: AnalyticsEvent = {
    category,
    action,
    label,
    value,
    data,
    timestamp: Date.now()
  };
  
  eventQueue.push(event);
  saveEvents(eventQueue);
  
  // For development, log event to console
  if (import.meta.env.DEV) {
    console.log('Analytics event:', event);
  }
  
  // In a real app, we would send this to a server
  debouncedSendEvents();
};

// Send events to server (simulated)
const sendEvents = async (): Promise<void> => {
  if (eventQueue.length === 0) return;
  
  // In a real application, this would send data to a server
  // For now, we'll just simulate it
  console.log(`Would send ${eventQueue.length} events to analytics server`);
  
  // After successful send, we could clear the queue
  // eventQueue = [];
  // saveEvents(eventQueue);
};

// Debounced version to avoid too many calls
const debouncedSendEvents = debounce(sendEvents, 5000);

// Get analytics data for reporting
export const getAnalyticsData = (): AnalyticsEvent[] => {
  return [...eventQueue];
};

// Clear all stored analytics data
export const clearAnalyticsData = (): void => {
  eventQueue = [];
  saveEvents(eventQueue);
};

// Initialize analytics on module import
initAnalytics();

// Export a page view tracker
export const trackPageView = (pageName: string, data?: EventData): void => {
  trackEvent('ui', 'view', pageName, undefined, data);
};

// Export a UI interaction tracker
export const trackUIInteraction = (element: string, data?: EventData): void => {
  trackEvent('ui', 'click', element, undefined, data);
};

// Export a data operation tracker
export const trackDataOperation = (
  action: 'create' | 'update' | 'delete' | 'export' | 'import', 
  dataType: string,
  count: number = 1,
  data?: EventData
): void => {
  trackEvent('data', action, dataType, count, data);
};

export default {
  trackEvent,
  trackPageView,
  trackUIInteraction,
  trackDataOperation,
  getAnalyticsData,
  clearAnalyticsData
};

// --- Demo seeding helpers ---
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function seedDemoAnalyticsEvents(days: number = 30): AnalyticsEvent[] {
  const categories: EventCategory[] = ['ui', 'data', 'user', 'finance', 'parcels', 'crops', 'inventory'];
  const actions: EventAction[] = ['view', 'click', 'create', 'update', 'delete', 'export', 'import', 'search', 'filter'];
  const pages = ['Dashboard', 'Parcels', 'Finance', 'Statistics', 'Inventory', 'Crops', 'Agents'];
  const dataTypes = ['landowners', 'projects', 'payments', 'notices', 'parcels'];

  const start = addDays(new Date(), -days);
  const events: AnalyticsEvent[] = [];

  for (let i = 0; i < days; i++) {
    const day = addDays(start, i);
    const baseCount = randomInt(30, 80);

    // Page views
    for (let j = 0; j < baseCount; j++) {
      const page = pages[randomInt(0, pages.length - 1)];
      const ts = new Date(day);
      ts.setHours(randomInt(8, 20), randomInt(0, 59), randomInt(0, 59), 0);
      events.push({ category: 'ui', action: 'view', label: page, timestamp: ts.getTime() });
    }

    // Interactions/filters/searches
    const interactionCount = randomInt(20, 50);
    for (let k = 0; k < interactionCount; k++) {
      const action = actions[randomInt(1, actions.length - 1)];
      const cat = categories[randomInt(0, categories.length - 1)];
      const ts = new Date(day);
      ts.setHours(randomInt(9, 19), randomInt(0, 59), randomInt(0, 59), 0);
      events.push({
        category: cat,
        action,
        label: action === 'filter' ? 'location-filter' : action === 'search' ? 'global' : undefined,
        value: action === 'search' ? randomInt(1, 5) : undefined,
        data: action === 'filter' ? { district: ['Palghar', 'Thane', 'Nashik'][randomInt(0,2)] } : undefined,
        timestamp: ts.getTime()
      });
    }

    // Data operations
    const ops = randomInt(3, 10);
    for (let m = 0; m < ops; m++) {
      const act: EventAction = ['create', 'update', 'delete', 'export', 'import'][randomInt(0,4)] as EventAction;
      const type = dataTypes[randomInt(0, dataTypes.length - 1)];
      const ts = new Date(day);
      ts.setHours(randomInt(10, 18), randomInt(0, 59), randomInt(0, 59), 0);
      events.push({ category: 'data', action: act, label: type, value: randomInt(1, 50), timestamp: ts.getTime() });
    }

    // Finance conversions
    const payments = randomInt(1, 8);
    for (let n = 0; n < payments; n++) {
      const ts = new Date(day);
      ts.setHours(randomInt(11, 17), randomInt(0, 59), randomInt(0, 59), 0);
      events.push({ category: 'finance', action: 'update', label: 'payment', value: randomInt(10000, 500000), timestamp: ts.getTime(), data: { status: Math.random() > 0.15 ? 'success' : 'failed' } });
    }
  }

  // Sort by timestamp ascending
  events.sort((a, b) => a.timestamp - b.timestamp);
  return events.slice(-MAX_STORED_EVENTS);
}
