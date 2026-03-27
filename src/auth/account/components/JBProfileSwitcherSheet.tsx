import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { TouchableOpacity } from "react-native";
import Toast from "react-native-toast-message";

import { getLastCreatedJBExpoConfig, resolveJBUIColor } from "../../../config";
import { JBFormButton } from "../../../forms";
import { useColorScheme } from "../../../hooks";
import { useAppConfigStore } from "../../../runtime";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
  Box,
  HStack,
  Text,
  VStack,
} from "../../../ui";
import { getColor } from "../../../utils";
import { getProfileFullName } from "../../utils";
import { useJBProfileSwitcher } from "../hooks";

type JBProfileSwitcherSheetProps = {
  open: boolean;
  onClose: () => void;
  basePath?: string;
  title?: string;
  subtitle?: string;
  showCreateProfile?: boolean;
  navigateAfterSwitch?: boolean;
  onProfileSwitched?: (profile: Record<string, any>) => void;
  onCreateProfile?: () => void;
};

const getProfileId = (profile: Record<string, any>): string =>
  String(profile?.id ?? profile?.pk ?? "");

export const JBProfileSwitcherSheet = ({
  open,
  onClose,
  basePath = "/user",
  title = "Cambiar perfil",
  subtitle = "Selecciona el perfil con el que quieres continuar.",
  showCreateProfile = true,
  navigateAfterSwitch = true,
  onProfileSwitched,
  onCreateProfile,
}: JBProfileSwitcherSheetProps) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const baseConfig = getLastCreatedJBExpoConfig();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const isPresentedRef = useRef(false);
  const primary = getColor("primary") ?? {};
  const background = getColor("background") ?? {};
  const typography = getColor("typography") ?? {};

  const {
    profiles,
    activeProfile,
    isLoadingProfiles,
    isSwitchingProfileId,
    canCreateProfile,
    canSwitchProfiles,
    isEnabled,
    homePathAfterProfileSwitch,
    refreshProfiles,
    switchToProfile,
  } = useJBProfileSwitcher();

  const resolvedBottomSheetBackgroundColor = resolveJBUIColor(
    baseConfig?.ui?.forms?.bottomSheetBackgroundColor,
    colorScheme,
    colorScheme === "dark"
      ? background[950] ?? "#121b26"
      : background[50] ?? "#ffffff",
  );

  const snapPoints = useMemo(() => ["30%", "45%"], []);
  const roleOptions = useMemo(
    () =>
      ((appConfig?.auth?.profileRoles ??
        baseConfig?.auth?.profileRoles ??
        []) as Array<{
        value?: string;
        label?: string;
      }>) ?? [],
    [appConfig?.auth?.profileRoles, baseConfig?.auth?.profileRoles],
  );

  const closeSheet = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  useEffect(() => {
    if (open) {
      if (!isPresentedRef.current) {
        bottomSheetModalRef.current?.present();
        isPresentedRef.current = true;
        void refreshProfiles().catch(() => undefined);
      }
      return;
    }

    if (isPresentedRef.current) {
      bottomSheetModalRef.current?.dismiss();
      isPresentedRef.current = false;
    }
  }, [open, refreshProfiles]);

  const handleDismiss = useCallback(() => {
    if (isPresentedRef.current) {
      isPresentedRef.current = false;
    }
    onClose();
  }, [onClose]);

  const handleSwitchProfile = useCallback(
    async (profile: Record<string, any>) => {
      if (!canSwitchProfiles) return;
      const targetId = getProfileId(profile);
      if (!targetId) return;

      try {
        const changed = await switchToProfile(targetId);
        if (!changed) return;
        onProfileSwitched?.(profile);
        if (navigateAfterSwitch) {
          router.replace((homePathAfterProfileSwitch || "/") as any);
        }
        closeSheet();
      } catch (error: any) {
        const fallbackMessage =
          "No se pudo cambiar el perfil. Intenta de nuevo.";
        const detail =
          typeof error?.data?.detail === "string"
            ? error.data.detail
            : typeof error?.message === "string"
            ? error.message
            : fallbackMessage;
        Toast.show({
          type: "error",
          text1: "No se pudo cambiar el perfil",
          text2: detail || fallbackMessage,
        });
      }
    },
    [
      canSwitchProfiles,
      closeSheet,
      homePathAfterProfileSwitch,
      navigateAfterSwitch,
      onProfileSwitched,
      router,
      switchToProfile,
    ],
  );

  const handleCreateProfile = useCallback(() => {
    if (onCreateProfile) {
      onCreateProfile();
    } else {
      router.push(`${basePath}/profiles/create` as any);
    }
    closeSheet();
  }, [basePath, closeSheet, onCreateProfile, router]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        pressBehavior="close"
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    [],
  );

  const activeId = activeProfile ? getProfileId(activeProfile as any) : null;
  const getProfileRoleLabel = useCallback(
    (profile: Record<string, any>): string => {
      const rawRoleValue = String(
        profile?.role ?? profile?.role_value ?? "",
      ).trim();
      if (rawRoleValue) {
        const option = roleOptions.find(
          (roleOption) =>
            String(roleOption?.value ?? "")
              .trim()
              .toUpperCase() === rawRoleValue.toUpperCase(),
        );
        if (option?.label) return option.label;
      }

      return (
        String(
          profile?.roleLabel ?? profile?.role_label ?? rawRoleValue ?? "",
        ).trim() || "Perfil"
      );
    },
    [roleOptions],
  );

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enableOverDrag={false}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: resolvedBottomSheetBackgroundColor }}
    >
      <VStack className="flex-1 px-5 pt-3" space="md">
        <VStack space="xs">
          <Text
            size="lg"
            bold
            className="text-typography-black dark:text-typography-white"
          >
            {title}
          </Text>
          <Text className="text-typography-600 dark:text-typography-400">
            {subtitle}
          </Text>
        </VStack>

        <BottomSheetFlatList
          data={profiles}
          keyExtractor={(item, index) => {
            const profileId = getProfileId(item);
            return profileId
              ? `profile-${profileId}`
              : `profile-index-${index}`;
          }}
          renderItem={({ item }) => {
            const profileId = getProfileId(item);
            const isActive = Boolean(
              activeId && profileId && activeId === profileId,
            );
            const isSwitching = isSwitchingProfileId === profileId;
            const pictureUri =
              typeof item.__picture_uri === "string" ? item.__picture_uri : "";
            const profileName =
              getProfileFullName(item) ||
              String(item?.name ?? item?.username ?? "Perfil");

            return (
              <TouchableOpacity
                activeOpacity={0.9}
                disabled={!canSwitchProfiles || isSwitching}
                onPress={() => void handleSwitchProfile(item)}
              >
                <HStack
                  className={`mb-2 items-center rounded-2xl px-4 py-3 ${
                    isActive
                      ? "bg-primary-500/15"
                      : "bg-background-150 dark:bg-background-200"
                  }`}
                  space="md"
                >
                  <Avatar size="md" className="bg-primary-500">
                    {pictureUri ? (
                      <AvatarImage source={{ uri: pictureUri }} />
                    ) : (
                      <AvatarFallbackText>{profileName}</AvatarFallbackText>
                    )}
                  </Avatar>

                  <VStack className="flex-1" space="xs">
                    <Text
                      bold
                      size="md"
                      className="text-typography-black dark:text-typography-white"
                      numberOfLines={1}
                    >
                      {profileName}
                    </Text>
                    <Text
                      size="xs"
                      className="text-typography-500 dark:text-typography-400"
                      numberOfLines={1}
                    >
                      {getProfileRoleLabel(item)}
                    </Text>
                  </VStack>

                  <Box className="items-end">
                    {isActive ? (
                      <Box className="rounded-full bg-primary-500 px-2 py-1">
                        <Text size="xs" className="font-semibold text-white">
                          Activo
                        </Text>
                      </Box>
                    ) : (
                      <Text
                        size="xs"
                        className="font-semibold text-primary-600 dark:text-primary-300"
                      >
                        {isSwitching ? "Cambiando..." : "Cambiar"}
                      </Text>
                    )}
                  </Box>
                </HStack>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Box className="py-6">
              <Text className="text-typography-500 dark:text-typography-400">
                {isLoadingProfiles
                  ? "Cargando perfiles..."
                  : "No hay perfiles disponibles."}
              </Text>
            </Box>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        />

        {showCreateProfile && canCreateProfile ? (
          <JBFormButton
            variant="outline"
            action="primary"
            text="Crear perfil"
            onPress={handleCreateProfile}
            className="mb-2"
          />
        ) : null}

        <JBFormButton
          variant="link"
          action="secondary"
          text="Cerrar"
          className="mb-2"
          textClassName="text-sm font-semibold"
          onPress={closeSheet}
        />
      </VStack>
    </BottomSheetModal>
  );
};
