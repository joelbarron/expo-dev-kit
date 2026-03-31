import { customAxios } from "../http";

import { JBAnnouncementCampaign } from "./types";

const normalizeArray = <T>(value: unknown): T[] => {
  if (!Array.isArray(value)) return [];
  return value as T[];
};

const asString = (value: unknown) => String(value ?? "").trim();
const asNumber = (value: unknown, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};
const asBoolean = (value: unknown, fallback = false) =>
  typeof value === "boolean" ? value : fallback;

const normalizeSlide = (raw: any) => ({
  id: asNumber(raw?.id),
  order: asNumber(raw?.order),
  title: asString(raw?.title),
  body: asString(raw?.body),
  image_url: asString(raw?.image_url ?? raw?.imageUrl),
  button_label: asString(raw?.button_label ?? raw?.buttonLabel),
  action_type: asString(raw?.action_type ?? raw?.actionType) as
    | "internal_path"
    | "external_url"
    | "none",
  action_value: asString(raw?.action_value ?? raw?.actionValue),
});

const normalizeCampaign = (raw: any): JBAnnouncementCampaign => ({
  id: asNumber(raw?.id),
  slug: asString(raw?.slug),
  enabled: asBoolean(raw?.enabled, false),
  priority: asNumber(raw?.priority),
  auto_open: asBoolean(raw?.auto_open ?? raw?.autoOpen, false),
  show_once_per_version: asBoolean(
    raw?.show_once_per_version ?? raw?.showOncePerVersion,
    true
  ),
  version: asString(raw?.version),
  audience: asString(raw?.audience) as any,
  roles: Array.isArray(raw?.roles) ? raw.roles : [],
  platform: asString(raw?.platform) as any,
  starts_at: raw?.starts_at ?? raw?.startsAt ?? null,
  ends_at: raw?.ends_at ?? raw?.endsAt ?? null,
  slides: normalizeArray<any>(raw?.slides).map(normalizeSlide),
});

export class JBAnnouncementsService {
  static async fetchActive(options?: {
    endpointPath?: string;
    platform?: "ios" | "android" | "all";
  }): Promise<JBAnnouncementCampaign[]> {
    const endpointPath =
      String(options?.endpointPath ?? "").trim() || "/core/mobile-announcements/";
    const platform = String(options?.platform ?? "").trim().toLowerCase();

    const response = await customAxios.get(endpointPath, {
      params: {
        platform:
          platform === "ios" || platform === "android" ? platform : undefined,
      },
    });

    return normalizeArray<any>(response?.data).map(normalizeCampaign);
  }
}
