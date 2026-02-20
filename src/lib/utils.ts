// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function generateConsentHash(data: {
  timestamp: string;
  ipAddress: string;
  consentLanguage: string;
}): string {
  const raw = `${data.timestamp}|${data.ipAddress}|${data.consentLanguage}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `tcpa_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let sessionId = sessionStorage.getItem("dh_session");
  if (!sessionId) {
    sessionId = `ses_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem("dh_session", sessionId);
  }
  return sessionId;
}
