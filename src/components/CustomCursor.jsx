import React, { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// Bubbles animation component inside hovered buttons
function HoverBubbles({ width, height }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    canvas.width = width;
    canvas.height = height;

    const bubbles = [];
    const count = Math.min(30, Math.floor(width / 8));

    // Initialize bubbles at random heights initially
    for (let i = 0; i < count; i++) {
      bubbles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 3 + 1.2, // small bubbles (1.2px to 4.2px)
        speedY: -(Math.random() * 0.2 + 0.08), // slowed down from -(Math.random() * 0.7 + 0.3)
        wobbleSpeed: Math.random() * 0.02 + 0.01, // slower wobble to match speed
        wobbleRange: Math.random() * 0.8 + 0.2,
        wobbleAngle: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.6 + 0.3,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      bubbles.forEach((b) => {
        b.y += b.speedY;
        b.wobbleAngle += b.wobbleSpeed;
        b.x += Math.sin(b.wobbleAngle) * b.wobbleRange * 0.35;

        // Reset bubble to bottom when it goes off top
        if (b.y < -b.radius) {
          b.y = height + b.radius;
          b.x = Math.random() * width;
          b.opacity = Math.random() * 0.6 + 0.3;
        }

        // Draw bubble hollow circle outline
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(176, 38, 255, ${b.opacity})`;
        ctx.lineWidth = 0.85;
        ctx.stroke();

        // Soft inner glow
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(176, 38, 255, ${b.opacity * 0.12})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [width, height]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

export default function CustomCursor({ isSleeping = false }) {
  const [magneticTarget, setMagneticTarget] = useState(null);
  const [isHoveringText, setIsHoveringText] = useState(false);
  const timeoutRef = useRef(null);
  const magneticTargetRef = useRef(null);

  // Mouse coordinates (target positions)
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Spring settings for smooth lag / stretch effect
  const positionSpringConfig = { stiffness: 220, damping: 22, mass: 0.5 };
  const sizeSpringConfig = { stiffness: 220, damping: 24, mass: 0.5 };
  const scaleSpringConfig = { stiffness: 150, damping: 13, mass: 0.7 }; // wobbly, low damping for jelly bounce!
  const rotateSpringConfig = { stiffness: 120, damping: 14 };
  
  // Springs for the outer cursor position
  const cursorX = useSpring(mouseX, positionSpringConfig);
  const cursorY = useSpring(mouseY, positionSpringConfig);

  // Springs for the outer cursor dimensions (for morphing)
  const cursorWidth = useSpring(40, sizeSpringConfig);
  const cursorHeight = useSpring(40, sizeSpringConfig);
  const cursorBorderRadius = useSpring(9999, sizeSpringConfig);

  // Springs for slime scaling and rotation
  const cursorScaleX = useSpring(1, scaleSpringConfig);
  const cursorScaleY = useSpring(1, scaleSpringConfig);
  const cursorRotate = useSpring(0, rotateSpringConfig);

  // Inner dot coordinates (follows instantly)
  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);

  useEffect(() => {
    let mouse = { x: -100, y: -100 };
    let lastMouse = { x: -100, y: -100 };
    let velocity = { x: 0, y: 0 };
    let rafId;

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const updatePhysics = () => {
      if (mouse.x === -100) {
        rafId = requestAnimationFrame(updatePhysics);
        return;
      }

      // Prevent initial jump velocity spike
      if (lastMouse.x === -100) {
        lastMouse.x = mouse.x;
        lastMouse.y = mouse.y;
        rafId = requestAnimationFrame(updatePhysics);
        return;
      }

      // Check if current snapped element is still in DOM and visible
      const snapped = magneticTargetRef.current;
      if (snapped && snapped.element) {
        const isConnected = document.body.contains(snapped.element);
        const rect = isConnected ? snapped.element.getBoundingClientRect() : null;
        let isVisible = false;
        if (isConnected && rect) {
          const style = window.getComputedStyle(snapped.element);
          const hasClass = snapped.element.classList.contains('magnetic-target') || snapped.element.closest('.magnetic-target');
          const isDisabled = snapped.element.disabled || snapped.element.hasAttribute('disabled');
          
          isVisible = rect.width > 0 && rect.height > 0 &&
                      style.display !== 'none' &&
                      style.visibility !== 'hidden' &&
                      style.opacity !== '0' &&
                      style.pointerEvents !== 'none' &&
                      hasClass &&
                      !isDisabled;
        }

        if (!isConnected || !isVisible) {
          magneticTargetRef.current = null;
          setMagneticTarget(null);
          
          // Smoothly snap springs back to cursor size/position
          mouseX.set(mouse.x - 20);
          mouseY.set(mouse.y - 20);
          cursorWidth.set(40);
          cursorHeight.set(40);
          cursorBorderRadius.set(9999);
          cursorScaleX.set(1);
          cursorScaleY.set(1);
          cursorRotate.set(0);
          
          lastMouse.x = mouse.x;
          lastMouse.y = mouse.y;
          velocity.x = 0;
          velocity.y = 0;

          rafId = requestAnimationFrame(updatePhysics);
          return;
        }
      } else if (snapped) {
        magneticTargetRef.current = null;
        setMagneticTarget(null);
      }

      // Calculate position delta
      const dx = mouse.x - lastMouse.x;
      const dy = mouse.y - lastMouse.y;

      // Smooth instantaneous velocity
      velocity.x += (dx - velocity.x) * 0.15;
      velocity.y += (dy - velocity.y) * 0.15;

      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

      const target = magneticTargetRef.current;
      if (!target) {
        // Normal cursor follows mouse (centered on cursor)
        mouseX.set(mouse.x - 20); // 40px width -> offset by 20
        mouseY.set(mouse.y - 20); // 40px height -> offset by 20
        
        cursorWidth.set(40);
        cursorHeight.set(40);
        cursorBorderRadius.set(9999);

        // Apply slime deformation based on speed
        const stretch = Math.min(speed * 0.08, 0.6); // max 60% stretch
        cursorScaleX.set(1 + stretch);
        cursorScaleY.set(1 - stretch * 0.5);

        // Only rotate when there is movement to avoid orientation resetting to 0
        if (speed > 0.15) {
          const angle = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI);
          const currentRot = cursorRotate.get();
          const diff = ((angle - currentRot + 180) % 360) - 180;
          cursorRotate.set(currentRot + diff);
        }
      } else {
        // Magnetic lock: reset scale and rotation to default
        cursorScaleX.set(1);
        cursorScaleY.set(1);
        cursorRotate.set(0);

        // Snap to target boundaries with padding
        const rect = target.rect;
        const padding = 6;
        const targetX = rect.left - padding;
        const targetY = rect.top - padding;
        const targetW = rect.width + padding * 2;
        const targetH = rect.height + padding * 2;

        const styles = window.getComputedStyle(target.element);
        const borderRadiusStr = styles.borderRadius;
        const borderRadiusNum = parseFloat(borderRadiusStr) || 8;
        const targetR = borderRadiusNum + padding;

        if (target.isDirectSwitch) {
          // Jump instantly to prevent sliding and stretching between adjacent buttons
          cursorX.jump(targetX);
          cursorY.jump(targetY);
          cursorWidth.jump(targetW);
          cursorHeight.jump(targetH);
          cursorBorderRadius.jump(targetR);
          
          // Sync underlying motion values
          mouseX.set(targetX);
          mouseY.set(targetY);
        } else {
          mouseX.set(targetX);
          mouseY.set(targetY);
          cursorWidth.set(targetW);
          cursorHeight.set(targetH);
          cursorBorderRadius.set(targetR);
        }
      }

      // Inner dot is always centered on mouse (8px size -> offset by 4)
      dotX.set(mouse.x - 4);
      dotY.set(mouse.y - 4);

      // Save last coordinates
      lastMouse.x = mouse.x;
      lastMouse.y = mouse.y;

      // Slowly decay velocity when stationary
      velocity.x *= 0.85;
      velocity.y *= 0.85;

      rafId = requestAnimationFrame(updatePhysics);
    };

    const handleMouseOver = (e) => {
      const isText = e.target.tagName === 'TEXTAREA' || (e.target.tagName === 'INPUT' && ['text', 'email', 'password', 'search', 'tel', 'url'].includes(e.target.type));
      setIsHoveringText(isText);

      const target = e.target.closest('.magnetic-target');
      if (target) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        const rect = target.getBoundingClientRect();
        setMagneticTarget(prev => {
          const isDirectSwitch = prev !== null && prev.element !== target;
          const next = {
            element: target,
            rect: rect,
            isDirectSwitch: isDirectSwitch
          };
          magneticTargetRef.current = next;
          return next;
        });
      }
    };

    const handleMouseOut = (e) => {
      const isText = e.target.tagName === 'TEXTAREA' || (e.target.tagName === 'INPUT' && ['text', 'email', 'password', 'search', 'tel', 'url'].includes(e.target.type));
      if (isText) {
        setIsHoveringText(false);
      }

      const target = e.target.closest('.magnetic-target');
      if (target) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        // Debounce mouseout to prevent flickering when transitioning between adjacent elements
        timeoutRef.current = setTimeout(() => {
          setMagneticTarget(null);
          magneticTargetRef.current = null;
        }, 55);
      }
    };

    const handleScroll = () => {
      const snapped = magneticTargetRef.current;
      if (snapped && snapped.element) {
        const rect = snapped.element.getBoundingClientRect();
        setMagneticTarget(prev => {
          if (!prev || !prev.element) return null;
          const next = { ...prev, rect };
          magneticTargetRef.current = next;
          return next;
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    // Start physics loop
    rafId = requestAnimationFrame(updatePhysics);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
      cancelAnimationFrame(rafId);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [mouseX, mouseY, cursorWidth, cursorHeight, cursorBorderRadius, cursorScaleX, cursorScaleY, cursorRotate, dotX, dotY]);

  return (
    <>
      {/* Outer Slime Outline / Magnetic Snapped Frame */}
      <motion.div
        className={`fixed pointer-events-none z-[1000000] border transition-colors duration-300 overflow-hidden ${
          magneticTarget 
            ? "border-cyber-purple bg-cyber-purple/10 shadow-[0_0_15px_rgba(176,38,255,0.65)]" 
            : isSleeping
              ? "border-cyber-purple shadow-[0_0_12px_rgba(176,38,255,0.6)] bg-transparent animate-cursor-wave"
              : "border-cyber-green shadow-[0_0_12px_rgba(0,255,102,0.5)] bg-transparent animate-cursor-wave"
        }`}
        style={{
          x: cursorX,
          y: cursorY,
          width: cursorWidth,
          height: cursorHeight,
          // Only apply inline borderRadius when snapped to keep wobbly border-radius css animation working normally
          borderRadius: magneticTarget ? cursorBorderRadius : "",
          scaleX: isHoveringText ? 0 : (magneticTarget ? 1 : cursorScaleX),
          scaleY: isHoveringText ? 0 : (magneticTarget ? 1 : cursorScaleY),
          rotate: magneticTarget ? 0 : cursorRotate,
          transformOrigin: "center center",
        }}
      >
        {magneticTarget && (
          <HoverBubbles width={magneticTarget.rect.width} height={magneticTarget.rect.height} />
        )}
      </motion.div>

      {/* Inner User Dot / I-Beam (Cursor pointer) */}
      <motion.div
        className={`fixed w-2 h-2 pointer-events-none z-[1000001] transition-colors duration-300 flex items-center justify-center overflow-visible ${
          isHoveringText
            ? "bg-transparent shadow-none"
            : `rounded-full ${
                magneticTarget 
                  ? "bg-cyber-purple shadow-[0_0_8px_#b026ff]" 
                  : isSleeping
                    ? "bg-cyber-purple shadow-[0_0_8px_#b026ff]"
                    : "bg-cyber-green shadow-[0_0_8px_#00ff66]"
              }`
        }`}
        style={{
          x: dotX,
          y: dotY,
        }}
      >
        {isHoveringText && (
          <svg
            width="10"
            height="16"
            viewBox="0 0 10 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${
              isSleeping
                ? "text-cyber-purple drop-shadow-[0_0_6px_rgba(176,38,255,0.85)]"
                : "text-cyber-green drop-shadow-[0_0_6px_rgba(0,255,102,0.85)]"
            }`}
          >
            <path
              d="M1 1H9M5 1V15M1 15H9"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </motion.div>
    </>
  );
}
