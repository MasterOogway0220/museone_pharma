import { ImageResponse } from "next/og";

export const alt = "MuseOne Pharma: billing and stock for Mumbai chemists";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f6f5f1", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 700 }}>
          <div style={{ fontSize: 34, color: "#0f5e4b", fontWeight: 600 }}>MuseOne Pharma</div>
          <div style={{ fontSize: 68, color: "#1c1f1d", fontWeight: 600, lineHeight: 1.08, letterSpacing: -2 }}>
            Every bill right. Batch, expiry and GST in one scan.
          </div>
          <div style={{ fontSize: 28, color: "#5d645f" }}>Billing and stock for chemists in Mumbai</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 60, width: 300, background: "#fffdf7", border: "2px solid #dcdad2", padding: 24, fontFamily: "monospace", fontSize: 18, color: "#000" }}>
          <div style={{ fontWeight: 700, textAlign: "center", marginBottom: 12 }}>TAX INVOICE</div>
          <div>Dolo 650 Tablet</div>
          <div style={{ fontSize: 14 }}>B:DL4521 E:03/28 HSN:3004</div>
          <div style={{ marginTop: 10 }}>Pan 40 Tablet</div>
          <div style={{ fontSize: 14 }}>B:PN2290 E:12/26 HSN:3004</div>
          <div style={{ marginTop: 16, borderTop: "2px dashed #000", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
            <span>CGST</span>
            <span>5.60</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>SGST</span>
            <span>5.60</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: 8 }}>
            <span>NET</span>
            <span>222.60</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
