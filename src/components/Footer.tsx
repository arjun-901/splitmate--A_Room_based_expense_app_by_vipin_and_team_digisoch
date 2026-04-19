import { Fullscreen } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer style={{ background: "#0B0C0F", color: "#fff", fontFamily: "'DM Sans', sans-serif", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ maxWidth: Fullscreen, margin: "0 auto", padding: "3rem 1.5rem 2rem" }}>

        {/* Top row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2.5rem", justifyContent: "space-between", marginBottom: "2.5rem" }}>

          {/* Brand */}
          <div style={{ maxWidth: 300 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.9rem" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FF5C36", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1rem", color: "#fff" }}>S</div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}>SplitEase</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#6B7280", lineHeight: 1.75, margin: 0 }}>
              Room-based shared expense tracking. Clean balances, monthly reports, and instant settlements.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#4B5563", marginBottom: "0.9rem" }}>Navigation</p>
              {[["Home", "/"], ["Login", "/login"], ["Dashboard", "/dashboard"]].map(([label, to]) => (
                <Link key={to} to={to} style={{ display: "block", fontSize: "0.82rem", color: "#9CA3AF", textDecoration: "none", marginBottom: "0.55rem", transition: "color 0.2s" }}
                  onMouseOver={e => (e.currentTarget.style.color = "#fff")}
                  onMouseOut={e => (e.currentTarget.style.color = "#9CA3AF")}>
                  {label}
                </Link>
              ))}
            </div>
            <div>
              <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#4B5563", marginBottom: "0.9rem" }}>Features</p>
              {["Room Codes", "Live Balances", "Monthly Reports", "Settlements"].map((f) => (
                <p key={f} style={{ fontSize: "0.82rem", color: "#9CA3AF", marginBottom: "0.55rem" }}>{f}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "1.25rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
          <p style={{ fontSize: "0.72rem", color: "#4B5563", margin: 0 }}>
            © {new Date().getFullYear()} SplitEase — All rights reserved.
          </p>
          <p style={{ fontSize: "0.72rem", color: "#4B5563", margin: 0 }}>
            Built by <span style={{ color: "#FF5C36", fontWeight: 700 }}>Team DigiSoch And Vipin Mishra</span> · 2026 ·Final Year College Project
          </p>
        </div>
      </div>


    </footer>
  );
}