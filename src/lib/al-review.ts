import { getServiceClient } from "@/lib/supabase";

export const AL_SESSION_VALUE = "al_authenticated_v1";
export const REVIEW_ASSET_BUCKET = "al-review-artifacts";

export type ReviewState =
  | "cart_ready_for_review"
  | "changes_requested"
  | "approved_for_checkout"
  | "resume_local_session_required"
  | "blocked_vendor_session"
  | "presentation_closed";

export type ReviewDecisionAction =
  | "approved_for_checkout"
  | "changes_requested"
  | "resume_local_session_required"
  | "blocked_vendor_session"
  | "select_alternative_option"
  | "close_presentation";

export interface ReviewArtifactUploadInput {
  dataUrl: string;
  contentType?: string | null;
  fileName?: string | null;
}

export interface BrowserCommerceReviewSyncInput {
  jobId: number;
  origin: string;
  host: string | null | undefined;
  browserResult?: Record<string, unknown>;
  artifacts?: Record<string, ReviewArtifactUploadInput | undefined>;
}

export interface BrowserCommerceReviewSyncResult {
  reviewPageUrl: string;
  reviewState: ReviewState;
  reviewSurface: Record<string, unknown>;
  nextAction: string;
  updatedContext: JsonRecord;
}

export interface BoardroomPresentationRecord {
  id: number;
  jobType: string;
  task: string;
  summary: string;
  title: string;
  state: string;
  bucket: "review_now" | "needs_attention" | "local_only";
  updatedAt: string | null;
  boardroomPath: string;
}

type JsonRecord = Record<string, unknown>;

let bucketReady: Promise<void> | null = null;

export function isAuthenticatedAlSession(cookieValue?: string | null): boolean {
  return cookieValue === AL_SESSION_VALUE;
}

export function parseJobContext(raw: unknown): JsonRecord {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as JsonRecord)
        : {};
    } catch {
      return {};
    }
  }

  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as JsonRecord)
    : {};
}

export function normalizeReviewState(value: unknown): ReviewState {
  switch (String(value || "")) {
    case "changes_requested":
    case "approved_for_checkout":
    case "resume_local_session_required":
    case "blocked_vendor_session":
    case "cart_ready_for_review":
    case "presentation_closed":
      return value as ReviewState;
    default:
      return "cart_ready_for_review";
  }
}

export function buildHostedReviewPath(host: string | null | undefined, jobId: number): string {
  const normalizedHost = String(host || "").toLowerCase();
  return normalizedHost.startsWith("al.dominionhomedeals.com")
    ? `/boardroom/${jobId}`
    : `/al/boardroom/${jobId}`;
}

export function buildHostedBoardroomHomePath(host: string | null | undefined): string {
  const normalizedHost = String(host || "").toLowerCase();
  return normalizedHost.startsWith("al.dominionhomedeals.com")
    ? "/boardroom"
    : "/al/boardroom";
}

export function buildHostedReviewUrl(
  origin: string,
  host: string | null | undefined,
  jobId: number,
): string {
  return `${origin.replace(/\/+$/, "")}${buildHostedReviewPath(host, jobId)}`;
}

export async function fetchAlJob(jobId: number) {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("al_jobs")
    .select("id, job_type, status, task, result, context, started_at, completed_at")
    .eq("id", jobId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as {
    id: number;
    job_type: string;
    status: string;
    task: string;
    result: string | null;
    context: unknown;
    started_at: string | null;
    completed_at: string | null;
  };
}

function titleCaseStatus(value: string): string {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isLocalOnlyUrl(value: unknown): boolean {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const parsed = new URL(value);
    return parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  } catch {
    return false;
  }
}

function extractEmbeddedErrorText(value: string): string | null {
  const trimmed = value.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const error = (parsed as Record<string, unknown>).error;
      return typeof error === "string" && error.trim() ? error.trim() : null;
    }
  } catch {
    return null;
  }
  return null;
}

