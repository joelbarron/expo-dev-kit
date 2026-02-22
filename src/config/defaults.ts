import { JBAppConfig } from './types';

export const defaultJBExpoConfig: JBAppConfig = {
  debug: false,
  forceHideStage: false,
  stage: 'DEVELOPMENT',
  defaultRows: 30,
  maxRows: 999999999,
  momentLocale: 'es-mx',
  defaultLocaleDate: 'es',
  dateFormat: 'YYYY-MM-DD',
  dateTimeFormat: 'dddd DD MMM YYYY HH:mm:ss',
  defaultFormatDateAPI: 'YYYY-MM-DD',
  api: {
    version: 'v1',
    host: {
      PRODUCTION: 'https://api.example.com',
      QA: 'https://api-qa.example.com',
      DEVELOPMENT: 'http://127.0.0.1:8000',
      LOCAL: 'http://localhost:8000'
    }
  },
  auth: {
    apiBasePath: '/authentication',
    showDebugSocial: false,
    signUp: {
      minimumAge: 18
    },
    visuals: {
      verifyEmail: {
        showAnimation: true,
        animationAutoPlay: true,
        animationLoop: true,
        successAnimationLoop: false,
        animationSpeed: 1,
        animationSize: 180
      }
    },
    profileRoles: [],
    defaultProfileRole: undefined,
    social: {
      strategy: {
        defaultMode: 'expo',
        fallbackMode: 'expo'
      },
      google: {
        enabled: false,
        clientId: '',
        iosClientId: '',
        androidClientId: '',
        redirectUri: '',
        scopes: ['openid', 'profile', 'email']
      },
      facebook: {
        enabled: false,
        clientId: '',
        clientToken: '',
        redirectUri: '',
        scopes: ['public_profile', 'email']
      },
      apple: {
        enabled: false,
        clientId: '',
        redirectUri: '',
        scopes: ['name', 'email']
      }
    }
  },
  userDebug: {
    login: '',
    password: '',
    signUp: {}
  }
};
