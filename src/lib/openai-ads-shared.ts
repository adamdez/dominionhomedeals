export function openAILeadEventId(submissionId: string): string {
  return `dominion_lead_${submissionId.toLowerCase()}`;
}
