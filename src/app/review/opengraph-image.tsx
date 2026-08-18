import { ImageResponse } from "next/og";

export const alt = "Share your experience with Dominion Homes on Google";
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
          position: "relative",
          overflow: "hidden",
          background: "#f8f5ee",
          color: "#17231d",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "560px",
            height: "560px",
            borderRadius: "999px",
            right: "-190px",
            top: "-230px",
            background: "#d9e4da",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "420px",
            height: "420px",
            borderRadius: "999px",
            left: "-170px",
            bottom: "-250px",
            background: "#efd39b",
          }}
        />

        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "58px 68px 62px",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "18px",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: "1px solid #d7ddd8",
              }}
            >
              <img
                src="https://www.dominionhomedeals.com/images/logo1.png"
                alt=""
                width="72"
                height="72"
                style={{ width: "72px", height: "72px", objectFit: "cover" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ fontSize: "34px", fontWeight: 800, letterSpacing: "-0.6px" }}>
                DOMINION HOMES
              </div>
              <div style={{ fontSize: "18px", color: "#52665a", letterSpacing: "1.6px" }}>
                SPOKANE &amp; NORTH IDAHO
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "62px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "790px" }}>
              <div
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "71px",
                  lineHeight: 1.04,
                  letterSpacing: "-2.2px",
                  fontWeight: 700,
                }}
              >
                Would you share your experience?
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "14px 24px",
                    borderRadius: "999px",
                    background: "#e1a634",
                    color: "#17231d",
                    fontSize: "24px",
                    fontWeight: 800,
                  }}
                >
                  Leave a Google review
                </div>
                <div style={{ fontSize: "21px", color: "#52665a" }}>Honest feedback is always welcome.</div>
              </div>
            </div>

            <div
              style={{
                width: "208px",
                height: "208px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50px",
                background: "#22543d",
                color: "#fffaf0",
                fontSize: "112px",
                fontFamily: "Georgia, serif",
                fontWeight: 700,
                lineHeight: 1,
                paddingTop: "28px",
              }}
            >
              “
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "20px", color: "#52665a" }}>Thank you for trusting our local team.</div>
            <div style={{ fontSize: "20px", color: "#22543d", fontWeight: 700 }}>
              dominionhomedeals.com/review
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
