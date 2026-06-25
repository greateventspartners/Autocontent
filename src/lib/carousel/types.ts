export interface CarouselSlide {
  id: string
  title: string
  content: string
  imagePrompt: string
  imageUrl: string | null
}

export interface CarouselData {
  id: string
  topic: string
  channel: string
  slides: CarouselSlide[]
  createdAt: string
  title: string
}

export interface GenerateCarouselParams {
  topic: string
  channel: string
  slideCount: number
  brandKitId: string
  workspaceId: string
}
