import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Box, Button, ButtonText, Text } from "../../ui";

type JBAuthSocialFooterActionsProps = {
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
  smsColor?: string;
};

export function JBAuthSocialFooterActions({
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
  smsColor = "#10b981",
}: JBAuthSocialFooterActionsProps) {
  return (
    <Box className="pt-4">
      <Box className="mb-4 w-full items-center justify-center">
        <Text
          className="mb-1 w-full text-center text-sm font-semibold"
          style={{ color: "#9ca3af" }}
        >
          O accede con
        </Text>
      </Box>

      <Box className="mb-2 w-full flex-row justify-between">
        <Button
          className="h-10 w-[48%] rounded-lg border border-zinc-300 bg-white"
          isDisabled={!googleEnabled || isSocialLoading}
          onPress={onGooglePress}
        >
          <Box className="flex-row items-center justify-center gap-2">
            <MaterialCommunityIcons name="google" size={18} color="#EA4335" />
            <ButtonText className="text-base font-semibold text-zinc-800">
              Google
            </ButtonText>
          </Box>
        </Button>

        {showApple ? (
          <Button
            className="h-10 w-[48%] rounded-lg border border-black bg-black"
            isDisabled={!appleEnabled || isSocialLoading}
            onPress={onApplePress}
          >
            <Box className="flex-row items-center justify-center gap-2">
              <MaterialCommunityIcons name="apple" size={18} color="#ffffff" />
              <ButtonText className="text-base font-semibold text-white">
                Apple
              </ButtonText>
            </Box>
          </Button>
        ) : (
          <Box className="w-[48%]" />
        )}
      </Box>

      <Box className="w-full flex-row justify-between">
        <Button
          className="h-10 w-[48%] rounded-lg border"
          style={{ borderColor: "#1877F2", backgroundColor: "#1877F2" }}
          isDisabled={!facebookEnabled || isSocialLoading}
          onPress={onFacebookPress}
        >
          <Box className="flex-row items-center justify-center gap-2">
            <MaterialCommunityIcons
              name="facebook"
              size={18}
              color="#ffffff"
            />
            <ButtonText className="text-base font-semibold text-white">
              Facebook
            </ButtonText>
          </Box>
        </Button>

        {showSms ? (
          <Button
            className="h-10 w-[48%] rounded-lg border"
            style={[
              {
                borderColor: smsColor,
                backgroundColor: smsColor,
              },
            ]}
            isDisabled={!smsEnabled || smsActive}
            onPress={onSmsPress}
          >
            <Box className="flex-row items-center justify-center gap-2">
              <MaterialCommunityIcons name="cellphone" size={18} color="#ffffff" />
              <ButtonText className="text-base font-semibold text-white">
                SMS
              </ButtonText>
            </Box>
          </Button>
        ) : (
          <Box className="w-[48%]" />
        )}
      </Box>
    </Box>
  );
}
