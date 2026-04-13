import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
