/**
 * Mode clair imposé : le SIRH n'utilise pas de thème sombre.
 * Écrase toute préférence éventuellement stockée (système ou ancien choix).
 */
export default defineNuxtPlugin(() => {
  const colorMode = useColorMode();
  if (colorMode.preference !== "light") colorMode.preference = "light";
});
