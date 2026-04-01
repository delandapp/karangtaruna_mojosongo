export function trackPageView(page: string) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "page_view", {
      page_path: page,
    });
  }
  console.log(`[Analytics] Page View: ${page}`);
}

export function trackEvent(category: string, action: string, label?: string) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", action, {
      event_category: category,
      event_label: label,
    });
  }
  console.log(`[Analytics] Event: [${category}] ${action} - ${label}`);
}

export function trackScroll(percentage: number) {
  trackEvent("Engagement", "Scroll Depth", `${percentage}%`);
}
