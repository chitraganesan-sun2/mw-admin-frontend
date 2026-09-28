import { useEffect, useRef, useCallback } from "react";
import Cookies from "js-cookie";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const COOKIE_EXPIRY_DAYS = INACTIVITY_TIMEOUT / (1000 * 60 * 60 * 24);
const DEBOUNCE_DELAY = 10 * 1000; // 10 seconds debounce

const useAutoLogout = (router: any) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const clearSession = useCallback(() => {
    Cookies.remove("token", { path: "/" });
    Cookies.remove("role", { path: "/" });
    Cookies.remove("onboarded_status", { path: "/" });
    Cookies.remove("learner_id", { path: "/" });
    Cookies.remove("volunteer_id", { path: "/" });
    Cookies.remove("lastActivity", { path: "/" });

    router.push("/");
  }, [router]);

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
      Cookies.set("lastActivity", Date.now().toString(), {
        expires: COOKIE_EXPIRY_DAYS,
        path: "/",
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });
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