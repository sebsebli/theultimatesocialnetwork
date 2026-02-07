import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Citewalk — Where ideas connect and grow.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#0B0B0C",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Subtle grid overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.04,
          backgroundImage:
            "linear-gradient(to right, #6E7A8A 1px, transparent 1px), linear-gradient(to bottom, #6E7A8A 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(to right, #6E7A8A, transparent)",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Logo / brand */}
        <div
          style={{
            fontSize: "20px",
            fontWeight: 500,
            color: "#6E7A8A",
            letterSpacing: "4px",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          Citewalk
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 600,
            color: "#F2F2F2",
            lineHeight: 1.1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Where ideas</span>
          <span style={{ color: "#6E7A8A", fontStyle: "italic" }}>
            connect and grow.
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "24px",
            color: "#A8A8AA",
            maxWidth: "700px",
            lineHeight: 1.5,
            display: "flex",
          }}
        >
          Post about what you know, follow topics you care about, and explore
          how ideas build on each other — transparently, without algorithms.
        </div>
      </div>

      {/* Bottom info */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          left: "80px",
          right: "80px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            color: "#6E6E73",
            display: "flex",
            gap: "24px",
          }}
        >
          <span>No algorithm</span>
          <span style={{ color: "#333" }}>·</span>
          <span>No ads</span>
          <span style={{ color: "#333" }}>·</span>
          <span>No tracking</span>
        </div>
        <div style={{ fontSize: "16px", color: "#6E7A8A", display: "flex" }}>
          citewalk.com
        </div>
      </div>
    </div>,
    { ...size },
  );
}
