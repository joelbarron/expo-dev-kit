export type JBAppStage = 'PRODUCTION' | 'QA' | 'DEVELOPMENT' | 'LOCAL';
export type JBAppStageLowercase = Lowercase<JBAppStage>;

export type JBApiHostConfig = Partial<Record<JBAppStage, string>> &
  Partial<Record<JBAppStageLowercase, string>>;

export type JBAppConfig = {
  debug: boolean;
  forceHideStage: boolean;
  stage: JBAppStage;
  defaultRows: number;
  maxRows: number;
  momentLocale: string;
  defaultLocaleDate: string;
  dateFormat: string;
  dateTimeFormat: string;
  defaultFormatDateAPI: string;
  api: {
    version: string;
    host: JBApiHostConfig;
  };
  auth: {
    apiBasePath: string;
  };
  userDebug: {
    login: string;
    password: string;
  };
};

type JBDeepPartial<T> = T extends Array<infer U>
  ? Array<JBDeepPartial<U>>
  : T extends object
    ? { [K in keyof T]?: JBDeepPartial<T[K]> }
    : T;

export type JBAppConfigOverrides = JBDeepPartial<JBAppConfig>;
