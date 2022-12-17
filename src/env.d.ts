declare namespace NodeJS {
  interface ProcessEnv {
    ENVIRONMENT: "local" | "dev" | "prod";
    PORT: number;
    DATABASE_URL: string;
    PLAY_FAB_X_SECRET_KEY: string;
    PLAY_FAB_TITLE_ID: string;
    PLAY_FAB_HOST: string;
    WEB3_STORAGE_API_TOKEN: string;
    BSC_TEST_PROVIDER: string;
    BSC_PROVIDER: string;
  }
}
