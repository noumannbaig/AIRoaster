export const ANALYTICS_EVENTS = [
  "landing_page_view",
  "roast_started",
  "input_submitted",
  "image_uploaded",
  "roast_generated",
  "free_result_viewed",
  "paywall_viewed",
  "checkout_started",
  "checkout_completed",
  "premium_roast_revealed",
  "share_clicked",
  "share_card_downloaded",
  "friend_roast_clicked",
  "email_submitted",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];
