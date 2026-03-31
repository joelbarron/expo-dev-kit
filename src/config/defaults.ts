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
  settings: {
    routes: {
      root: "/settings",
      notifications: "/settings/notifications",
      permissions: "/settings/permissions",
      security: "/settings/security",
    },
    version: {
      enabled: true,
      title: "Version de la app",
      subtitle: "Consulta el estado de actualizacion de la aplicacion.",
      iosStoreUrl: "",
      androidStoreUrl: "",
    },
    notifications: {
      enabled: true,
      path: "/settings/notifications",
      enablePushListeners: true,
      autoSyncPushToken: true,
      pushTokenSyncPath: "",
      localReminders: {
        enabled: false,
        mode: "manual",
        source: "jb_local_reminders",
        reservationStartOffsetMinutes: 30,
        checkoutOffsetMinutes: 15,
        activeStatuses: ["CREATED", "CONFIRMED", "IN_PROGRESS"],
      },
    },
    permissions: {
      enabled: true,
      path: "/settings/permissions",
    },
    appearance: {
      enabled: true,
      defaultMode: "system",
    },
    security: {
      biometricsEnabled: false,
      biometricsPath: "",
      biometricsPromptOnLogin: true,
      biometricsLockMode: "on_app_open",
      biometricsLockTimeoutSeconds: 300,
      allowDeviceCredentialFallback: true,
    },
  },
  permissions: {
    required: [],
    optional: [],
    guard: {
      enabled: false,
      setupPath: "/settings/permissions",
      authenticatedOnly: false,
      mode: "remindable",
      remindAfterHours: 24,
    },
  },
  runtime: {
    offline: {
      mode: "blocking_with_offline",
    },
    appStatus: {
      strategy: "hybrid",
      enforceUpdateInProductionOnly: true,
      blockOnStoreMandatoryUpdate: true,
      blockOnRemoteOutdated: true,
      updateUrl: "",
      iosStoreUrl: "",
      androidStoreUrl: "",
    },
    announcements: {
      enabled: false,
      endpointPath: "/core/mobile-announcements/",
      routePath: "/announcements",
      autoOpenMode: "first_install_and_new_campaign",
      openAfterRoutes: {
        guest: "/welcome",
        authenticated: "/",
      },
      externalOpenMode: "in_app_browser",
    },
    loading: {
      logoWidth: 180,
      logoHeight: 180,
      showIndicator: true,
      backgroundColor: {
        light: "#FBFBFB",
        dark: "#121B26",
      },
      textColor: {
        light: "#163047",
        dark: "#E5F4FF",
      },
      indicatorColor: {
        light: "#1396CB",
        dark: "#E5F4FF",
      },
    },
  },
  navigation: {},
  auth: {
    apiBasePath: "/authentication",
    routes: {
      welcome: "/welcome",
      authEntry: "/auth-entry",
      signInPassword: "/sign-in-password",
      signInOtp: "/sign-in-otp",
      signUpForm: "/sign-up-form",
      forgotPassword: "/forgot-password",
      resetPassword: "/reset-password",
      verifyEmail: "/verify-email",
      signOut: "/sign-out",
      signedIn: "/",
      guestExplore: "/",
      userBasePath: "/user",
      accountDataPath: "/user/account-data",
      accountSecurityPath: "/user/account-security",
      profilePhotoPath: "/user/photo",
      profilesPath: "/user/profiles",
      paymentMethodsPath: "/payments/payment-methods/list",
      profileCompletionPath: "/account/complete-profile",
    },
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
    welcome: {
      allowGuestExplore: false,
      guestExploreLabel: "Explorar como invitado",
    },
    accountScreens: {
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
    account: {
      allowDefaultProfileEdit: true,
      enableContactVerification: true,
      ensureProfileCompletion: false,
      profileCompletionMode: "enforced",
      profileCompletionPath: "/account/complete-profile",
      requiredProfileFields: {
        firstName: true,
        lastName1: true,
        lastName2: false,
        birthday: true,
        gender: true,
        label: false,
      },
      subscriptionUrl: undefined,
      menu: {
        include: ["security", "settings", "signOut"],
        order: ["security", "settings", "signOut"],
        overrides: {},
        confirmations: {
          signOut: {
            title: "Cerrar sesion",
            content: "Estas seguro de que deseas cerrar sesion?",
            agreeText: "Si, cerrar sesion",
            agreeColor: "primary",
            disagreeText: "Cancelar",
            disagreeColor: "negative",
          },
        },
      },
      profileMirror: {
        enabled: false,
        rolePairs: [["HOST", "GUEST"]],
        syncFields: [
          "first_name",
          "last_name_1",
          "last_name_2",
          "birthday",
          "gender",
          "picture",
          "label",
        ],
        autocureOnAuthEvents: true,
      },
    },
    profileRoles: [],
    defaultProfileRole: undefined,
    userDebug: {
      login: "",
      password: "",
      signUp: {},
    },
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
    auth: {
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
      footerButtons: {
        primary: {
          action: "primary",
          variant: "solid",
          size: "xl",
          className: "px-4",
        },
        secondary: {
          action: "primary",
          variant: "link",
          size: "sm",
          className: "self-center px-0",
          textClassName:
            "text-sm font-medium text-primary-600 dark:text-primary-300",
        },
      },
    },
    chip: {
      active: {
        backgroundColor: {
          light: "primary.500",
          dark: "primary.500",
        },
        borderColor: "transparent",
        textColor: {
          light: "typography.white",
          dark: "typography.white",
        },
      },
      inactive: {
        backgroundColor: {
          light: "background.150",
          dark: "background.200",
        },
        borderColor: {
          light: "outline.200",
          dark: "outline.700",
        },
        textColor: {
          light: "typography.black",
          dark: "typography.50",
        },
      },
    },
  },
};
