import { ImageResponse } from "next/og";

const playfairDisplay = fetch(
  "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.ttf",
).then((response) => response.arrayBuffer());

const sourceSansRegular = fetch(
  "https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Ky461EN.ttf",
).then((response) => response.arrayBuffer());

const sourceSansSemibold = fetch(
  "https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Kxm7FEN.ttf",
).then((response) => response.arrayBuffer());

const sourceSansBold = fetch(
  "https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Kxf7FEN.ttf",
).then((response) => response.arrayBuffer());

export const alt = "Share your experience with Dominion Homes on Google";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const [displayFont, bodyFont, bodySemibold, bodyBold] = await Promise.all([
    playfairDisplay,
    sourceSansRegular,
    sourceSansSemibold,
    sourceSansBold,
  ]);

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
          fontFamily: "Source Sans 3",
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
              <div style={{ fontSize: "34px", fontWeight: 700, letterSpacing: "-0.6px" }}>
                DOMINION HOMES
              </div>
              <div style={{ fontSize: "18px", color: "#52665a", letterSpacing: "1.6px" }}>
                SPOKANE &amp; NORTH IDAHO
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "22px", maxWidth: "1000px" }}>
            <div
              style={{
                fontFamily: "Playfair Display",
                fontSize: "76px",
                lineHeight: 1.03,
                letterSpacing: "-2.2px",
                fontWeight: 400,
              }}
            >
              Would you share your experience?
            </div>
            <div style={{ fontSize: "25px", lineHeight: 1.35, color: "#52665a", maxWidth: "900px" }}>
              Your honest feedback helps local homeowners know what it is like to work with Dominion Homes.
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "295px",
                padding: "14px 24px",
                borderRadius: "14px",
                background: "linear-gradient(180deg, #ffd978 0%, #f5ad1b 62%, #e7950a 100%)",
                color: "#212529",
                fontSize: "24px",
                fontWeight: 600,
              }}
            >
              Leave a Google review
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
    {
      ...size,
      fonts: [
        { name: "Playfair Display", data: displayFont, weight: 400 },
        { name: "Source Sans 3", data: bodyFont, weight: 400 },
        { name: "Source Sans 3", data: bodySemibold, weight: 600 },
        { name: "Source Sans 3", data: bodyBold, weight: 700 },
      ],
    },
  );
}
