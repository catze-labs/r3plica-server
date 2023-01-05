declare namespace NodeJS {
  interface ProcessEnv {
    ENVIRONMENT: "local" | "dev" | "prod";
    PORT: number;
    PRIVATE_KEY: string;

    DATABASE_URL: string;

    PLAY_FAB_X_SECRET_KEY: string;
    PLAY_FAB_TITLE_ID: string;
    PLAY_FAB_HOST: string;

    BSC_TEST_PROVIDER: string;
    BSC_PROVIDER: string;
    BSCAN_API_KEY: string;

    APOTHEM_PROVIDER: string;
    SLACK_WEBHOOK_URL: string;
  }
}
