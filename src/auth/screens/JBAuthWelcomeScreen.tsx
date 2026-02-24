import {
  ImageBackground,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { JBFormButton } from "../../forms";
import { AuthScreenLayout } from "../ui";
import { JBAuthNavigator } from "./types";

export type JBAuthWelcomeScreenProps = {
  navigator: JBAuthNavigator;
  appName?: string;
  subtitle?: string;
  backgroundImageSource?: ImageSourcePropType;
};

export function JBAuthWelcomeScreen(props: JBAuthWelcomeScreenProps) {
  const {
    navigator,
    appName,
    subtitle = "Tu dinero, tus reglas.",
    backgroundImageSource,
  } = props;

  if (backgroundImageSource) {
    return (
      <ImageBackground
        source={backgroundImageSource}
        style={styles.root}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.header}>
              {appName ? (
                <Text style={styles.title}>{appName}</Text>
              ) : (
                <Text style={styles.title}>Bienvenido</Text>
              )}
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <View style={styles.actions}>
              <JBFormButton text="Comenzar" onPress={() => navigator.goToSignIn()} />
            </View>
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <AuthScreenLayout useMainLayout={false} title={appName ?? "Bienvenido"} subtitle={subtitle}>
      <JBFormButton text="Comenzar" onPress={() => navigator.goToSignIn()} />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(6, 10, 18, 0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "82%",
    minHeight: "68%",
    justifyContent: "space-between",
  },
  header: {
    marginTop: 28,
  },
  title: {
    textAlign: "center",
    color: "#f8fafc",
    fontSize: 40,
    fontWeight: "700",
    textShadowColor: "rgba(15, 23, 42, 0.65)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    marginTop: 10,
    textAlign: "center",
    color: "#e2e8f0",
    fontSize: 18,
  },
  actions: {
    marginBottom: 20,
  },
});
