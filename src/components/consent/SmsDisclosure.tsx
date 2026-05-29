import Link from "next/link";

type SmsDisclosureProps = {
  className?: string;
  tone?: "light" | "dark";
};

export function SmsDisclosure({ className = "", tone = "light" }: SmsDisclosureProps) {
  const dark = tone === "dark";

  return (
    <p
      className={[
        "mx-auto mt-4 max-w-2xl text-xs leading-relaxed",
        dark ? "text-white/70" : "text-ink-300",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      Optional SMS updates require checking the SMS consent box in the offer form.
      Message frequency varies, up to 10 msgs/month. Message and data rates may
      apply. Reply STOP to opt out or HELP for help. Consent is not required to
      receive an offer. See our{" "}
      <Link
        href="/privacy#sms-terms"
        className={dark ? "font-semibold text-white underline" : "font-semibold text-ink-500 underline"}
      >
        Privacy Policy
      </Link>{" "}
      and{" "}
      <Link
        href="/terms"
        className={dark ? "font-semibold text-white underline" : "font-semibold text-ink-500 underline"}
      >
        Terms
      </Link>
      .
    </p>
  );
}
