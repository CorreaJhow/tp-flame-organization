/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL /exec do Web App do Apps Script. Ver .env.example — não é segredo. */
  readonly VITE_GAS_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
