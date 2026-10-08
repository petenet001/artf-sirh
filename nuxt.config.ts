// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-06-01",
  future: { compatibilityVersion: 4 },

  // SPA pur (cf. Vision §1) : la session (token cookie + `auth.user` persisté
  // côté client) n'est pas disponible au rendu serveur ; activer le SSR ne
  // ferait que produire des décalages d'hydratation sur l'UI authentifiée.
  ssr: false,

  // Recharge immédiatement la page si un chunk de route échoue à se charger
  // (module dynamique périmé après build, ou rechargement Vite en dev) au lieu
  // de laisser la navigation « muette » jusqu'au prochain clic.
  experimental: { emitRouteChunkError: "automatic-immediate" },

  devtools: { enabled: true },

  // Nuxt UI enregistre automatiquement @nuxt/icon, @nuxt/fonts et @nuxtjs/color-mode.
  modules: [
    "@nuxt/ui",
    "@nuxt/eslint",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
  ],

  css: ["~/assets/css/main.css"],

  // Application en mode clair uniquement (pas de thème sombre).
  colorMode: {
    preference: "light",
    fallback: "light",
  },

  // Les repositories `app/api/` sont auto-importés au même titre que les
  // composables (ils exposent des fonctions `use<Entite>Api`).
  imports: {
    dirs: ["api"],
  },

  // Détection des composants Nuxt UI réellement utilisés -> CSS plus léger.
  ui: {
    experimental: { componentDetection: true },
    // Gabarit par défaut de TOUS les composants Nuxt UI. `sm` rendait
    // l'interface étriquée ; `md` est la base. Boutons et champs de saisie
    // montent encore d'un cran dans `app.config.ts` (`size: "lg"`).
    theme: { defaultVariants: { size: "md" } },
  },

  // API hébergée. Nuxt remplace automatiquement cette valeur par
  // `NUXT_PUBLIC_API_BASE` si elle est définie. En dev, `.env` la met à `/api`
  // pour passer par le proxy Nitro ci-dessous (contourne le CORS).
  runtimeConfig: {
    public: {
      apiBase: "http://artfrh.sc1difl4205.universe.wf/api",
      // Attribut `secure` du cookie `auth.token` (`NUXT_PUBLIC_COOKIE_SECURE`).
      // `false` par défaut : le déploiement interne est servi en HTTP simple,
      // où un cookie `secure` est refusé par le navigateur. `true` sous HTTPS.
      cookieSecure: false,
    },
  },

  // Proxy de développement : les appels same-origin `/api/**` sont relayés vers
  // l'API distante par le serveur Nitro → plus de requête cross-origin, donc
  // plus de preflight CORS. On utilise `devProxy` (moteur httpxy, http natif de
  // Node) et non `routeRules.proxy` (moteur undici) car undici échoue en 502 à
  // dialoguer avec l'hébergement o2switch, là où le http natif (comme curl)
  // fonctionne. Nitro retire le préfixe `/api` puis le rajoute depuis la cible
  // (`prependPath`), d'où la cible qui inclut `/api`. `changeOrigin` réécrit le
  // Host pour le vhost. En prod, pointer `NUXT_PUBLIC_API_BASE` sur l'API.
  nitro: {
    devProxy: {
      "/api": {
        // API distante par défaut. `API_PROXY_TARGET=http://127.0.0.1:8000/api`
        // (dans `.env`) relaie vers le backend Laravel local : c'est ce qui
        // permet d'exposer l'app sur le réseau (`npm run dev:host`) sans
        // exposer Laravel, les autres postes ne parlant qu'au serveur Nuxt.
        target:
          process.env.API_PROXY_TARGET ??
          "http://artfrh.sc1difl4205.universe.wf/api",
        changeOrigin: true,
        // L'hébergement o2switch (« Tiger Protect ») renvoie un challenge 307
        // aux requêtes dont le User-Agent ressemble à un navigateur. Comme le
        // proxy recopie le UA du navigateur, on l'écrase par une valeur neutre
        // pour laisser passer l'appel serveur→serveur. Contournement de DEV
        // uniquement : en prod, il faut désactiver Tiger Protect sur l'API.
        headers: { "user-agent": "artf-sirh-devproxy" },
      },
    },
  },

  typescript: { typeCheck: false, strict: true },
});
