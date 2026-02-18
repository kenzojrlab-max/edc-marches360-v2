let appCheckInitialized = false;

export async function initAppCheck() {
  if (appCheckInitialized) return;

  try {
    const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check');
    const { app } = await import('./firebase');

    if (typeof window !== "undefined") {
      // Token de debug uniquement en local
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        // @ts-ignore
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }

      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
    }

    appCheckInitialized = true;
  } catch (error) {
    console.error('App Check initialization failed:', error);
  }
}
