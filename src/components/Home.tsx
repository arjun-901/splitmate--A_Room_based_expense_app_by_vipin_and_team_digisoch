import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import type { AppUser } from "../lib/types";
import { m } from "motion/react";

interface Props {
  user: AppUser | null;
  currentRoom: string | null;
}

const features = [
  {
    color: "#FFF0EC",
    iconColor: "#C93D1C",
    title: "Instant Room Access",
    body: "Share a room code and let people join in seconds. No invites, no approval flow, no extra steps.",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#C93D1C" strokeWidth="2" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" stroke="#C93D1C" strokeWidth="2" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#C93D1C" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    color: "#EEEDFE",
    iconColor: "#4338CA",
    title: "Live Balance Engine",
    body: "Every new expense updates balances instantly, so everyone can see who owes what without doing the math.",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#4338CA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    color: "#ECFDF5",
    iconColor: "#059669",
    title: "Monthly Tracking",
    body: "Review expenses month by month to track total spend, settlements, and each member's contribution clearly.",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="#059669" strokeWidth="2" />
        <path d="M16 2v4M8 2v4M3 10h18" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    color: "#FFFBEB",
    iconColor: "#D97706",
    title: "Safe Editing Rules",
    body: "Everyone can add expenses, but only the person who created one can edit or remove it.",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="11" width="18" height="11" rx="2" stroke="#D97706" strokeWidth="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

const activity = [
  { initials: "AK", bg: "#FFF0EC", color: "#C93D1C", name: "Arjun", desc: "paid for hotel booking", amount: "₹6,000", amtColor: "#1A1A1A" },
  { initials: "TV", bg: "#EEEDFE", color: "#4338CA", name: "Tanvi", desc: "settled cab share", amount: "₹850", amtColor: "#059669" },
  { initials: "PR", bg: "#ECFDF5", color: "#059669", name: "Priya", desc: "added groceries", amount: "₹1,400", amtColor: "#1A1A1A" },
];

const tickerItems = [
  ["Arjun", "paid", "₹3,200", "for dinner"],
  ["Tanvi", "settled", "₹850", "cab share"],
  ["Room", "TRIP24", "—", "May report ready"],
  ["Rahul", "joined", "FLAT22", ""],
  ["Priya", "added", "₹1,400", "groceries"],
  ["Settlement", "cleared", "—", "₹620"],
];

export default function Home({ user, currentRoom }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const primaryLink = user ? (currentRoom ? `/dashboard/${currentRoom}` : "/dashboard") : "/login";
  const displayFont = "var(--font-sans)";

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dynamically import three.js (assumes it's installed)
    import("three").then((THREE) => {
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 50);
      camera.position.z = 5;

      const hero = canvas.parentElement!;
      const resize = () => {
        const w = hero.clientWidth, h = hero.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();

      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const pl1 = new THREE.PointLight(0xff5c36, 4, 15); pl1.position.set(3, 2, 2); scene.add(pl1);
      const pl2 = new THREE.PointLight(0x4f46e5, 3, 15); pl2.position.set(-3, -1, 2); scene.add(pl2);
      const pl3 = new THREE.PointLight(0x10b981, 2, 12); pl3.position.set(0, -3, 1); scene.add(pl3);

      const meshes: THREE.Mesh[] = [];
      const gdata: [THREE.BufferGeometry, number, [number, number, number], number, boolean][] = [
        [new THREE.IcosahedronGeometry(0.6, 1), 0xff5c36, [2, 0.8, -1.5], 0.85, false],
        [new THREE.OctahedronGeometry(0.42, 0), 0x4f46e5, [-1.8, 0.4, -1.8], 0.8, false],
        [new THREE.IcosahedronGeometry(0.3, 0), 0x10b981, [1.4, -1.4, -0.8], 0.75, false],
        [new THREE.OctahedronGeometry(0.22, 0), 0xf59e0b, [-1.1, -1.1, -0.5], 0.7, false],
        [new THREE.IcosahedronGeometry(0.18, 0), 0xff5c36, [2.6, -0.4, -2], 0.65, true],
        [new THREE.OctahedronGeometry(0.16, 0), 0x4f46e5, [-2.2, 1.4, -2], 0.7, true],
      ];

      gdata.forEach(([geo, color, pos, opacity, wireframe]) => {
        const mat = new THREE.MeshPhongMaterial({ color, shininess: 140, transparent: true, opacity, wireframe });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(...pos);
        (mesh as any)._data = {
          rx: (Math.random() - 0.5) * 0.014,
          ry: (Math.random() - 0.5) * 0.018,
          fs: 0.35 + Math.random() * 0.5,
          fo: Math.random() * Math.PI * 2,
          by: pos[1],
        };
        scene.add(mesh);
        meshes.push(mesh);
      });

      let mx = 0, my = 0, t = 0;
      const onMouseMove = (e: MouseEvent) => {
        mx = (e.clientX / innerWidth - 0.5) * 2;
        my = (e.clientY / innerHeight - 0.5) * 2;
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("resize", resize);

      const loop = () => {
        animId = requestAnimationFrame(loop);
        t += 0.016;
        meshes.forEach((m) => {
          const d = (m as any)._data;
          m.rotation.x += d.rx;
          m.rotation.y += d.ry;
          m.position.y = d.by + Math.sin(t * d.fs + d.fo) * 0.18;
        });
        camera.position.x += (mx * 0.35 - camera.position.x) * 0.05;
        camera.position.y += (-my * 0.25 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);
        pl1.position.x = Math.sin(t * 0.4) * 3;
        pl1.position.y = Math.cos(t * 0.3) * 2;
        renderer.render(scene, camera);
      };
      loop();

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("resize", resize);
        renderer.dispose();
      };
    });

    return () => cancelAnimationFrame(animId);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); }),
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ background: "#cfd3cd", color: "#1A1A1A", fontFamily: displayFont, overflowX: "hidden" }}>

      {/* ── HERO ── */}
      <section style={{ padding: "5rem 1.5rem 3rem", textAlign: "center", position: "relative", overflow: "hidden", background: "#f5f8f7", minHeight: "92vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }} />

        {/* decorative rings */}
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", border: "1px solid rgba(255,92,54,0.08)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none", animation: "spin 30s linear infinite" }} />
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", border: "1px solid rgba(79,70,229,0.07)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none", animation: "spin 20s linear infinite reverse" }} />

        {/* badge */}
<div style={{
  position: "relative",
  zIndex: 1,
  display: "inline-flex",
  alignItems: "center",
  gap: "0.45rem",
  background: "linear-gradient(135deg, #eef2ff, #f5f3ff)",
  border: "1px solid rgba(99,102,241,0.2)",
  borderRadius: 999,
  padding: "0.25rem 0.7rem",
  fontSize: "0.7rem",
  fontWeight: 700,
  color: "#4f46e5",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: "1.6rem"
}}>
  <span style={{
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #a855f7)",
    display: "inline-block"
  }} />
  expense splitting
</div>

<h1 style={{
  position: "relative",
  zIndex: 1,
  fontFamily: displayFont,
  fontSize: "clamp(2.3rem, 7vw, 4.2rem)",
  fontWeight: 800,
  lineHeight: 1.05,
  letterSpacing: "-0.04em",
  marginBottom: "1.2rem",
  color: "#0f172a"
}}>
  Stop guessing
  <br />
  <span style={{
    background: "linear-gradient(135deg, #6366f1, #a855f7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  }}>
    Split expenses the right way
  </span>
</h1>

<p style={{
  position: "relative",
  zIndex: 1,
  fontSize: "1rem",
  color: "#475569",
  maxWidth: 440,
  margin: "0 auto 2.2rem",
  lineHeight: 1.7
}}>
  Create a room, add shared expenses, and keep balances updated live for trips, flatmates, events, or any group plan.
</p>

        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to={primaryLink} style={{ background: "#FF5C36", color: "#fff", borderRadius: 12, padding: "0.8rem 1.8rem", fontSize: "0.92rem", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.4rem", transition: "background 0.2s" }}
            onMouseOver={e => (e.currentTarget.style.background = "#C93D1C")}
            onMouseOut={e => (e.currentTarget.style.background = "#FF5C36")}>
            {user ? "Open Dashboard" : "Create a Room"} →
          </Link>
          {!user && (
            <Link to="/login?register=true" style={{ background: "#fff", color: "#1A1A1A", border: "1px solid #D1D5DB", borderRadius: 12, padding: "0.8rem 1.8rem", fontSize: "0.92rem", fontWeight: 600, textDecoration: "none", transition: "border-color 0.2s" }}>
              Sign Up First
            </Link>
          )}
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", border: "1px solid #c2c2c4", borderRadius: 16, overflow: "hidden", margin: "0 1.5rem" ,marginTop: "1.5rem", background: "#fff" }}>
        {[["₹2.4Cr", "Tracked monthly"], ["40K+", "Active rooms"], ["Live", "Balance sync"]].map(([n, l], i) => (
          <div key={i} style={{ padding: "1.2rem 0.75rem", textAlign: "center", background: "#fff", borderLeft: i > 0 ? "1px solid #E5E7EB" : "none" }}>
            <div style={{ fontFamily: displayFont, fontSize: "1.4rem", fontWeight: 800, color: "#FF5C36", letterSpacing: "-0.04em" }}>{n}</div>
            <div style={{ fontSize: "0.68rem", color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: "0.15rem" }}>{l}</div>
          </div>
        ))}
      </div>

      {/* ── TICKER ── */}
      <div style={{ overflow: "hidden", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB", background: "#F8F7F4", padding: "0.45rem 0", marginTop: "1.5rem" }}>
        <div style={{ display: "flex", width: "max-content", animation: "ticker 22s linear infinite" }}>
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} style={{ padding: "0 2rem", fontSize: "0.72rem", color: "#6B7280", fontWeight: 500, whiteSpace: "nowrap" }}>
              {item[0]} <strong style={{ color: "#FF5C36", fontWeight: 700 }}>{item[1]}</strong> {item[2]} {item[3]}
            </span>
          ))}
        </div>
      </div>

      {/* ── DASHBOARD PREVIEW ── */}
      <div className="reveal" style={{ margin: "1.5rem 1.5rem 0", border: "1px solid #E5E7EB", borderRadius: 20, overflow: "hidden", background: "#fff" }}>
        <div style={{ background: "#F8F7F4", padding: "0.9rem 1.1rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #E5E7EB" }}>
          <div>
            <div style={{ fontSize: "0.6rem", color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.15rem" }}>Live Room</div>
            <div style={{ fontFamily: displayFont, fontSize: "0.95rem", fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.03em" }}>TRIP24 - Goa</div>
          </div>
          <div style={{ background: "#ECFDF5", color: "#059669", border: "1px solid rgba(5,150,105,0.2)", borderRadius: 100, padding: "0.18rem 0.65rem", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>● Synced</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderBottom: "1px solid #E5E7EB" }}>
          {[["₹18,240", "#1A1A1A", "Total"], ["+₹2,480", "#059669", "You get"], ["3", "#D97706", "Pending"]].map(([v, c, l], i) => (
            <div key={i} style={{ padding: "0.85rem 0.6rem", textAlign: "center", borderLeft: i > 0 ? "1px solid #E5E7EB" : "none" }}>
              <div style={{ fontFamily: displayFont, fontSize: "1rem", fontWeight: 800, color: c as string, letterSpacing: "-0.03em" }}>{v}</div>
              <div style={{ fontSize: "0.6rem", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, marginTop: "0.15rem" }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "0.5rem 0.9rem 0.6rem" }}>
          {activity.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.45rem 0", borderBottom: i < activity.length - 1 ? "1px solid #E5E7EB" : "none" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: a.bg, color: a.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0 }}>{a.initials}</div>
              <div style={{ fontSize: "0.78rem", flex: 1, color: "#6B7280" }}><strong style={{ color: "#1A1A1A", fontWeight: 600 }}>{a.name}</strong> {a.desc}</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 800, fontFamily: displayFont, color: a.amtColor, letterSpacing: "-0.03em" }}>{a.amount}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="reveal" style={{ padding: "3.5rem 1.5rem", maxWidth: 860, margin: "0 auto" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#FF5C36", marginBottom: "0.6rem" }}>Features</div>
        <h2 style={{ fontFamily: displayFont, fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, color: "#1A1A1A", marginBottom: "2rem" }}>Everything you need,<br />nothing extra to manage.</h2>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {features.map((f) => (
            <div key={f.title} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 18, padding: "1.3rem", transition: "border-color 0.2s, transform 0.2s", cursor: "default" }}
              onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(255,92,54,0.35)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: f.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.9rem" }}>{f.icon}</div>
              <div style={{ fontFamily: displayFont, fontSize: "0.95rem", fontWeight: 800, color: "#1A1A1A", marginBottom: "0.35rem", letterSpacing: "-0.02em" }}>{f.title}</div>
              <div style={{ fontSize: "0.8rem", color: "#6B7280", lineHeight: 1.65 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="reveal" style={{ padding: "0 1.5rem 3.5rem", maxWidth: 860, margin: "0 auto" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#FF5C36", marginBottom: "0.6rem" }}>How it works</div>
        <h2 style={{ fontFamily: displayFont, fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, color: "#1A1A1A", marginBottom: "1.5rem" }}>Start tracking together<br />in 3 simple steps.</h2>
        <div style={{ display: "grid", gap: "0.65rem" }}>
          {[
            ["Create or join a room", "Set up your group in seconds or enter a room code that someone already shared."],
            ["Add expenses anytime", "Capture who paid, what it was for, and who is splitting it. Balances refresh instantly."],
            ["Settle and stay clear", "Track payments, close pending dues, and review monthly summaries whenever you need them."],
          ].map(([title, body], i) => (
            <div key={i} style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: "1.1rem" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FF5C36", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: displayFont, fontSize: "0.78rem", fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ fontFamily: displayFont, fontSize: "0.88rem", fontWeight: 800, color: "#1A1A1A", marginBottom: "0.2rem", letterSpacing: "-0.02em" }}>{title}</div>
                <div style={{ fontSize: "0.77rem", color: "#6B7280" }}>{body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="reveal" style={{ margin: "0 1.5rem 4rem", background: "#F8F7F4", border: "1px solid #E5E7EB", borderRadius: 22, padding: "2.5rem 1.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,92,54,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -50, left: -50, width: 160, height: 160, borderRadius: "50%", background: "rgba(79,70,229,0.05)", pointerEvents: "none" }} />
        <h2 style={{ fontFamily: displayFont, fontSize: "clamp(1.4rem, 4vw, 1.9rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#1A1A1A", marginBottom: "0.75rem", position: "relative" }}>Ready to manage group expenses better?</h2>
        <p style={{ fontSize: "0.85rem", color: "#6B7280", marginBottom: "1.75rem", maxWidth: 340, marginLeft: "auto", marginRight: "auto", position: "relative" }}>
          Keep every payment visible, reduce confusion, and make settling up feel simple.
        </p>
        <Link to={primaryLink} style={{ background: "#FF5C36", color: "#fff", borderRadius: 12, padding: "0.9rem 2.2rem", fontSize: "0.95rem", fontWeight: 700, textDecoration: "none", display: "inline-block", position: "relative", transition: "background 0.2s" }}
          onMouseOver={e => (e.currentTarget.style.background = "#C93D1C")}
          onMouseOut={e => (e.currentTarget.style.background = "#FF5C36")}>
          Create Your First Room →
        </Link>
      </div>

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        @keyframes spin { to { transform: translate(-50%,-50%) rotate(360deg); } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.65s ease, transform 0.65s ease; }
        .reveal.in { opacity: 1; transform: translateY(0); }
      `}</style>
    </div>
  );
}
