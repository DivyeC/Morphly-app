import { useEffect, useRef } from "react";

export const useMouseGlow = () => {
  const glowRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!glowRef.current) return;

      const x = e.clientX;
      const y = e.clientY;

      glowRef.current.style.left = x + "px";
      glowRef.current.style.top = y + "px";
      glowRef.current.style.opacity = "1";
    };

    const handleMouseLeave = () => {
      if (glowRef.current) {
        glowRef.current.style.opacity = "0";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return glowRef;
};
