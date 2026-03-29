import React, { useState, useEffect, useRef } from "react";

const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

export const ScrambleText = ({
  children,
  className = "",
  isSequential = false,
}) => {
  const [displayText, setDisplayText] = useState(children);
  const [isHovering, setIsHovering] = useState(false);
  const [width, setWidth] = useState("auto");
  const containerRef = useRef(null);
  const intervalRef = React.useRef(null);

  // Measure the width of the original text
  useEffect(() => {
    if (containerRef.current) {
      // Force a small delay to ensure accurate measurement
      const timer = setTimeout(() => {
        setWidth(containerRef.current.offsetWidth);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [children]);

  useEffect(() => {
    if (!isHovering) {
      setDisplayText(children);
      return;
    }

    const text = String(children);
    const targetLength = text.length;
    let iteration = 0;
    const maxIterations = isSequential ? 8 : 8;

    const scramble = () => {
      let scrambledText = "";
      for (let i = 0; i < targetLength; i++) {
        if (isSequential) {
          // Letter-by-letter sequential reveal
          const letterStartIteration = i;
          if (iteration >= letterStartIteration + maxIterations) {
            // After max iterations for this letter, show it
            scrambledText += text[i];
          } else if (iteration >= letterStartIteration) {
            // Currently animating this letter
            scrambledText += CHARS[Math.floor(Math.random() * CHARS.length)];
          } else {
            // Haven't started animating this letter yet
            scrambledText += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        } else {
          // Original behavior - all letters at once
          if (iteration >= maxIterations) {
            scrambledText += text[i];
          } else {
            scrambledText += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        }
      }
      setDisplayText(scrambledText);

      const totalIterations = isSequential
        ? targetLength + maxIterations
        : maxIterations;
      if (iteration < totalIterations) {
        iteration++;
        intervalRef.current = setTimeout(scramble, 25);
      } else {
        setDisplayText(text);
      }
    };

    intervalRef.current = setTimeout(scramble, 25);

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [isHovering, children, isSequential]);

  return (
    <span
      ref={containerRef}
      className={className}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        display: "inline-block",
        minWidth: width !== "auto" ? `${width}px` : "auto",
        fontWeight: "inherit",
        fontSize: "inherit",
        letterSpacing: "inherit",
        whiteSpace: "nowrap",
      }}
    >
      {displayText}
    </span>
  );
};
