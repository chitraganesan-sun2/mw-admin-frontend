import { useEffect, useRef, useCallback } from "react";
import Cookies from "js-cookie";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const COOKIE_EXPIRY_DAYS = INACTIVITY_TIMEOUT / (1000 * 60 * 60 * 24);
const DEBOUNCE_DELAY = 10 * 1000; // 10 seconds debounce

const useAutoLogout = (router: any) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const clearSession = useCallback(() => {
    Cookies.remove("token");
    Cookies.remove("role");
    Cookies.remove("onboarded_status");
    Cookies.remove("learner_id");
    Cookies.remove("volunteer_id");
    Cookies.remove("lastActivity");

    router.push("/login");
  }, [router]);

  const resetTimer = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      Cookies.set("lastActivity", Date.now().toString(), { expires: COOKIE_EXPIRY_DAYS });
      timerRef.current = setTimeout(clearSession, INACTIVITY_TIMEOUT);
    }, DEBOUNCE_DELAY);

  }, [clearSession]);

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