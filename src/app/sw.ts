// src/app/sw.ts
import { defaultCache } from "@serwist/next/worker";
import type {
  PrecacheEntry,
  SerwistGlobalConfig,
  RuntimeCaching,
} from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const runtimeCaching: RuntimeCaching[] = [
  // Never cache Auth.js endpoints
  {
    matcher: ({ url }) => url.pathname.startsWith("/api/auth/"),
    handler: new NetworkOnly(),
  },

  // If you want to be extra-safe, disable caching for all API routes:
  // {
  //   matcher: ({ url }) => url.pathname.startsWith("/api/"),
  //   handler: new NetworkOnly(),
  // },

  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
