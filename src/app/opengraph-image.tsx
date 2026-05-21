import { ImageResponse } from "next/og";
import { SITE } from "@/lib/constants";

export const alt = "Dominion Homes - local direct home buyers in Spokane and North Idaho";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f4ed",
          color: "#17231d",
          padding: "64px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "#22543d",
              color: "#f7f4ed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            D
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "34px", fontWeight: 700 }}>{SITE.name}</div>
            <div style={{ fontSize: "20px", color: "#476253" }}>Spokane Direct Home Buyers</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
          <div style={{ fontSize: "76px", lineHeight: 1.05, maxWidth: "980px", fontWeight: 700 }}>
            Sell your Spokane house directly. No repairs, no commissions.
          </div>
          <div style={{ fontSize: "30px", lineHeight: 1.35, maxWidth: "900px", color: "#334c3f" }}>
            Cash and investor-backed as-is offers across Spokane County and Kootenai County.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "24px", color: "#22543d" }}>
          <div>{SITE.phone}</div>
          <div>{SITE.url.replace("https://", "")}</div>
        </div>
      </div>
    ),
    size,
  );
}
