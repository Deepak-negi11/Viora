import { ImageResponse } from "next/og";

export const alt = "Viora spatial workspace for remote teams";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#10233b",
          color: "#f8fbff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: "linear-gradient(135deg, #10233b 0%, #173c5d 55%, #3678f5 130%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 480,
            height: 480,
            right: -80,
            top: -100,
            display: "flex",
            borderRadius: 240,
            border: "2px solid rgba(165, 243, 239, .22)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 320,
            height: 320,
            right: 0,
            bottom: -120,
            display: "flex",
            borderRadius: 160,
            background: "rgba(110, 231, 224, .12)",
          }}
        />
        <div
          style={{
            position: "relative",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "68px 76px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 58,
                height: 58,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 16,
                background: "linear-gradient(145deg, #6ee7e0, #5965e8)",
                color: "#10233b",
                fontSize: 32,
                fontWeight: 900,
              }}
            >
              V
            </div>
            <div style={{ display: "flex", fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>Viora</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", maxWidth: 850 }}>
            <div style={{ display: "flex", color: "#a5f3ef", fontSize: 24, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
              Spatial workspace for remote teams
            </div>
            <div style={{ display: "flex", marginTop: 22, fontSize: 72, lineHeight: 1.03, fontWeight: 800, letterSpacing: -3 }}>
              Work together like you’re in the same room.
            </div>
            <div style={{ display: "flex", marginTop: 28, color: "#d7f4ff", fontSize: 28, lineHeight: 1.4 }}>
              Move together. Talk naturally. Keep the room.
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
