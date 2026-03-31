import { Stack, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useMemo, useRef, useState } from "react";
import {
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StatusBar,
} from "react-native";
import { useQuery } from "@tanstack/react-query";

import { getLastCreatedJBExpoConfig, getRuntimeAnnouncementsConfig, JBAppConfig } from "../config";
import { JBMainLayout } from "../core";
import { JBFormButton } from "../forms";
import { useJBAuth } from "../auth";
import { useAppConfigStore, useAuthStore } from "../runtime";
import { Box, HStack, Text, VStack } from "../ui";
import {
  buildAnnouncementVersionKey,
  buildJBAnnouncementsScope,
  markAnnouncementsSeenBulk,
} from "./storage";
import { JBAnnouncementsService } from "./service";
import { JBAnnouncementCampaign, JBAnnouncementSlide } from "./types";
import { useAnnouncementRouteParams } from "./hooks";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type SlideWithCampaign = JBAnnouncementSlide & {
  campaignSlug: string;
  campaignVersion?: string;
  showOncePerVersion: boolean;
};

const normalizeRoutePath = (value: unknown, fallback: string) => {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  if (raw.startsWith("/")) return raw;
  return `/${raw.replace(/^\/+/, "")}`;
};

export type JBAnnouncementsScreenProps = {
  title?: string;
};

