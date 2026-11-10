import { useEffect, useState, useRef } from "react";

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [trailPos, setTrailPos] = useState({ x: -100, y: -100 });
  const [cursorState, setCursorState] = useState<"default" | "pointer" | "text" | "grab" | "grabbing">("default");
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleIdRef = useRef(0);

  useEffect(() => {
    // Only enable on non-touch desktop devices
    const mq = window.matchMedia("(pointer: fine)");
    if (!mq.matches) {
      setIsTouch(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (!target) {
        setCursorState("default");
        return;
      }

      if (
        target.tagName === "INPUT" &&
        ["text", "email", "password", "search", "url"].includes((target as HTMLInputElement).type) ||
        target.tagName === "TEXTAREA"
      ) {
        setCursorState("text");
      } else if (
        target.closest("[draggable='true']") ||
        target.closest(".cursor-grab") ||
        target.closest(".cursor-move")
      ) {
        setCursorState("grab");
      } else if (
        target.closest("button") ||
        target.closest("a") ||
        target.closest("[role='button']") ||
        target.closest(".cursor-pointer") ||
        target.closest("input[type='checkbox']") ||
        target.closest("input[type='time']")
      ) {
        setCursorState("pointer");
      } else {
        setCursorState("default");
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      setIsClicking(true);
      if (cursorState === "grab") {
        setCursorState("grabbing");
      }
      // Create click pulse ripple
      const id = ++rippleIdRef.current;
      setRipples((prev) => [...prev.slice(-3), { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 500);
    };

    const handleMouseUp = () => {
      setIsClicking(false);
      if (cursorState === "grabbing") {
        setCursorState("grab");
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [isVisible, cursorState]);

  // Smooth trailing spring lerp
  useEffect(() => {
    if (isTouch) return;
    let animId: number;

    const loop = () => {
      setTrailPos((prev) => ({
        x: prev.x + (pos.x - prev.x) * 0.22,
        y: prev.y + (pos.y - prev.y) * 0.22,
      }));
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [pos, isTouch]);

  if (isTouch || !isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none">
      {/* Click ripples */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="fixed pointer-events-none rounded-full border border-primary/50 animate-ping"
          style={{
            left: `${ripple.x - 16}px`,
            top: `${ripple.y - 16}px`,
            width: "32px",
            height: "32px",
            animationDuration: "400ms",
          }}
        />
      ))}

      {/* Trailing Outer Ring / Aura */}
      <div
        className={`fixed top-0 left-0 rounded-full pointer-events-none transition-all duration-150 ease-out flex items-center justify-center ${
          cursorState === "pointer"
            ? "w-11 h-11 border-2 border-[#1f1c2c] bg-[#928dab]/20 shadow-[0_0_15px_rgba(146,141,171,0.5)] backdrop-blur-[1px] scale-110"
            : cursorState === "text"
            ? "w-4 h-8 rounded-sm border border-[#1f1c2c]/80 bg-[#1f1c2c]/10"
            : cursorState === "grab" || cursorState === "grabbing"
            ? "w-10 h-10 border-2 border-dashed border-[#1f1c2c] bg-[#928dab]/15 scale-105"
            : "w-8 h-8 border border-[#1f1c2c]/60 bg-transparent shadow-[0_0_10px_rgba(31,28,44,0.15)]"
        } ${isClicking ? "scale-75 bg-[#1f1c2c]/30" : ""}`}
        style={{
          transform: `translate3d(${
            trailPos.x -
            (cursorState === "pointer" ? 22 : cursorState === "text" ? 8 : cursorState === "grab" || cursorState === "grabbing" ? 20 : 16)
          }px, ${
            trailPos.y -
            (cursorState === "pointer" ? 22 : cursorState === "text" ? 16 : cursorState === "grab" || cursorState === "grabbing" ? 20 : 16)
          }px, 0)`,
          transition: "width 0.15s, height 0.15s, transform 0.05s ease-out, border 0.15s, background-color 0.15s",
        }}
      >
        {(cursorState === "grab" || cursorState === "grabbing") && (
          <span className="text-[9px] font-black tracking-tighter text-[#1f1c2c] select-none">
            {cursorState === "grabbing" ? "●" : "⇄"}
          </span>
        )}
      </div>

      {/* Precision Core Dot (Zero Latency) */}
      <div
        className={`fixed top-0 left-0 rounded-full pointer-events-none transition-all duration-75 ${
          cursorState === "text"
            ? "w-0.5 h-4 bg-[#1f1c2c]"
            : "w-2 h-2 bg-[#1f1c2c] shadow-[0_0_6px_rgba(31,28,44,0.6)]"
        } ${isClicking ? "scale-150 bg-black" : "scale-100"}`}
        style={{
          transform: `translate3d(${pos.x - (cursorState === "text" ? 1 : 4)}px, ${
            pos.y - (cursorState === "text" ? 8 : 4)
          }px, 0)`,
        }}
      />
    </div>
  );
}
