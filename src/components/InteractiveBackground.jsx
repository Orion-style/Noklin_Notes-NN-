import React, { useEffect, useRef } from "react";

export default function InteractiveBackground({ isSleeping = false }) {
  const canvasRef = useRef(null);
  const isSleepingRef = useRef(isSleeping);

  useEffect(() => {
    isSleepingRef.current = isSleeping;
  }, [isSleeping]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];
    const normalCount = Math.min(180, Math.floor((width * height) / 8500));
    const connectionDistance = 120;
    const mouseConnectionDistance = 210;
    const mouse = { x: null, y: null, radius: 160 };
    let rippleRadius = 0;
    
    let sleepTransition = 0;
    let electronTime = 0;

    for (let i = 0; i < normalCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2.0 + 0.8,
        colorType: Math.random() > 0.5 ? "green" : "purple",
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      const oldWidth = width;
      const oldHeight = height;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      
      particles.forEach((p) => {
        p.x = (p.x / oldWidth) * width;
        p.y = (p.y / oldHeight) * height;
      });
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    const animate = () => {
      const sleeping = isSleepingRef.current;
      const centerX = width / 2;
      const centerY = height / 2;
      const isLight = document.documentElement.getAttribute("data-theme") === "light" || document.documentElement.classList.contains("light");

      const greenColor = isLight ? "rgba(0, 143, 90, " : "rgba(0, 255, 102, ";
      const purpleColor = isLight ? "rgba(112, 69, 184, " : "rgba(176, 38, 255, ";

      if (sleeping) {
        sleepTransition = Math.min(1, sleepTransition + 0.025);
      } else {
        sleepTransition = Math.max(0, sleepTransition - 0.025);
      }

      if (sleepTransition > 0.05) {
        const bgRgb = isLight ? "243, 245, 248" : "4, 1, 10";
        ctx.fillStyle = `rgba(${bgRgb}, ${0.08 + sleepTransition * 0.12})`;
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.clearRect(0, 0, width, height);
      }

      // 1. Cursor spotlight glow and expanding ripples
      if (sleepTransition < 0.95 && mouse.x !== null && mouse.y !== null) {
        const activeAlpha = (1 - sleepTransition) * (isLight ? 0.5 : 1.0);
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 200);
        grad.addColorStop(0, `${greenColor}${0.08 * activeAlpha})`);
        grad.addColorStop(0.5, `${purpleColor}${0.025 * activeAlpha})`);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 200, 0, Math.PI * 2);
        ctx.fill();

        rippleRadius += 0.75;
        if (rippleRadius > 200) rippleRadius = 0;
        
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, rippleRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `${greenColor}${(1 - rippleRadius / 200) * 0.08 * activeAlpha})`;
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      // 2. Constellation particles
      {
        const themeAlphaMult = isLight ? 0.35 : 0.75;
        const normalAlpha = (1.0 - (sleepTransition * 0.6)) * themeAlphaMult;
        const speedMultiplier = 1.0 - (sleepTransition * 0.7);

        particles.forEach((p) => {
          p.x += p.vx * speedMultiplier;
          p.y += p.vy * speedMultiplier;

          if (sleepTransition < 0.95 && mouse.x !== null && mouse.y !== null) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouse.radius) {
              const force = (mouse.radius - dist) / mouse.radius;
              p.x += (dx / dist) * force * 2.2;
              p.y += (dy / dist) * force * 2.2;
            }
          }

          if (p.x < p.radius) {
            p.x = p.radius;
            p.vx = Math.abs(p.vx);
          } else if (p.x > width - p.radius) {
            p.x = width - p.radius;
            p.vx = -Math.abs(p.vx);
          }
          if (p.y < p.radius) {
            p.y = p.radius;
            p.vy = Math.abs(p.vy);
          } else if (p.y > height - p.radius) {
            p.y = height - p.radius;
            p.vy = -Math.abs(p.vy);
          }

          const baseColor = p.colorType === "green" ? greenColor : purpleColor;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = baseColor + normalAlpha + ")";
          ctx.fill();

          if (p.radius > 1.8) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
            ctx.fillStyle = baseColor + (normalAlpha * 0.25) + ")";
            ctx.fill();
          }
        });

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];
          const p1Color = p1.colorType === "green" ? greenColor : purpleColor;

          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const p2Color = p2.colorType === "green" ? greenColor : purpleColor;
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < connectionDistance) {
              const alpha = (1 - dist / connectionDistance) * 0.25 * normalAlpha;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);

              const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
              grad.addColorStop(0, p1Color + alpha + ")");
              grad.addColorStop(1, p2Color + alpha + ")");

              ctx.strokeStyle = grad;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }

          if (sleepTransition < 0.95 && mouse.x !== null && mouse.y !== null) {
            const dx = p1.x - mouse.x;
            const dy = p1.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < mouseConnectionDistance) {
              const alpha = (1 - dist / mouseConnectionDistance) * 0.35 * normalAlpha;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.strokeStyle = p1Color + alpha + ")";
              ctx.lineWidth = 1.0;
              ctx.stroke();
            }
          }
        }
      }

      // 3. Sleep mode Bohr model
      if (sleepTransition > 0.01) {
        electronTime += 0.018;
        const nucleusTime = electronTime * 1.4;
        const globalRot = electronTime * 0.08;

        const nucleons = [
          { dx: -7, dy: -6, color: greenColor },
          { dx: 7, dy: -5, color: purpleColor },
          { dx: -5, dy: 7, color: purpleColor },
          { dx: 6, dy: 6, color: greenColor },
        ];

        const nucleusGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 42);
        nucleusGlow.addColorStop(0, `${purpleColor}${0.35 * sleepTransition})`);
        nucleusGlow.addColorStop(0.5, `${greenColor}${0.12 * sleepTransition})`);
        nucleusGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = nucleusGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 42, 0, Math.PI * 2);
        ctx.fill();

        nucleons.forEach((n, idx) => {
          const vibX = Math.sin(nucleusTime + idx * 2.3) * 1.2;
          const vibY = Math.cos(nucleusTime + idx * 1.7) * 1.2;
          const rx = n.dx * Math.cos(globalRot) - n.dy * Math.sin(globalRot);
          const ry = n.dx * Math.sin(globalRot) + n.dy * Math.cos(globalRot);
          const nx = centerX + rx + vibX;
          const ny = centerY + ry + vibY;
          
          ctx.beginPath();
          ctx.arc(nx, ny, 9, 0, Math.PI * 2);
          ctx.fillStyle = n.color + (sleepTransition * 0.85) + ")";
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(nx - 3, ny - 3, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${sleepTransition * 0.5})`;
          ctx.fill();
        });

        for (let j = 0; j < 4; j++) {
          const rot = j * (Math.PI / 4) + globalRot;
          const rx = 185 + j * 10;
          const ry = 52 + j * 4;
          const colorStr = (j % 2 === 0) ? greenColor : purpleColor;

          ctx.beginPath();
          ctx.ellipse(centerX, centerY, rx, ry, rot, 0, Math.PI * 2);
          ctx.strokeStyle = colorStr + (0.09 * sleepTransition) + ")";
          ctx.lineWidth = 1.2;
          ctx.stroke();

          for (let k = 0; k < 2; k++) {
            const direction = (j % 2 === 0) ? 1 : -1;
            const theta = direction * electronTime + k * Math.PI + (j * Math.PI / 4);
            
            const ox = rx * Math.cos(theta);
            const oy = ry * Math.sin(theta);
            const x = centerX + ox * Math.cos(rot) - oy * Math.sin(rot);
            const y = centerY + ox * Math.sin(rot) + oy * Math.cos(rot);

            ctx.beginPath();
            ctx.arc(x, y, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = colorStr + (sleepTransition * 0.9) + ")";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fillStyle = colorStr + (sleepTransition * 0.25) + ")";
            ctx.fill();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Floating Aurora Orbs */}
      <div className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[130px] animate-float-slow transition-all duration-1000 ${isSleeping ? "bg-cyber-purple/5 opacity-40" : "bg-cyber-green/10 dark:opacity-100 opacity-30"}`} />
      <div className={`absolute bottom-[-15%] right-[-10%] w-[55vw] h-[55vw] rounded-full blur-[140px] animate-float-medium transition-all duration-1000 ${isSleeping ? "bg-[#581c87]/15" : "bg-cyber-purple/10 dark:opacity-100 opacity-30"}`} />
      <div className={`absolute top-[35%] right-[25%] w-[40vw] h-[40vw] rounded-full blur-[120px] animate-float-fast transition-all duration-1000 ${isSleeping ? "bg-[#3b0764]/20" : "bg-cyber-purple/8 dark:opacity-100 opacity-20"}`} />
      <div className={`absolute bottom-[20%] left-[15%] w-[35vw] h-[35vw] rounded-full blur-[110px] animate-float-slow transition-all duration-1000 ${isSleeping ? "bg-[#6b21a8]/10" : "bg-cyber-green/8 dark:opacity-100 opacity-20"}`} style={{ animationDelay: "-3s" }} />

      {/* Grid Overlay */}
      {!isSleeping && (
        <div className="absolute inset-0 bg-[linear-gradient(var(--color-border-secondary)_1px,transparent_1px),linear-gradient(90deg,var(--color-border-secondary)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />
      )}
      
      {/* Particle Canvas */}
      <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${isSleeping ? "opacity-90" : "opacity-70"}`} />
    </div>
  );
}