export const JBAnnouncementsScreen = ({
  title = "Novedades",
}: JBAnnouncementsScreenProps) => {
  const router = useRouter();
  const { isAuthenticated } = useJBAuth();
  const activeProfileId = useAuthStore(
    (state: any) => state?.activeProfile?.id ?? state?.defaultProfile?.id ?? null
  );
  const authUserId = useAuthStore(
    (state: any) => state?.user?.id ?? state?.user?.pk ?? null
  );
  const baseConfig = getLastCreatedJBExpoConfig();
  const remoteConfig = useAppConfigStore((state: any) => state?.appConfig);
  const { campaign: campaignSlugParam } = useAnnouncementRouteParams();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<SlideWithCampaign> | null>(null);
  const mergedConfig = useMemo(
    () =>
      ({
        ...baseConfig,
        runtime: {
          ...(baseConfig.runtime ?? {}),
          ...(remoteConfig?.runtime ?? {}),
        },
      } as JBAppConfig),
    [baseConfig, remoteConfig?.runtime]
  );
  const announcementsConfig = useMemo(
    () => getRuntimeAnnouncementsConfig(mergedConfig),
    [mergedConfig]
  );
  const endpointPath = String(
    announcementsConfig?.endpointPath ?? "/core/mobile-announcements/"
  ).trim();
  const platform =
    Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "all";
  const routePath = normalizeRoutePath(
    announcementsConfig?.routePath,
    "/announcements"
  );
  const fallbackPath = normalizeRoutePath(
    isAuthenticated
      ? announcementsConfig?.openAfterRoutes?.authenticated ?? "/"
      : announcementsConfig?.openAfterRoutes?.guest ?? "/welcome",
    isAuthenticated ? "/" : "/welcome"
  );
  const externalOpenMode = String(
    announcementsConfig?.externalOpenMode ?? "in_app_browser"
  ).trim();
  const scope = useMemo(
    () =>
      buildJBAnnouncementsScope({
        isAuthenticated,
        userId: authUserId,
        profileId: activeProfileId,
      }),
    [activeProfileId, authUserId, isAuthenticated]
  );
  const closeButtonTopOffset = useMemo(
    () =>
      Platform.select({
        ios: 52,
        android: (StatusBar.currentHeight ?? 0) + 12,
        default: 16,
      }) ?? 16,
    []
  );

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["announcements", "active", endpointPath, platform],
    queryFn: async () => {
      const result = await JBAnnouncementsService.fetchActive({
        endpointPath,
        platform,
      });
      return Array.isArray(result) ? result : [];
    },
  });

  const filteredCampaigns = useMemo(() => {
    const sorted = [...campaigns].sort((a, b) => {
      const priorityDiff = Number(b.priority || 0) - Number(a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return String(a.slug || "").localeCompare(String(b.slug || ""));
    });
    if (!campaignSlugParam) return sorted;
    return sorted.filter(
      (campaign) =>
        String(campaign.slug || "").trim().toLowerCase() ===
        String(campaignSlugParam).trim().toLowerCase()
    );
  }, [campaignSlugParam, campaigns]);

  const slides = useMemo<SlideWithCampaign[]>(() => {
    const nextSlides: SlideWithCampaign[] = [];
    filteredCampaigns.forEach((campaign: JBAnnouncementCampaign) => {
      const campaignSlides = Array.isArray(campaign.slides) ? campaign.slides : [];
      campaignSlides
        .slice()
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
        .forEach((slide) => {
          nextSlides.push({
            ...slide,
            campaignSlug: campaign.slug,
            campaignVersion: campaign.version,
            showOncePerVersion: campaign.show_once_per_version !== false,
          });
        });
    });
    return nextSlides;
  }, [filteredCampaigns]);

  const markCurrentCampaignsAsSeen = async () => {
    const keys = filteredCampaigns
      .map((campaign) =>
        buildAnnouncementVersionKey(
          campaign.slug,
          campaign.version,
          campaign.show_once_per_version !== false
        )
      )
      .filter(Boolean);
    await markAnnouncementsSeenBulk(scope, keys);
  };

  const closeScreen = async () => {
    await markCurrentCampaignsAsSeen();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallbackPath as any);
  };

  const goToNext = () => {
    if (activeIndex >= slides.length - 1) {
      void closeScreen();
      return;
    }
    const nextIndex = activeIndex + 1;
    setActiveIndex(nextIndex);
    listRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });
  };

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const nextIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (!Number.isNaN(nextIndex)) {
      setActiveIndex(Math.max(0, Math.min(nextIndex, slides.length - 1)));
    }
  };

  const currentSlide = slides[activeIndex] ?? null;
  const currentHasAction =
    Boolean(currentSlide?.action_type) &&
    currentSlide?.action_type !== "none" &&
    Boolean(String(currentSlide?.action_value ?? "").trim());

  const runCurrentAction = async () => {
    if (!currentSlide || !currentHasAction) {
      goToNext();
      return;
    }

    const actionValue = String(currentSlide.action_value ?? "").trim();
    if (!actionValue) {
      goToNext();
      return;
    }
    const isLastSlide = activeIndex >= slides.length - 1;

    if (currentSlide.action_type === "internal_path") {
      // Mark as seen before route changes to avoid immediate re-open by guard.
      await markCurrentCampaignsAsSeen();
      const targetPath =
        actionValue === routePath ? fallbackPath : actionValue;
      if (isLastSlide) {
        router.replace(targetPath as any);
        return;
      }
      router.push(targetPath as any);
      goToNext();
      return;
    }

    if (
      currentSlide.action_type === "external_url" &&
      externalOpenMode === "in_app_browser"
    ) {
      await WebBrowser.openBrowserAsync(actionValue);
      if (isLastSlide) {
        await closeScreen();
        return;
      }
      goToNext();
      return;
    }

    goToNext();
  };

  React.useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <>
      <Stack.Screen options={{ title, headerShown: false, gestureEnabled: false }} />
      <JBMainLayout
        scrollable={false}
        hideTopAccent
        contentRoundedTop={false}
        footer={
          <VStack className="w-full" space="sm">
            <JBFormButton
              text={
                currentSlide?.button_label?.trim() ||
                (activeIndex >= slides.length - 1 ? "Finalizar" : "Siguiente")
              }
              onPress={() => {
                void runCurrentAction();
              }}
              isDisabled={slides.length === 0}
            />
          </VStack>
        }
        footerClassName="px-5 py-4"
      >
        <VStack className="flex-1" space="md">
          {!isLoading && slides.length > 0 ? (
            <Box className="absolute right-5 z-20" style={{ top: closeButtonTopOffset }}>
              <Pressable onPress={() => void closeScreen()}>
                <Box className="h-12 w-12 items-center justify-center rounded-full bg-primary-500">
                  <Text className="text-3xl font-semibold text-typography-white">
                    ×
                  </Text>
                </Box>
              </Pressable>
            </Box>
          ) : null}
          {isLoading ? (
            <Box className="flex-1 items-center justify-center px-5">
              <Text className="text-center text-typography-600 dark:text-typography-400">
                Cargando novedades...
              </Text>
            </Box>
          ) : slides.length === 0 ? (
            <Box className="flex-1 items-center justify-center px-5">
              <VStack className="items-center" space="sm">
                <Text
                  size="md"
                  className="font-semibold text-typography-black dark:text-typography-white"
                >
                  No hay novedades por ahora
                </Text>
                <JBFormButton
                  text="Volver"
                  variant="outline"
                  onPress={() => {
                    void closeScreen();
                  }}
                />
              </VStack>
            </Box>
          ) : (
            <>
              <Box className="flex-1">
                <FlatList
                  ref={listRef}
                  style={{ flex: 1 }}
                  data={slides}
                  keyExtractor={(item, index) =>
                    `${item.campaignSlug}-${item.id}-${index}`
                  }
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={onMomentumEnd}
                  renderItem={({ item }) => (
                    <VStack
                      className="flex-1 items-center justify-center px-5"
                      space="md"
                      style={{ width: SCREEN_WIDTH }}
                    >
                      <VStack className="w-full" space="md">
                        <Box className="h-[290px] w-full rounded-2xl bg-background-100 dark:bg-background-0">
                          {item.image_url?.trim() ? (
                            <Box className="h-full w-full items-center justify-center bg-background-100 dark:bg-background-0">
                              <Image
                                source={{ uri: item.image_url.trim() }}
                                style={{ width: "100%", height: "100%" }}
                                resizeMode="contain"
                              />
                            </Box>
                          ) : (
                            <Box className="flex-1 items-center justify-center px-5">
                              <Text className="text-center text-typography-500 dark:text-typography-400">
                                Sin imagen
                              </Text>
                            </Box>
                          )}
                        </Box>
                        <VStack className="w-full pt-2" space="sm">
                          <Text
                            className="text-[34px] font-semibold leading-[40px] text-typography-black dark:text-typography-white"
                          >
                            {item.title || "Novedades"}
                          </Text>
                          <Text className="text-lg leading-7 text-typography-700 dark:text-typography-300">
                            {item.body || ""}
                          </Text>
                        </VStack>
                      </VStack>
                    </VStack>
                  )}
                />
              </Box>

              <HStack className="items-center justify-center pb-4" space="xs">
                {slides.map((slide, index) => (
                  <Box
                    key={`${slide.campaignSlug}-${slide.id}-dot-${index}`}
                    className={`h-2 rounded-full ${
                      index === activeIndex
                        ? "w-6 bg-primary-500"
                        : "w-2 bg-background-300 dark:bg-background-600"
                    }`}
                  />
                ))}
              </HStack>
            </>
          )}
        </VStack>
      </JBMainLayout>
    </>
  );
};
