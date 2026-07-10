export function getComposerUrl(platform: string, text: string): string {
  const t = encodeURIComponent(text);
  switch (platform.toLowerCase()) {
    case "linkedin":
      return "https://www.linkedin.com/feed/";
    case "instagram":
      return "https://www.instagram.com/";
    case "facebook":
      return "https://www.facebook.com/";
    case "tiktok":
      return "https://www.tiktok.com/upload";
    case "pinterest":
      return "https://pin.it/upload";
    case "wordpress":
      return "https://wordpress.com/post";
    case "medium":
      return "https://medium.com/new-story";
    case "threads":
      return "https://threads.net/";
    case "youtube":
      return "https://www.youtube.com";
    default:
      return "https://www.linkedin.com/feed/";
  }
}
