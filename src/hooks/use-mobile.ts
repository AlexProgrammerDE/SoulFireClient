import * as React from "react";

const MOBILE_BREAKPOINT = 768;

function getIsMobile() {
  return typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(getIsMobile);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(getIsMobile());
    };
    mql.addEventListener("change", onChange);
    setIsMobile(getIsMobile());
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