export async function fetchBoardroomPresentations(
  host: string | null | undefined,
  limit = 12,
): Promise<BoardroomPresentationRecord[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("al_jobs")
    .select("id, job_type, task, context, started_at, completed_at")
    .order("id", { ascending: false })
    .limit(Math.max(limit * 3, limit));

  if (error || !data) {
    return [];
  }

  const presentations = data
    .map((row) => {
      const context = parseJobContext(row.context);
      const hasReviewSurface =
        context.review_surface && typeof context.review_surface === "object" && !Array.isArray(context.review_surface);
      const hasBoardroomLink = typeof context.review_page_url === "string" || typeof context.hosted_review_page_url === "string";
      const operatorLinks = Array.isArray(context.operator_links)
        ? context.operator_links.filter(
            (entry): entry is Record<string, unknown> =>
              Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
          )
        : [];
      const hasHostedOperatorLink = operatorLinks.some(
        (entry) => typeof entry.url === "string" && !isLocalOnlyUrl(entry.url),
      );
      const hasLocalOnlyOperatorLink = operatorLinks.some(
        (entry) => typeof entry.url === "string" && isLocalOnlyUrl(entry.url),
      );
      const hasHostedReviewLink =
        (typeof context.hosted_review_page_url === "string" && !isLocalOnlyUrl(context.hosted_review_page_url)) ||
        (typeof context.review_page_url === "string" && !isLocalOnlyUrl(context.review_page_url)) ||
        hasHostedOperatorLink;
      const hasLocalOnlyLink =
        isLocalOnlyUrl(context.review_page_url) ||
        isLocalOnlyUrl(context.hosted_review_page_url) ||
        hasLocalOnlyOperatorLink;
      const hasPresentationShell =
        (typeof context.presentation_title === "string" && context.presentation_title.trim().length > 0) ||
        (typeof context.presentation_body === "string" && context.presentation_body.trim().length > 0);

        if (!hasReviewSurface && !hasBoardroomLink && !hasPresentationShell) {
          return null;
        }

        if (normalizeReviewState(context.review_state) === "presentation_closed") {
          return null;
        }

      const title =
        typeof context.presentation_title === "string" && context.presentation_title.trim()
          ? context.presentation_title.trim()
          : typeof context.business_name === "string" && context.business_name.trim()
            ? `${context.business_name.trim()} Presentation`
            : row.job_type === "browser_commerce_design"
              ? "Browser Commerce Presentation"
              : titleCaseStatus(row.job_type);

      const rawSummary =
        typeof context.summary === "string" && context.summary.trim()
          ? context.summary.trim()
          : "";
      const recommendation =
        typeof context.presentation_recommendation === "string" && context.presentation_recommendation.trim()
          ? context.presentation_recommendation.trim()
          : "";
      const bodyText =
        typeof context.presentation_body === "string" && context.presentation_body.trim()
          ? context.presentation_body.trim()
          : typeof context.result_snapshot === "string" && context.result_snapshot.trim()
            ? context.result_snapshot.trim()
            : "";
      const summary =
        rawSummary &&
        rawSummary !== "✓ Done" &&
        !/^\[[^\]]+\]$/.test(rawSummary)
          ? rawSummary
          : recommendation &&
              recommendation !== "✓ Done" &&
              !/^\[[^\]]+\]$/.test(recommendation)
            ? recommendation
            : extractEmbeddedErrorText(bodyText) || row.task;
      const stateLabel =
        (typeof context.presentation_status_label === "string" && context.presentation_status_label.trim()) ||
        normalizeReviewState(context.review_state);
      const loweredState = stateLabel.toLowerCase();
      const loweredSummary = summary.toLowerCase();
      const loweredJobType = String(row.job_type || "").toLowerCase();
      const isThinExecutiveBrief =
        loweredJobType === "delegate_to_ceo" &&
        /^\[[^\]]+\]$/.test(rawSummary) &&
        bodyText.length < 120;
      const bucket: BoardroomPresentationRecord["bucket"] =
        hasLocalOnlyLink && !hasHostedReviewLink
          ? "local_only"
          : loweredState.includes("blocked") ||
              loweredState.includes("execution launched") ||
              isThinExecutiveBrief ||
              loweredSummary.includes("error") ||
              loweredSummary.includes("blocked") ||
              loweredSummary.includes("credit balance is too low") ||
              (loweredJobType === "cursor_agent" && !hasHostedReviewLink && !hasReviewSurface) ||
              (loweredJobType === "cowork_task" && !hasHostedReviewLink && !hasReviewSurface)
            ? "needs_attention"
            : "review_now";

      return {
        id: row.id as number,
        jobType: row.job_type as string,
        task: row.task as string,
        summary,
        title,
        state: stateLabel,
        bucket,
        updatedAt:
          (typeof row.completed_at === "string" ? row.completed_at : null) ||
          (typeof row.started_at === "string" ? row.started_at : null),
        boardroomPath: buildHostedReviewPath(host, row.id as number),
      } satisfies BoardroomPresentationRecord;
    })
    .filter((entry): entry is BoardroomPresentationRecord => Boolean(entry));

  return presentations.slice(0, limit);
}

export async function updateAlJobContext(jobId: number, context: JsonRecord): Promise<void> {
  const supabase = getServiceClient();
  if (!supabase) {
    throw new Error("Supabase service client unavailable.");
  }

  const { error } = await supabase
    .from("al_jobs")
    .update({ context: JSON.stringify(context) })
    .eq("id", jobId);

  if (error) {
    throw new Error(error.message || "Failed to update review context.");
  }
}

async function ensureReviewBucket(): Promise<void> {
  if (bucketReady) {
    return bucketReady;
  }

  bucketReady = (async () => {
    const supabase = getServiceClient();
    if (!supabase) {
      throw new Error("Supabase service client unavailable.");
    }

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      throw new Error(listError.message || "Could not list storage buckets.");
    }

    if (buckets?.some((bucket) => bucket.name === REVIEW_ASSET_BUCKET || bucket.id === REVIEW_ASSET_BUCKET)) {
      return;
    }

    const { error: createError } = await supabase.storage.createBucket(REVIEW_ASSET_BUCKET, {
      public: false,
      fileSizeLimit: "10MB",
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    });

    if (createError && !/already exists/i.test(createError.message || "")) {
      throw new Error(createError.message || "Could not create review asset bucket.");
    }
  })();

  try {
    await bucketReady;
  } finally {
    bucketReady = null;
  }
}

function sanitizeStorageSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "asset";
}

function decodeDataUrl(dataUrl: string): Buffer {
  const match = /^data:([^;,]+)?(?:;base64)?,(.*)$/i.exec(dataUrl);
  if (!match) {
    throw new Error("Invalid review artifact payload.");
  }

  const payload = match[2] || "";
  return Buffer.from(payload, "base64");
}

