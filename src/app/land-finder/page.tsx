import { LandFinderApp } from "@/components/land-finder/LandFinderApp";
import { LandFinderLogin } from "@/components/land-finder/LandFinderLogin";
import { hasLandFinderSession, isLandFinderAuthConfigured } from "@/lib/land-finder/auth";

export const dynamic = "force-dynamic";

export default async function LandFinderPage() {
  const authenticated = await hasLandFinderSession();
  if (!authenticated) {
    return <LandFinderLogin configured={isLandFinderAuthConfigured()} />;
  }
  return <LandFinderApp />;
}
