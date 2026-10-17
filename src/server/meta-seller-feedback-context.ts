import 'server-only';
import { createHash } from 'node:crypto';
import { getDominionServiceClient } from '@/lib/dominion-supabase';
import { hasMetaMeasurementPermission, normalizeMetaCookie, normalizeMetaClickCookie, type MetaMeasurementChoice } from '@/lib/meta-measurement-policy';
export function buildMetaFeedbackContext(input: {
  choice?: MetaMeasurementChoice; token?: unknown; internalQa: boolean; globalPrivacyControl: boolean;
}, now=Date.now()) {
  if (input.internalQa || input.globalPrivacyControl || !hasMetaMeasurementPermission(input.choice) ||
    input.choice?.consentVersion !== 'meta_measurement_v2' || typeof input.token !== 'string' || !/^[a-f0-9]{64}$/.test(input.token)) return undefined;
  const fbp = normalizeMetaCookie(input.choice.fbp);
  const fbc = normalizeMetaClickCookie(input.choice.fbc,now);
  return { consent:true, consentVersion:'meta_measurement_v2', capturedAt:new Date(now).toISOString(),
    expiresAt:new Date(now+90*86400000).toISOString(), revokedAt:null,
    tokenHash:createHash('sha256').update(input.token).digest('hex'), ...(fbp?{fbp}:{}),...(fbc?{fbc}:{}) };
}
export async function withdrawMetaFeedbackPermission(submissionId:string,token:unknown):Promise<boolean> {
  if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return false;
  const db=getDominionServiceClient();if(!db)return false;
  const {data,error}=await db.rpc('revoke_meta_seller_measurement',{
    p_submission_id:submissionId.toLowerCase(),p_token_hash:createHash('sha256').update(token).digest('hex'),
  });
  return !error&&data===true;
}
