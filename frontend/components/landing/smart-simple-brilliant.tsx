import type React from "react"
import { useTranslations } from "@/lib/i18n"

interface SmartSimpleBrilliantProps {
  /** Fixed width from Figma: 482px */
  width?: number | string
  /** Fixed height from Figma: 300px */
  height?: number | string
  /** Optional className to pass to root */
  className?: string
  /** Theme palette */
  theme?: "light" | "dark"
}

/**
 * Smart · Simple · Brilliant – Calendar cards
 * Generated from Figma via MCP with exact measurements (482×300px)
 * Single-file component following the v0-ready pattern used in this repo.
 */
const SmartSimpleBrilliant: React.FC<SmartSimpleBrilliantProps> = ({
  width = 482,
  height = 300,
  className = "",
  theme = "dark",
}) => {
  const { t } = useTranslations()
  // Design tokens (derived from Figma local variables)
  const themeVars =
    theme === "light"
      ? {
          "--ssb-surface": "#ffffff",
          "--ssb-text": "#000000",
          "--ssb-border": "rgba(0,0,0,0.08)",
          "--ssb-inner-border": "rgba(0,0,0,0.12)",
          "--ssb-shadow": "rgba(0,0,0,0.12)",
        }
      : ({
          "--ssb-surface": "#1f2937",
          "--ssb-text": "#f8f8f8",
          "--ssb-border": "rgba(255,255,255,0.16)",
          "--ssb-inner-border": "rgba(255,255,255,0.12)",
          "--ssb-shadow": "rgba(0,0,0,0.28)",
        } as React.CSSProperties)

  // Figma-exported SVG assets used for small icons
  const img = "http://localhost:3845/assets/1b1e60b441119fb176db990a3c7fe2670a764855.svg"
  const img1 = "http://localhost:3845/assets/a502f04ccfc3811f304b58a3a982a5b6fa070e91.svg"
  const img2 = "http://localhost:3845/assets/9c07375bf3b9f1f1d8a0a24447829eb6f54fa928.svg"
  const img3 = "http://localhost:3845/assets/19500d66798ef5ea9dc9d5f971cd0e9c29674bd3.svg"

  return (
    <div
      className={className}
      style={
        {
          width,
          height,
          position: "relative",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...themeVars,
        } as React.CSSProperties
      }
      role="img"
      aria-label={t.smartSimpleTitle}
    >
      <div
        style={{
          position: "relative",
          width: "295.297px",
          height: "212.272px",
          transform: "scale(1.2)", // Added 1.2x scale transform
        }}
      >
        {/* Left tilted card group */}
        <div style={{ position: "absolute", left: "123.248px", top: "0px", width: 0, height: 0 }}>
          <div style={{ transform: "rotate(5deg)", transformOrigin: "center" }}>
            <div
              style={{
                width: "155.25px",
                background: "#ffffff",
                borderRadius: "9px",
                padding: "6px",
                boxShadow: "0px 0px 0px 1px rgba(0,0,0,0.08), 0px 2px 4px rgba(0,0,0,0.07)",
              }}
            >
              {/* Amber event -> Emerald */}
              <div
                style={{
                  width: "100%",
                  height: "51px",
                  borderRadius: "4px",
                  overflow: "hidden",
                  background: "rgba(16,185,129,0.1)",
                  display: "flex",
                }}
              >
                <div style={{ width: "2.25px", background: "#10B981" }} />
                <div style={{ padding: "4.5px", width: "100%" }}>
                  <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#064E3B" }}
                    >
                      2:00
                    </span>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#064E3B" }}
                    >
                      PM
                    </span>
                    <div style={{ background: "#064E3B", padding: "1.5px", borderRadius: "100px" }}>
                      <div style={{ width: "8px", height: "8px", overflow: "hidden", position: "relative" }}>
                        <img
                          src={img || "/placeholder.svg"}
                          alt="video"
                          style={{ position: "absolute", inset: "20% 10% 20% 10%" }}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "9px", color: "#064E3B" }}>
                    {t.smartSimpleEvent}
                  </div>
                </div>
              </div>

              {/* Sky event -> Emerald */}
              <div
                style={{
                  width: "100%",
                  height: "79.5px",
                  borderRadius: "4px",
                  overflow: "hidden",
                  background: "rgba(16,185,129,0.1)",
                  marginTop: "3px",
                  display: "flex",
                }}
              >
                <div style={{ width: "2.25px", background: "#10B981" }} />
                <div style={{ padding: "4.5px", width: "100%" }}>
                  <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#064E3B" }}
                    >
                      2:00
                    </span>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#064E3B" }}
                    >
                      PM
                    </span>
                    <div style={{ background: "#064E3B", padding: "1.5px", borderRadius: "100px" }}>
                      <div style={{ width: "8px", height: "8px", overflow: "hidden", position: "relative" }}>
                        <img
                          src={img1 || "/placeholder.svg"}
                          alt="video"
                          style={{ position: "absolute", inset: "20% 10% 20% 10%" }}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "9px", color: "#064E3B" }}>
                    {t.smartSimpleEvent}
                  </div>
                </div>
              </div>

              {/* Emerald event */}
              <div
                style={{
                  width: "100%",
                  height: "51px",
                  borderRadius: "4px",
                  overflow: "hidden",
                  background: "rgba(16,185,129,0.1)",
                  marginTop: "3px",
                  display: "flex",
                }}
              >
                <div style={{ width: "2.25px", background: "#10B981" }} />
                <div style={{ padding: "4.5px", width: "100%" }}>
                  <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#064E3B" }}
                    >
                      9:00
                    </span>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#064E3B" }}
                    >
                      AM
                    </span>
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "9px", color: "#064E3B" }}>
                    {t.smartSimpleEvent}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right card */}
        <div style={{ position: "absolute", left: "0px", top: "6.075px", width: "155.25px" }}>
          <div style={{ transform: "rotate(-5deg)", transformOrigin: "center" }}>
            <div
              style={{
                width: "155.25px",
                background: "#ffffff",
                borderRadius: "9px",
                padding: "6px",
                boxShadow:
                  "-8px 6px 11.3px rgba(0,0,0,0.12), 0px 0px 0px 1px rgba(0,0,0,0.08), 0px 2px 4px rgba(0,0,0,0.06)",
              }}
            >
              {/* Violet event -> Emerald */}
              <div
                style={{
                  width: "100%",
                  height: "51px",
                  borderRadius: "4px",
                  overflow: "hidden",
                  background: "rgba(16,185,129,0.1)",
                  display: "flex",
                }}
              >
                <div style={{ width: "2.25px", background: "#10B981" }} />
                <div style={{ padding: "4.5px", width: "100%" }}>
                  <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#064E3B" }}
                    >
                      11:00
                    </span>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#064E3B" }}
                    >
                      AM
                    </span>
                    <div style={{ background: "#064E3B", padding: "1.5px", borderRadius: "100px" }}>
                      <div style={{ width: "8px", height: "8px", overflow: "hidden", position: "relative" }}>
                        <img
                          src={img2 || "/placeholder.svg"}
                          alt="video"
                          style={{ position: "absolute", inset: "20% 10% 20% 10%" }}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "9px", color: "#064E3B" }}>
                    {t.smartSimpleEvent}
                  </div>
                </div>
              </div>

              {/* Rose event -> Emerald */}
              <div
                style={{
                  width: "100%",
                  height: "51px",
                  borderRadius: "4px",
                  overflow: "hidden",
                  background: "rgba(16,185,129,0.1)",
                  display: "flex",
                  marginTop: "3px",
                }}
              >
                <div style={{ width: "2.25px", background: "#10B981" }} />
                <div style={{ padding: "4.5px", width: "100%" }}>
                  <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#064E3B" }}
                    >
                      4:00
                    </span>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#064E3B" }}
                    >
                      PM
                    </span>
                    <div style={{ background: "#064E3B", padding: "1.5px", borderRadius: "100px" }}>
                      <div style={{ width: "8px", height: "8px", overflow: "hidden", position: "relative" }}>
                        <img
                          src={img3 || "/placeholder.svg"}
                          alt="video"
                          style={{ position: "absolute", inset: "20% 10% 20% 10%" }}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "9px", color: "#064E3B" }}>
                    {t.smartSimpleEvent}
                  </div>
                </div>
              </div>

              {/* Violet tall event -> Emerald */}
              <div
                style={{
                  width: "100%",
                  height: "79.5px",
                  borderRadius: "4px",
                  overflow: "hidden",
                  background: "rgba(16,185,129,0.1)",
                  display: "flex",
                  marginTop: "3px",
                }}
              >
                <div style={{ width: "2.25px", background: "#10B981" }} />
                <div style={{ padding: "4.5px", width: "100%" }}>
                  <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#064E3B" }}
                    >
                      11:00
                    </span>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#064E3B" }}
                    >
                      AM
                    </span>
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "9px", color: "#064E3B" }}>
                    {t.smartSimpleEvent}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmartSimpleBrilliant
