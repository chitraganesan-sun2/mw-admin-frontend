import { useEffect, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import { clearSessionCookies, sessionCookieOptions } from "@/utils/session";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const COOKIE_EXPIRY_DAYS = INACTIVITY_TIMEOUT / (1000 * 60 * 60 * 24);
const DEBOUNCE_DELAY = 10 * 1000; // 10 seconds debounce

// `onExpire` runs before the redirect; the provider passes it a react-query cache clear so the next
// person to log in on this tab never sees the previous account's cached data.
const useAutoLogout = (router: any, onExpire?: () => void) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const clearSession = useCallback(() => {
    onExpire?.();
    clearSessionCookies();

    router.replace("/");
  }, [router, onExpire]);

  // lastActivity is shared by every open tab. Each tab's own timer used to log out on
  // expiry unconditionally, so an idle background tab signed out the tab the admin was
  // actively using. Re-check the shared value and reschedule if another tab was active.
  const expireIfIdle = useCallback(() => {
    const last = parseInt(Cookies.get("lastActivity") || "", 10);
    const idleFor = Number.isFinite(last) ? Date.now() - last : INACTIVITY_TIMEOUT;
    if (idleFor < INACTIVITY_TIMEOUT) {
      timerRef.current = setTimeout(expireIfIdle, INACTIVITY_TIMEOUT - idleFor);
      return;
    }
    clearSession();
  }, [clearSession]);

  const resetTimer = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      Cookies.set("lastActivity", Date.now().toString(), sessionCookieOptions(COOKIE_EXPIRY_DAYS));
      timerRef.current = setTimeout(expireIfIdle, INACTIVITY_TIMEOUT);
    }, DEBOUNCE_DELAY);

  }, [expireIfIdle]);

  useEffect(() => {
    const lastActivity = Cookies.get("lastActivity");
    if (lastActivity && Date.now() - parseInt(lastActivity) > INACTIVITY_TIMEOUT) {
      clearSession();
    } else {
      resetTimer();
    }

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [resetTimer]);

  return null;
};

export default useAutoLogout;