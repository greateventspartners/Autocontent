import { FaFacebook, FaInstagram, FaPinterest, FaXTwitter, FaLinkedin, FaWordpress } from "react-icons/fa6";
import { FileText } from "lucide-react";

const platformConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  facebook:  { icon: FaFacebook,  color: "text-[#1877F2]" },
  instagram: { icon: FaInstagram, color: "text-[#E4405F]" },
  pinterest: { icon: FaPinterest, color: "text-[#BD081C]" },
  x:         { icon: FaXTwitter,  color: "text-[#000000]" },
  linkedin:  { icon: FaLinkedin,  color: "text-[#0A66C2]" },
  wordpress: { icon: FaWordpress, color: "text-[#21759B]" },
};

const defaultConfig = { icon: FileText, color: "text-zinc-400" };

export function PlatformIcon({ channel, className = "h-3.5 w-3.5" }: { channel: string; className?: string }) {
  const cfg = platformConfig[channel.toLowerCase()] ?? defaultConfig;
  const Icon = cfg.icon;
  return <Icon className={`${cfg.color} ${className}`} />;
}

export function getChannelLabel(channel: string): string {
  const labels: Record<string, string> = {
    facebook:  "Facebook",
    instagram: "Instagram",
    pinterest: "Pinterest",
    x:         "X",
    linkedin:  "LinkedIn",
    wordpress: "WordPress",
    slack:     "Slack",
    webhook:   "Webhook",
  };
  return labels[channel.toLowerCase()] ?? channel;
}
