export interface ChannelEntry {
  channel: string
  title: string
  content: string
}

export interface SplitScreenState {
  prompt: string
  sourceText: string
  generationType: "multi" | "repurpose" | "single"
  channels: ChannelEntry[]
  activeChannel: string
}

export const ALL_CHANNELS = ["LINKEDIN", "INSTAGRAM", "FACEBOOK", "X", "PINTEREST", "WORDPRESS", "TIKTOK", "MEDIUM"]
