export interface MetaSellerSubmissionAttempt {
  fingerprint: string;
  submissionId: string;
  body: string;
  privacyToken: string;
}

/** Matching/device details and generated times do not define another inquiry. */
export function prepareMetaSellerSubmission(previous: MetaSellerSubmissionAttempt | null,
  input: Record<string, unknown>): MetaSellerSubmissionAttempt {
  const identity = { ...input };
  delete identity.metaMeasurement;
  delete identity.metaPrivacyToken;
  delete identity.sms_consent_timestamp;
  delete identity.smsOptInTimestamp;
  delete identity.tcpaTimestamp;
  const fingerprint = JSON.stringify(identity);
  const submissionId = previous?.fingerprint === fingerprint ? previous.submissionId : crypto.randomUUID();
  // Refresh permissions in the request without duplicating a saved inquiry.
  const privacyToken = previous?.fingerprint === fingerprint && previous.privacyToken
    ? previous.privacyToken : Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,'0')).join('');
  return { fingerprint, submissionId, privacyToken, body: JSON.stringify({ ...input, submissionId, metaPrivacyToken:privacyToken }) };
}
