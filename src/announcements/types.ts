export type JBAnnouncementActionType = "internal_path" | "external_url" | "none";

export type JBAnnouncementSlide = {
  id: number;
  order: number;
  title: string;
  body?: string;
  image_url?: string;
  button_label?: string;
  action_type: JBAnnouncementActionType;
  action_value?: string;
};

export type JBAnnouncementCampaign = {
  id: number;
  slug: string;
  enabled: boolean;
  priority: number;
  auto_open: boolean;
  show_once_per_version: boolean;
  version?: string;
  audience: "all" | "guest" | "authenticated" | string;
  roles?: string[] | null;
  platform: "all" | "ios" | "android" | string;
  starts_at?: string | null;
  ends_at?: string | null;
  slides: JBAnnouncementSlide[];
};

export type JBAnnouncementsSeenMap = Record<string, number>;

