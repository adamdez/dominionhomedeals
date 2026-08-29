/**
 * Public crawler policy for search, answer engines, and user-directed AI fetches.
 *
 * Keep this list synchronized between robots.txt and the country-access bypass.
 * Product-specific control tokens such as Google-Extended and Applebot-Extended
 * are included even when they do not issue a distinct HTTP user-agent.
 */
export const PUBLIC_CRAWLER_TOKENS = [
  "Googlebot",
  "AdsBot-Google",
  "Google-InspectionTool",
  "Mediapartners-Google",
  "Google-CloudVertexBot",
  "Google-Extended",
  "Bingbot",
  "DuckDuckBot",
  "OAI-SearchBot",
  "OAI-AdsBot",
  "ChatGPT-User",
  "GPTBot",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot",
  "Applebot-Extended",
  "CCBot",
] as const;

const SOCIAL_PREVIEW_BOTS = [
  "facebookexternalhit",
  "Twitterbot",
  "LinkedInBot",
  "Slackbot",
  "WhatsApp",
] as const;

export function isPublicCrawler(userAgent: string): boolean {
  return [...PUBLIC_CRAWLER_TOKENS, ...SOCIAL_PREVIEW_BOTS].some((token) =>
    userAgent.toLowerCase().includes(token.toLowerCase()),
  );
}
