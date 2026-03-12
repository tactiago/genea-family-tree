import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
    capture_pageview: false // We'll handle pageviews manually or let it auto-capture if preferred
  });
}

export default posthog;
