import type { PublishAdapter } from "./types";
import { wordpressAdapter } from "./wordpress";
import { linkedinAdapter } from "./linkedin";
import { facebookAdapter } from "./facebook";
import { instagramAdapter } from "./instagram";
import { xAdapter } from "./x";
import { tiktokAdapter } from "./tiktok";
import { mediumAdapter } from "./medium";

const adapters = new Map<string, PublishAdapter>([
  ["WORDPRESS", wordpressAdapter],
  ["LINKEDIN", linkedinAdapter],
  ["FACEBOOK", facebookAdapter],
  ["INSTAGRAM", instagramAdapter],
  ["X", xAdapter],
  ["TIKTOK", tiktokAdapter],
  ["MEDIUM", mediumAdapter],
]);

export function getAdapter(channel: string): PublishAdapter | undefined {
  return adapters.get(channel.toUpperCase());
}

export function getRegisteredAdapters(): string[] {
  return Array.from(adapters.keys());
}

export { type PublishAdapter } from "./types";
