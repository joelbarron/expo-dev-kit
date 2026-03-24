import { JBAppConfig } from "./types";

export const defaultJBExpoConfig: JBAppConfig = {
  debug: false,
  forceHideStage: false,
  stage: "DEVELOPMENT",
  defaultRows: 30,
  maxRows: 999999999,
  momentLocale: "es-mx",
  defaultLocaleDate: "es",
  dateFormat: "YYYY-MM-DD",
  dateTimeFormat: "dddd DD MMM YYYY HH:mm:ss",
  defaultFormatDateAPI: "YYYY-MM-DD",
  api: {
    version: "v1",
    host: {
      PRODUCTION: "https://api.example.com",
      QA: "https://api-qa.example.com",
      DEVELOPMENT: "http://127.0.0.1:8000",
      LOCAL: "http://localhost:8000",
    },
  },
  stripe: {
    enabled: false,
    useStripe: false,
    publishableKey: {
      PRODUCTION: "",
      QA: "",
      DEVELOPMENT: "",
      LOCAL: "",
    },
    merchantIdentifier: "",
    urlScheme: "",
    setReturnUrlSchemeOnAndroid: false,
  },
  auth: {
    apiBasePath: "/authentication",
    showDebugSocial: false,
    signUp: {
      minimumAge: 18,
    },
    visuals: {
      verifyEmail: {
        showAnimation: true,
        animationAutoPlay: true,
        animationLoop: true,
        successAnimationLoop: false,
        animationSpeed: 1,
        animationSize: 180,
      },
    },
    userSettings: {
      enabled: true,
      routing: {
        homePathAfterProfileSwitch: "/",
      },
      screens: {
        profiles: {
          enabled: true,
          allowSwitch: true,
          allowCreate: false,
        },
        changePassword: {
          enabled: true,
        },
        photo: {
          enabled: true,
          crop: {
            enabled: true,
            allowsEditing: true,
            aspect: [1, 1],
          },
        },
        personalData: {
          enabled: true,
        },
      },
    },
    profileRoles: [],
    defaultProfileRole: undefined,
    social: {
      strategy: {
        defaultMode: "expo",
        fallbackMode: "expo",
      },
      google: {
        enabled: false,
        clientId: "",
        iosClientId: "",
        androidClientId: "",
        redirectUri: "",
        scopes: ["openid", "profile", "email"],
      },
      facebook: {
        enabled: false,
        clientId: "",
        clientToken: "",
        redirectUri: "",
        scopes: ["public_profile", "email"],
      },
      apple: {
        enabled: false,
        clientId: "",
        redirectUri: "",
        scopes: ["name", "email"],
      },
    },
  },
  ui: {
    header: {
      backgroundColor: {
        light: "primary.500",
        dark: "background.950",
      },
      tintColor: {
        light: "#ffffff",
        dark: "#ffffff",
      },
    },
    tabs: {
      backgroundColor: {
        light: "background.100",
        dark: "background.950",
      },
      borderTopColor: "transparent",
      activeTintColor: {
        light: "primary.500",
        dark: "primary.400",
      },
      inactiveTintColor: {
        light: "gray.500",
        dark: "gray.400",
      },
    },
    main: {
      backgroundColor: {
        light: "background.100",
        dark: "background.0",
      },
    },
    card: {
      backgroundColor: {
        light: "background.150",
        dark: "background.200",
      },
    },
    footer: {
      backgroundColor: {
        light: "background.100",
        dark: "background.950",
      },
    },
    forms: {
      backgroundColor: {
        light: "background.150",
        dark: "background.200",
      },
      textColor: {
        light: "typography.black",
        dark: "typography.50",
      },
      bottomSheetBackgroundColor: {
        light: "background.100",
        dark: "background.950",
      },
    },
    socialButtons: {
      backgroundColor: {
        light: "background.150",
        dark: "background.200",
      },
      borderColor: {
        light: "gray.200",
        dark: "muted.700",
      },
      textColor: {
        light: "typography.black",
        dark: "typography.50",
      },
      iconColor: {
        light: "typography.black",
        dark: "typography.50",
      },
    },
  },
  userDebug: {
    login: "",
    password: "",
    signUp: {},
  },
};
