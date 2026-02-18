import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { useColorScheme } from "../../hooks";
import { useAppConfigStore } from "../../runtime";
import { Box, Button, ButtonText, Text, VStack } from "../../ui";
import { getColor } from "../../utils";
import { getLastCreatedJBExpoConfig } from "../../config";
import { JBAuthOtpSignInForm, JBAuthPasswordSignInForm } from "../forms";
import { useJBAuth } from "../provider";
import { LoginSocialPayload } from "../types";
import { AuthScreenLayout, JBAuthSecondaryButton } from "../ui";
import { JBAuthNavigator } from "./types";

export type JBAuthSignInScreenProps = {
  navigator: JBAuthNavigator;
  enableOtp?: boolean;
  initialMode?: "password" | "otp";
  socialProviders?: string[];
  socialAuthenticator?: (
    provider: string,
  ) => Promise<LoginSocialPayload | null>;
};

export function JBAuthSignInScreen(props: JBAuthSignInScreenProps) {
  const {
    navigator,
    enableOtp = true,
    initialMode = "password",
    socialProviders = ["google", "apple", "facebook"],
    socialAuthenticator,
  } = props;
  const auth = useJBAuth();
  const appConfig = useAppConfigStore((state: any) => state?.appConfig);
  const baseConfig = getLastCreatedJBExpoConfig();
  const isConfigDebug = Boolean(appConfig?.debug ?? baseConfig.debug);
  const colorScheme = useColorScheme();
  const primaryColor = getColor("primary") ?? {};
  const [mode, setMode] = useState<"password" | "otp">(initialMode);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const normalizedSocialProviders = socialProviders
    .map((provider) => provider.trim().toLowerCase())
    .filter((provider) => ["google", "apple", "facebook"].includes(provider));
  const hasProvider = (provider: string) =>
    normalizedSocialProviders.includes(provider);
  const debugLogin = appConfig?.userDebug?.login ?? baseConfig.userDebug?.login ?? "";
  const debugPassword = appConfig?.userDebug?.password ?? baseConfig.userDebug?.password ?? "";
  const signInDefaultValues =
    isConfigDebug && (debugLogin || debugPassword)
      ? {
          login: debugLogin,
          password: debugPassword,
        }
      : undefined;

  const signInWithProvider = async (provider: string) => {
    if (!socialAuthenticator) {
      return;
    }
    const payload = await socialAuthenticator(provider);
    if (!payload) {
      return;
    }
    try {
      setIsSocialLoading(true);
      await auth.signInSocial(payload);
      navigator.onSignedIn?.();
    } finally {
      setIsSocialLoading(false);
    }
  };

  return (
    <AuthScreenLayout>
      {mode === "password" ? (
        <JBAuthPasswordSignInForm
          defaultValues={signInDefaultValues}
          onPressVerifyAccount={(email) =>
            navigator.goToVerifyEmail?.({ email })
          }
          onSubmit={async (values) => {
            await auth.signIn(values);
            navigator.onSignedIn?.();
          }}
        />
      ) : (
        <JBAuthOtpSignInForm
          onRequestOtp={(values) =>
            auth.requestOtp({ phone: values.phone, channel: "sms" })
          }
          onVerifyOtp={async (values) => {
            await auth.signInOtp({
              phone: values.phone,
              code: values.code,
              channel: "sms",
              role: values.role,
              client: "mobile",
            });
            navigator.onSignedIn?.();
          }}
        />
      )}

      {mode === "password" ? (
        <Button
          variant="link"
          action="primary"
          size="md"
          className="self-center px-0"
          onPress={navigator.goToForgotPassword}
        >
          <ButtonText className="text-sm font-semibold text-primary-600 dark:text-primary-300">
            ¿Olvidaste tu contraseña?
          </ButtonText>
        </Button>
      ) : null}
      <JBAuthSecondaryButton
        label="Crear cuenta"
        style={{marginTop: 30}}
        onPress={navigator.goToSignUp}
      />

      <VStack space="md" style={styles.variantsSection}>
        <Box style={styles.titleContainer}>
          <Text
            className="mb-1 w-full text-center text-sm font-semibold"
            style={{ color: colorScheme === "dark" ? "#9ca3af" : "#9ca3af" }}
          >
            Accede con
          </Text>
        </Box>

        <View style={styles.socialRow}>
          <Button
            className="h-10 rounded-lg border border-zinc-300 bg-white"
            style={[styles.socialButtonHalf, styles.googleButton]}
            isDisabled={!hasProvider("google") || !socialAuthenticator || isSocialLoading}
            onPress={() => signInWithProvider("google")}
          >
            <View style={styles.socialButtonContent}>
              <MaterialCommunityIcons
                name="google"
                size={18}
                color="#EA4335"
              />
              <ButtonText className="text-base font-semibold text-zinc-800">
                Google
              </ButtonText>
            </View>
          </Button>

           <Button
            className="h-10 rounded-lg border border-black bg-black"
            style={styles.socialButtonHalf}
            isDisabled={!hasProvider("apple") || !socialAuthenticator || isSocialLoading}
            onPress={() => signInWithProvider("apple")}
          >
            <View style={styles.socialButtonContent}>
              <MaterialCommunityIcons
                name="apple"
                size={18}
                color="#ffffff"
              />
              <ButtonText className="text-base font-semibold text-white">
                Apple
              </ButtonText>
            </View>
          </Button>
        </View>

        <View style={styles.socialRow}>
          <Button
            className="h-10 rounded-lg border"
            style={[styles.socialButtonHalf, styles.facebookButton]}
            isDisabled={!hasProvider("facebook") || !socialAuthenticator || isSocialLoading}
            onPress={() => signInWithProvider("facebook")}
          >
            <View style={styles.socialButtonContent}>
              <MaterialCommunityIcons
                name="facebook"
                size={18}
                color="#ffffff"
              />
              <ButtonText className="text-base font-semibold text-white">
                Facebook
              </ButtonText>
            </View>
          </Button>

          <Button
            className="h-10 rounded-lg border"
            style={[styles.socialButtonHalf, {
              borderColor: primaryColor[500] ?? "#10b981",
              backgroundColor: primaryColor[500] ?? "#10b981",
            }]}
            isDisabled={!enableOtp || mode === "otp"}
            onPress={() => setMode("otp")}
          >
            <View style={styles.socialButtonContent}>
              <MaterialCommunityIcons
                name="cellphone"
                size={18}
                color="#ffffff"
              />
              <ButtonText className="text-base font-semibold text-white">
                SMS
              </ButtonText>
            </View>
          </Button>
        </View>
      </VStack>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  variantsSection: {
    paddingTop: 35,
  },
  titleContainer: {
    width: "100%",
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  socialRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  socialButtonHalf: {
    width: "48%",
  },
  googleButton: {
    borderColor: "#d4d4d8",
    backgroundColor: "#ffffff",
  },
  facebookButton: {
    borderColor: "#1877F2",
    backgroundColor: "#1877F2",
  },
  socialButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
