export interface MetaSellerSubmissionAttempt {
  fingerprint: string;
  submissionId: string;
  body: string;
}

/** Matching/device details and generated times do not define another inquiry. */
export function prepareMetaSellerSubmission(previous: MetaSellerSubmissionAttempt | null,
  input: Record<string, unknown>): MetaSellerSubmissionAttempt {
  const identity = { ...input };
  delete identity.metaMeasurement;
  delete identity.sms_consent_timestamp;
  delete identity.smsOptInTimestamp;
  delete identity.tcpaTimestamp;
  const fingerprint = JSON.stringify(identity);
  const submissionId = previous?.fingerprint === fingerprint ? previous.submissionId : crypto.randomUUID();
  // Refresh permissions in the request without duplicating a saved inquiry.
  return { fingerprint, submissionId, body: JSON.stringify({ ...input, submissionId }) };
}
