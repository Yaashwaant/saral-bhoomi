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
