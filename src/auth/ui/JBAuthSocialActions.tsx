import { MaterialCommunityIcons } from "@expo/vector-icons";

import { JBFormButton } from "../../forms";
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
  const typography = getColor("typography") ?? {};
  const primary = getColor("primary") ?? {};
  const neutralIconColor = typography[50] ?? "#f8fafc";

  const resolveIconColor = (
    icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]
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
      return primary[500] ?? neutralIconColor;
    }
    return neutralIconColor;
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
  }) => (
    <JBFormButton
      // variant="outline"
      action="default"
      size="xl"
      className="w-full bg-background-200"
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
        <ButtonText className="ml-3 text-base font-medium text-typography-900 dark:text-typography-50">
          {label}
        </ButtonText>
      </Box>
    </JBFormButton>
  );

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
            label: smsActive
              ? "Continuar con contraseña"
              : "Continuar con SMS",
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