function extensionForArtifact(fileName: string, contentType: string): string {
  const explicit = (fileName.split(".").pop() || "").toLowerCase();
  if (explicit && explicit !== fileName.toLowerCase()) {
    return explicit;
  }

  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

export async function uploadReviewArtifact(
  jobId: number,
  key: string,
  artifact: ReviewArtifactUploadInput,
): Promise<string> {
  const supabase = getServiceClient();
  if (!supabase) {
    throw new Error("Supabase service client unavailable.");
  }

  await ensureReviewBucket();

  const contentType = String(artifact.contentType || "image/png");
  const fileName = String(artifact.fileName || `${key}.png`);
  const ext = extensionForArtifact(fileName, contentType);
  const storagePath = `browser-commerce/job-${jobId}/${sanitizeStorageSegment(key)}.${ext}`;
  const buffer = decodeDataUrl(artifact.dataUrl);

  const { error } = await supabase.storage
    .from(REVIEW_ASSET_BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(error.message || `Failed to upload review artifact ${key}.`);
  }

  return storagePath;
}

export async function createSignedReviewAssetUrl(storagePath: string | null | undefined): Promise<string | null> {
  if (!storagePath) return null;
  const supabase = getServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(REVIEW_ASSET_BUCKET)
    .createSignedUrl(storagePath, 60 * 60);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

export function reviewActionToState(action: ReviewDecisionAction): ReviewState {
  switch (action) {
    case "approved_for_checkout":
      return "approved_for_checkout";
    case "resume_local_session_required":
      return "resume_local_session_required";
    case "blocked_vendor_session":
      return "blocked_vendor_session";
    case "close_presentation":
      return "presentation_closed";
    case "changes_requested":
    case "select_alternative_option":
    default:
      return "changes_requested";
  }
}

export async function syncBrowserCommerceReviewJob(
  input: BrowserCommerceReviewSyncInput,
): Promise<BrowserCommerceReviewSyncResult> {
  const job = await fetchAlJob(input.jobId);
  if (!job || job.job_type !== "browser_commerce_design") {
    throw new Error("Review job not found.");
  }

  const browserResult =
    input.browserResult && typeof input.browserResult === "object"
      ? input.browserResult
      : {};
  const contextValue = parseJobContext(job.context);
  const existingSurface =
    contextValue.review_surface &&
    typeof contextValue.review_surface === "object" &&
    !Array.isArray(contextValue.review_surface)
      ? (contextValue.review_surface as Record<string, unknown>)
      : {};
  const existingPaths =
    existingSurface.artifact_paths &&
    typeof existingSurface.artifact_paths === "object" &&
    !Array.isArray(existingSurface.artifact_paths)
      ? (existingSurface.artifact_paths as Record<string, unknown>)
      : {};

  const uploadedPaths: Record<string, string | null> = {
    chosen_design_preview:
      typeof existingPaths.chosen_design_preview === "string"
        ? String(existingPaths.chosen_design_preview)
        : null,
    design_review_image:
      typeof existingPaths.design_review_image === "string"
        ? String(existingPaths.design_review_image)
        : null,
    cart_review_image:
      typeof existingPaths.cart_review_image === "string"
        ? String(existingPaths.cart_review_image)
        : null,
  };

  for (const [key, artifact] of Object.entries(input.artifacts || {})) {
    if (!artifact?.dataUrl) continue;
    uploadedPaths[key] = await uploadReviewArtifact(input.jobId, key, artifact);
  }

  const reviewPageUrl = buildHostedReviewUrl(input.origin, input.host, input.jobId);
  const reviewState = normalizeReviewState(contextValue.review_state || browserResult.review_state);
  const linkSupport =
    browserResult.link_support &&
    typeof browserResult.link_support === "object" &&
    !Array.isArray(browserResult.link_support)
      ? (browserResult.link_support as Record<string, unknown>)
      : contextValue.link_support &&
          typeof contextValue.link_support === "object" &&
          !Array.isArray(contextValue.link_support)
        ? (contextValue.link_support as Record<string, unknown>)
        : {};
  const reviewSurfaceInput =
    browserResult.review_surface &&
    typeof browserResult.review_surface === "object" &&
    !Array.isArray(browserResult.review_surface)
      ? (browserResult.review_surface as Record<string, unknown>)
      : existingSurface;
  const hasHostedSession =
    typeof reviewSurfaceInput.hosted_session_url === "string" ||
    typeof reviewSurfaceInput.hosted_debugger_url === "string" ||
    typeof reviewSurfaceInput.hosted_debugger_fullscreen_url === "string";
  const nextAction = hasHostedSession
    ? "Open the hosted review page, inspect the proof and screenshots, then approve checkout readiness or request changes. Open the hosted Browserbase session only if you need live browser replay or inspection."
    : "Open the hosted review page, inspect the proof and screenshots, then approve checkout readiness or request changes. Resume the local cart session only if you need the live vendor cart.";

  const reviewSurface = {
    mode: hasHostedSession ? "hosted_browserbase_review" : "hosted_hybrid",
    hosted_review_url: reviewPageUrl,
    bridge_review_page_url:
      typeof browserResult.review_page_url === "string"
        ? browserResult.review_page_url
        : typeof contextValue.local_review_page_url === "string"
          ? contextValue.local_review_page_url
          : null,
    proof_url:
      typeof browserResult.proof_url === "string"
        ? browserResult.proof_url
        : typeof contextValue.proof_url === "string"
          ? contextValue.proof_url
          : null,
    resume_cart_url:
      typeof browserResult.resume_cart_url === "string"
        ? browserResult.resume_cart_url
        : typeof contextValue.resume_cart_url === "string"
          ? contextValue.resume_cart_url
          : null,
    resume_proof_url:
      typeof browserResult.resume_proof_url === "string"
        ? browserResult.resume_proof_url
        : typeof contextValue.resume_proof_url === "string"
          ? contextValue.resume_proof_url
          : null,
    cart_url:
      typeof browserResult.cart_url === "string"
        ? browserResult.cart_url
        : typeof contextValue.cart_url === "string"
          ? contextValue.cart_url
          : null,
    cart_session_bound:
      linkSupport.cart_url_usable_cross_session === false ||
      (typeof browserResult.resume_cart_url === "string" &&
        linkSupport.cart_url_usable_cross_session !== true),
    link_support: linkSupport,
    artifact_bucket: REVIEW_ASSET_BUCKET,
    artifact_paths: uploadedPaths,
    hosted_session_id:
      typeof browserResult.hosted_session_id === "string"
        ? browserResult.hosted_session_id
        : typeof reviewSurfaceInput.hosted_session_id === "string"
          ? reviewSurfaceInput.hosted_session_id
          : null,
    hosted_session_url:
      typeof browserResult.hosted_session_url === "string"
        ? browserResult.hosted_session_url
        : typeof reviewSurfaceInput.hosted_session_url === "string"
          ? reviewSurfaceInput.hosted_session_url
          : null,
    hosted_debugger_url:
      typeof browserResult.hosted_debugger_url === "string"
        ? browserResult.hosted_debugger_url
        : typeof reviewSurfaceInput.hosted_debugger_url === "string"
          ? reviewSurfaceInput.hosted_debugger_url
          : null,
    hosted_debugger_fullscreen_url:
      typeof browserResult.hosted_debugger_fullscreen_url === "string"
        ? browserResult.hosted_debugger_fullscreen_url
        : typeof reviewSurfaceInput.hosted_debugger_fullscreen_url === "string"
          ? reviewSurfaceInput.hosted_debugger_fullscreen_url
          : null,
    synced_at: new Date().toISOString(),
  };

  const updatedContext = {
    ...contextValue,
    selected_execution_path:
      typeof browserResult.selected_execution_path === "string"
        ? browserResult.selected_execution_path
        : contextValue.selected_execution_path || null,
    review_page_url: reviewPageUrl,
    hosted_review_page_url: reviewPageUrl,
    local_review_page_url:
      reviewSurface.bridge_review_page_url || contextValue.local_review_page_url || null,
    proof_url: reviewSurface.proof_url,
    resume_cart_url: reviewSurface.resume_cart_url,
    resume_proof_url: reviewSurface.resume_proof_url,
    cart_url: reviewSurface.cart_url,
    hosted_session_id: reviewSurface.hosted_session_id,
    hosted_session_url: reviewSurface.hosted_session_url,
    hosted_debugger_url: reviewSurface.hosted_debugger_url,
    hosted_debugger_fullscreen_url: reviewSurface.hosted_debugger_fullscreen_url,
    next_action: nextAction,
    review_state: reviewState,
    review_surface: reviewSurface,
    link_support: linkSupport,
    artifact_delivery: {
      mode: "hosted_signed_storage",
      bucket: REVIEW_ASSET_BUCKET,
      uploaded_at: reviewSurface.synced_at,
    },
  };

  await updateAlJobContext(input.jobId, updatedContext);

  return {
    reviewPageUrl,
    reviewState,
    reviewSurface,
    nextAction,
    updatedContext,
  };
}
