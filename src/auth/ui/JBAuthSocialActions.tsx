import { MaterialCommunityIcons } from "@expo/vector-icons";

import { getLastCreatedJBExpoConfig, resolveJBUIColor } from "../../config";
import { JBFormButton } from "../../forms";
import { useColorScheme } from "../../hooks";
import { useAppConfigStore } from "../../runtime";
import { Box, ButtonText, Text, VStack } from "../../ui";
import { getColor } from "../../utils";

type JBAuthSocialActionsProps = {
  googleEnabled?: boolean;
  appleEnabled?: boolean;
  showApple?: boolean;
  facebookEnabled?: boolean;
  smsEnabled?: boolean;
  showSms?: boolean;
  smsActive?: boolean;
  isSocialLoading?: boolean;
  onGooglePress?: () => void;
  onApplePress?: () => void;
  onFacebookPress?: () => void;
  onSmsPress?: () => void;
  title?: string;
  iconStyle?: "brand" | "neutral";
};

export function JBAuthSocialActions({
  googleEnabled = false,
  appleEnabled = false,
  showApple = true,
  facebookEnabled = false,
  smsEnabled = false,
  showSms = true,
  smsActive = false,
  isSocialLoading = false,
  onGooglePress,
  onApplePress,
  onFacebookPress,
  onSmsPress,
  title,
  iconStyle = "brand",
}: JBAuthSocialActionsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const baseConfig = getLastCreatedJBExpoConfig();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const resolvedUiConfig = {
    ...(baseConfig?.ui ?? {}),
    ...(appConfig?.ui ?? {}),
    auth: {
      ...(baseConfig?.ui?.auth ?? {}),
      ...(appConfig?.ui?.auth ?? {}),
    },
  };
  const socialButtonsConfig =
    resolvedUiConfig?.auth?.socialButtons ?? resolvedUiConfig?.socialButtons;
  const typography = getColor("typography") ?? {};
  const background = getColor("background") ?? {};
  const outline = getColor("outline") ?? {};
  const primary = getColor("primary") ?? {};
  const defaultLightTextColor =
    typography.black ?? typography[900] ?? "#0f172a";
  const defaultDarkTextColor =
    typography.white ?? typography[50] ?? "#f8fafc";
  const neutralTextColor = resolveJBUIColor(
    socialButtonsConfig?.textColor,
    colorScheme,
    isDark ? defaultDarkTextColor : defaultLightTextColor,
  );
  const neutralIconColor = neutralTextColor;
  const socialButtonBackgroundColor = resolveJBUIColor(
    socialButtonsConfig?.backgroundColor,
    colorScheme,
    isDark ? background[200] ?? "#121b26" : background[50] ?? "#ffffff",
  );
  const socialButtonBorderColor = resolveJBUIColor(
    socialButtonsConfig?.borderColor,
    colorScheme,
    isDark ? outline[700] ?? "#334155" : outline[200] ?? "#e2e8f0",
  );
  const socialButtonIconColor = resolveJBUIColor(
    socialButtonsConfig?.iconColor,
    colorScheme,
    neutralIconColor,
  );

  const resolveIconColor = (
    icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"],
  ) => {
    if (iconStyle === "neutral") {
      return neutralIconColor;
    }
    if (icon === "google") {
      return "#ea4335";
    }
    if (icon === "facebook") {
      return "#1877f2";
    }
    if (icon === "message-processing-outline" || icon === "email-outline") {
      if (isDark) {
        return primary[500] ?? neutralIconColor;
      } else {
        return socialButtonIconColor;
      }
    }
    if (icon === "apple") {
      return socialButtonIconColor;
    }
    return socialButtonIconColor;
  };

  const renderAction = ({
    label,
    icon,
    enabled,
    onPress,
  }: {
    label: string;
    icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
    enabled: boolean;
    onPress?: () => void;
  }) =>
    enabled ? (
      <JBFormButton
        // variant="outline"
        action="default"
        size="xl"
        className="w-full border"
        style={{
          backgroundColor: socialButtonBackgroundColor,
          borderColor: socialButtonBorderColor,
        }}
        isDisabled={!enabled || isSocialLoading}
        onPress={onPress}
        showText={false}
        showIcon={false}
      >
        <Box className="w-full flex-row items-center px-12">
          <Box className="w-7 items-center justify-center">
            <MaterialCommunityIcons
              name={icon}
              size={20}
              color={resolveIconColor(icon)}
            />
          </Box>
          <ButtonText
            className="ml-3 text-base font-medium"
            style={{ color: neutralTextColor }}
          >
            {label}
          </ButtonText>
        </Box>
      </JBFormButton>
    ) : null;

  return (
    <VStack space="sm" className="w-full">
      {title ? (
        <Text
          size="xl"
          className="pb-1 text-center mb-2"
          style={{ color: primary[500] ?? "#10b981" }}
        >
          {title}
        </Text>
      ) : null}
      {renderAction({
        label: "Continuar con Google",
        icon: "google",
        enabled: googleEnabled,
        onPress: onGooglePress,
      })}
      {showApple
        ? renderAction({
            label: "Continuar con Apple",
            icon: "apple",
            enabled: appleEnabled,
            onPress: onApplePress,
          })
        : null}
      {renderAction({
        label: "Continuar con Facebook",
        icon: "facebook",
        enabled: facebookEnabled,
        onPress: onFacebookPress,
      })}
      {showSms
        ? renderAction({
            label: smsActive ? "Continuar con contraseña" : "Continuar con SMS",
            icon: smsActive ? "email-outline" : "message-processing-outline",
            enabled: smsEnabled,
            onPress: onSmsPress,
          })
        : null}
    </VStack>
  );
}

// Backward-compatible alias while consumers migrate from the old name.
export const JBAuthSocialFooterActions = JBAuthSocialActions;
