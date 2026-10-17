import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getDominionServiceClient } from '@/lib/dominion-supabase';
import { isMetaProductionHost } from '@/lib/meta-measurement-policy';
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    const host = origin ? new URL(origin).hostname : '';
    const local = process.env.NODE_ENV !== 'production' && ['localhost','127.0.0.1'].includes(host);
    if ((!isMetaProductionHost(host) && !local) || request.headers.get('sec-fetch-site')==='cross-site') {
      return NextResponse.json({blocked:false,error:'Untrusted origin.'},{status:403});
    }
    const raw = await request.text();
    if (raw.length>1024) return NextResponse.json({blocked:false},{status:413});
    const body = JSON.parse(raw);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.submissionId || '') ||
      !/^[a-f0-9]{64}$/.test(body.token || '')) return NextResponse.json({blocked:false},{status:400});
    const db = getDominionServiceClient();
    if (!db) return NextResponse.json({blocked:false,error:'Could not save your privacy choice. Please try again.'},{status:503});
    const { data,error } = await db.rpc('revoke_meta_seller_measurement',{
      p_submission_id:body.submissionId.toLowerCase(),p_token_hash:createHash('sha256').update(body.token).digest('hex'),
    });
    if (error) return NextResponse.json({blocked:false,error:'Could not save your privacy choice. Please try again.'},{status:503});
    // No inquiry content or identifiers returned. Already-revoked tokens are idempotent.
    return NextResponse.json({blocked:data===true},{headers:{'Cache-Control':'no-store'}});
  } catch { return NextResponse.json({blocked:false,error:'Could not save your privacy choice.'},{status:400}); }
}
