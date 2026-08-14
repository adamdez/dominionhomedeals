"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Cloud,
  CloudOff,
  Copy,
  ExternalLink,
  Grid3X3,
  Heart,
  Layers3,
  LoaderCircle,
  LogIn,
  LogOut,
  Mail,
  Map as MapIcon,
  Phone,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type {
  LandFinderReview,
  LandFinderReviewInput,
  LandMode,
  ParcelFeature,
  ParcelFeatureCollection,
} from "@/lib/land-finder/types";
import { EMPTY_REVIEW_INPUT } from "@/lib/land-finder/types";
import { SPOKANE_COUNTY_BOUNDS } from "@/lib/land-finder/gis";

const EMPTY_PARCELS: ParcelFeatureCollection = { type: "FeatureCollection", features: [] };
const PENDING_KEY = "dominion-land-finder-pending-v1";
const PROFILE_KEY = "dominion-land-finder-profile-v1";
const VIEW_ZOOM_THRESHOLD = 10.7;

type SyncState = "loading" | "ready" | "saving" | "pending" | "auth";
type ViewportState = { bbox: [number, number, number, number]; zoom: number };

function buildGrid(): GeoJSON.FeatureCollection {
  const { west, south, east, north } = SPOKANE_COUNTY_BOUNDS;
  const cellWidth = (east - west) / 4;
  const cellHeight = (north - south) / 4;
  const features: GeoJSON.Feature[] = [];
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const cellWest = west + column * cellWidth;
      const cellEast = cellWest + cellWidth;
      const cellNorth = north - row * cellHeight;
      const cellSouth = cellNorth - cellHeight;
      features.push({
        type: "Feature",
        properties: { label: `${String.fromCharCode(65 + row)}${column + 1}` },
        geometry: {
          type: "Polygon",
          coordinates: [[[cellWest, cellSouth], [cellEast, cellSouth], [cellEast, cellNorth], [cellWest, cellNorth], [cellWest, cellSouth]]],
        },
      });
    }
  }
  return { type: "FeatureCollection", features };
}

const COUNTY_GRID = buildGrid();

function reviewToInput(review: LandFinderReview | undefined, profile: string): LandFinderReviewInput {
  if (!review) return { ...EMPTY_REVIEW_INPUT, updatedBy: profile };
  return {
    favorite: review.favorite,
    reviewState: review.reviewState,
    calledAt: review.calledAt,
    letterSentAt: review.letterSentAt,
    notes: review.notes,
    listingStatus: review.listingStatus,
    listingVerifiedAt: review.listingVerifiedAt,
    listingSourceUrl: review.listingSourceUrl,
    distressStatus: review.distressStatus,
    distressVerifiedAt: review.distressVerifiedAt,
    distressSourceUrl: review.distressSourceUrl,
    updatedBy: profile,
  };
}

function optimisticReview(parcelId: string, input: LandFinderReviewInput, existing?: LandFinderReview): LandFinderReview {
  const now = new Date().toISOString();
  return {
    parcelId,
    ...input,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

function readPendingReviews(): Record<string, LandFinderReviewInput> {
  try {
    const value = JSON.parse(localStorage.getItem(PENDING_KEY) || "{}") as Record<string, LandFinderReviewInput>;
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function writePendingReviews(value: Record<string, LandFinderReviewInput>) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(value));
}

function geometryBounds(feature: ParcelFeature): [[number, number], [number, number]] {
  const points: number[][] = [];
  const collect = (value: unknown) => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      points.push(value as number[]);
      return;
    }
    value.forEach(collect);
  };
  collect(feature.geometry.coordinates);
  const longitudes = points.map((point) => point[0]);
  const latitudes = points.map((point) => point[1]);
  return [[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]];
}

function parcelAddress(feature: ParcelFeature): string {
  const address = feature.properties.address;
  if (!address || address.toLowerCase().includes("unassigned")) return "No assigned site address";
  return [address, feature.properties.city].filter(Boolean).join(", ");
}

function formatMoney(value: number | null): string {
  return value === null ? "Unknown" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatActionDate(value: string | null): string {
  if (!value) return "Not marked";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function LandFinderApp() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const parcelIndexRef = useRef(new Map<string, ParcelFeature>());
  const savedIndexRef = useRef(new Map<string, ParcelFeature>());
  const pendingRef = useRef<Record<string, LandFinderReviewInput>>({});
  const [mapReady, setMapReady] = useState(false);
  const [viewport, setViewport] = useState<ViewportState | null>(null);
  const [parcels, setParcels] = useState<ParcelFeatureCollection>(EMPTY_PARCELS);
  const [savedParcels, setSavedParcels] = useState<ParcelFeatureCollection>(EMPTY_PARCELS);
  const [selected, setSelected] = useState<ParcelFeature | null>(null);
  const [reviews, setReviews] = useState<Map<string, LandFinderReview>>(new Map());
  const [draft, setDraft] = useState<LandFinderReviewInput | null>(null);
  const [syncState, setSyncState] = useState<SyncState>("loading");
  const [profile, setProfile] = useState("Team");
  const [mode, setMode] = useState<LandMode>("vacant");
  const [minAcres, setMinAcres] = useState("0.5");
  const [maxAcres, setMaxAcres] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [distressOnly, setDistressOnly] = useState(false);
  const [gridVisible, setGridVisible] = useState(true);
  const [aerial, setAerial] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMessage, setViewMessage] = useState("Zoom in to see parcels");
  const [loadingParcels, setLoadingParcels] = useState(false);
  const [parcelsLoaded, setParcelsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ParcelFeature[]>([]);
  const [copied, setCopied] = useState(false);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);

  useEffect(() => {
    const storedProfile = localStorage.getItem(PROFILE_KEY);
    if (storedProfile) setProfile(storedProfile);
  }, []);

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, profile);
  }, [profile]);

  const loadReviews = useCallback(async () => {
    const pending = readPendingReviews();
    pendingRef.current = pending;
    const response = await fetch("/api/land-finder/reviews", { cache: "no-store" }).catch(() => null);
    if (response?.status === 401) {
      setSyncState("auth");
      return;
    }
    const next = new Map<string, LandFinderReview>();
    if (response?.ok) {
      const body = (await response.json()) as {
        reviews: LandFinderReview[];
        savedParcels?: ParcelFeatureCollection;
      };
      body.reviews.forEach((review) => next.set(review.parcelId, review));
      setSavedParcels(body.savedParcels || EMPTY_PARCELS);
    }
    Object.entries(pending).forEach(([parcelId, input]) => {
      next.set(parcelId, optimisticReview(parcelId, input, next.get(parcelId)));
    });
    if (response?.ok && Object.keys(pending).length > 0) {
      setSyncState("saving");
      const remaining: Record<string, LandFinderReviewInput> = {};
      let authExpired = false;
      for (const [parcelId, input] of Object.entries(pending)) {
        const syncResponse = await fetch(`/api/land-finder/reviews/${encodeURIComponent(parcelId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }).catch(() => null);
        if (syncResponse?.ok) {
          const body = (await syncResponse.json()) as { review: LandFinderReview };
          next.set(parcelId, body.review);
        } else {
          if (syncResponse?.status === 401) authExpired = true;
          remaining[parcelId] = input;
        }
      }
      pendingRef.current = remaining;
      writePendingReviews(remaining);
      if (authExpired) {
        setReviews(next);
        setSyncState("auth");
        return;
      }
    }
    setReviews(next);
    setSyncState(Object.keys(pendingRef.current).length > 0 || !response?.ok ? "pending" : "ready");
  }, []);

  useEffect(() => {
    void loadReviews();
    const retry = () => void loadReviews();
    const retryFromAnotherTab = (event: StorageEvent) => {
      if (event.key === PENDING_KEY) retry();
    };
    window.addEventListener("online", retry);
    window.addEventListener("focus", retry);
    window.addEventListener("storage", retryFromAnotherTab);
    return () => {
      window.removeEventListener("online", retry);
      window.removeEventListener("focus", retry);
      window.removeEventListener("storage", retryFromAnotherTab);
    };
  }, [loadReviews]);

  const persistReview = useCallback(async (parcelId: string, input: LandFinderReviewInput) => {
    pendingRef.current = { ...pendingRef.current, [parcelId]: input };
    writePendingReviews(pendingRef.current);
    setReviews((current) => {
      const next = new Map(current);
      next.set(parcelId, optimisticReview(parcelId, input, current.get(parcelId)));
      return next;
    });
    setSyncState("saving");

    const response = await fetch(`/api/land-finder/reviews/${encodeURIComponent(parcelId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).catch(() => null);
    if (!response?.ok) {
      setSyncState(response?.status === 401 ? "auth" : "pending");
      return;
    }

    const body = (await response.json()) as { review: LandFinderReview };
    const { [parcelId]: _synced, ...remaining } = pendingRef.current;
    pendingRef.current = remaining;
    writePendingReviews(remaining);
    setReviews((current) => new Map(current).set(parcelId, body.review));
    setSyncState(Object.keys(remaining).length > 0 ? "pending" : "ready");
  }, []);

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft(reviewToInput(reviews.get(selected.properties.parcelId), profile));
  }, [profile, reviews, selected]);

  useEffect(() => {
    if (!selected || !draft) return;
    const savedNotes = reviews.get(selected.properties.parcelId)?.notes || "";
    if (draft.notes === savedNotes) return;
    const timeout = window.setTimeout(() => {
      void persistReview(selected.properties.parcelId, { ...draft, updatedBy: profile });
    }, 850);
    return () => window.clearTimeout(timeout);
  }, [draft, persistReview, profile, reviews, selected]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    let disposed = false;
    void import("maplibre-gl").then((maplibregl) => {
      if (disposed || !mapContainerRef.current) return;
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [-117.43, 47.72],
        zoom: 8.95,
        minZoom: 8.4,
        maxZoom: 19,
        maxBounds: [[-118.05, 47.08], [-116.78, 48.2]],
        attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
      map.on("styleimagemissing", (event) => {
        if (!map.hasImage(event.id)) {
          map.addImage(event.id, { width: 1, height: 1, data: new Uint8Array([0, 0, 0, 0]) });
        }
      });

      const syncViewport = () => {
        const bounds = map.getBounds();
        setViewport({
          bbox: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
          zoom: map.getZoom(),
        });
      };

      map.on("load", () => {
        map.addSource("usgs-aerial", {
          type: "raster",
          tiles: ["https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}"],
          tileSize: 256,
          attribution: "USGS The National Map",
        });
        map.addLayer({ id: "usgs-aerial", type: "raster", source: "usgs-aerial", layout: { visibility: "none" } });
        map.addSource("county-grid", { type: "geojson", data: COUNTY_GRID });
        map.addLayer({ id: "county-grid-fill", type: "fill", source: "county-grid", paint: { "fill-color": "#fff", "fill-opacity": 0.025 } });
        map.addLayer({ id: "county-grid-line", type: "line", source: "county-grid", paint: { "line-color": "#13251e", "line-opacity": 0.66, "line-width": 1.3 } });
        map.addLayer({
          id: "county-grid-label",
          type: "symbol",
          source: "county-grid",
          layout: { "text-field": ["get", "label"], "text-size": 16, "text-font": ["Noto Sans Regular"] },
          paint: { "text-color": "#15251f", "text-halo-color": "#ffffff", "text-halo-width": 2 },
        });
        map.addSource("saved-parcels", {
          type: "geojson",
          data: EMPTY_PARCELS as unknown as GeoJSON.FeatureCollection,
        });
        map.addSource("land-parcels", {
          type: "geojson",
          data: EMPTY_PARCELS as unknown as GeoJSON.FeatureCollection,
        });
        map.addLayer({
          id: "land-parcels-fill",
          type: "fill",
          source: "land-parcels",
          paint: {
            "fill-color": [
              "case",
              ["==", ["get", "distressStatus"], "evidence"], "#d75b49",
              ["==", ["get", "qualification"], "verify_improvements"], "#958044",
              "#278071",
            ],
            "fill-opacity": 0.38,
          },
        });
        map.addLayer({ id: "land-parcels-line", type: "line", source: "land-parcels", paint: { "line-color": "#153b33", "line-opacity": 0.9, "line-width": 1 } });
        map.addLayer({ id: "saved-parcels-fill", type: "fill", source: "saved-parcels", paint: { "fill-color": "#e6a82f", "fill-opacity": 0.01 } });
        map.addLayer({ id: "saved-parcels-line", type: "line", source: "saved-parcels", paint: { "line-color": "#d99420", "line-opacity": 1, "line-width": 5 } });
        map.addLayer({
          id: "land-parcels-selected",
          type: "line",
          source: "land-parcels",
          filter: ["==", ["get", "parcelId"], ""],
          paint: { "line-color": "#111a17", "line-width": 2.5 },
        });
        map.on("click", "land-parcels-fill", (event) => {
          const parcelId = String(event.features?.[0]?.properties?.parcelId || "");
          const parcel = parcelIndexRef.current.get(parcelId);
          if (parcel) {
            setSelected(parcel);
            setDrawerCollapsed(false);
          }
        });
        map.on("mouseenter", "land-parcels-fill", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "land-parcels-fill", () => { map.getCanvas().style.cursor = ""; });
        map.on("click", "saved-parcels-fill", (event) => {
          const parcelId = String(event.features?.[0]?.properties?.parcelId || "");
          const parcel = savedIndexRef.current.get(parcelId);
          if (!parcel) return;
          setSelected(parcel);
          setDrawerCollapsed(false);
          map.fitBounds(geometryBounds(parcel), { padding: 48, maxZoom: 16, duration: 650 });
        });
        map.on("mouseenter", "saved-parcels-fill", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "saved-parcels-fill", () => { map.getCanvas().style.cursor = ""; });
        map.on("click", "county-grid-fill", (event) => {
          if (map.getZoom() >= VIEW_ZOOM_THRESHOLD || !event.features?.[0]) return;
          const coordinates = (event.features[0].geometry as GeoJSON.Polygon).coordinates[0];
          const west = Math.min(...coordinates.map((point) => point[0]));
          const east = Math.max(...coordinates.map((point) => point[0]));
          const south = Math.min(...coordinates.map((point) => point[1]));
          const north = Math.max(...coordinates.map((point) => point[1]));
          map.fitBounds([[west, south], [east, north]], { padding: 24, maxZoom: 11.5 });
        });
        setMapReady(true);
        syncViewport();
      });
      map.on("moveend", syncViewport);
    });

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const visibleParcels = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: parcels.features.filter((parcel) => {
        const review = reviews.get(parcel.properties.parcelId);
        if (savedOnly && !review?.favorite) return false;
        if (distressOnly && review?.distressStatus !== "evidence") return false;
        return true;
      }),
    };
  }, [distressOnly, parcels, reviews, savedOnly]);

  useEffect(() => {
    const index = new Map<string, ParcelFeature>();
    visibleParcels.features.forEach((feature) => index.set(feature.properties.parcelId, feature));
    parcelIndexRef.current = index;
    const decorated = {
      ...visibleParcels,
      features: visibleParcels.features.map((feature) => {
        const review = reviews.get(feature.properties.parcelId);
        return {
          ...feature,
          properties: {
            ...feature.properties,
            favorite: review?.favorite || false,
            distressStatus: review?.distressStatus || "unknown",
            listingStatus: review?.listingStatus || "unknown",
          },
        };
      }),
    };
    const source = mapRef.current?.getSource("land-parcels") as GeoJSONSource | undefined;
    source?.setData(decorated as GeoJSON.FeatureCollection);
  }, [mapReady, reviews, visibleParcels]);

  const favoriteParcels = useMemo(() => {
    const known = new Map<string, ParcelFeature>();
    [...savedParcels.features, ...parcels.features, ...(selected ? [selected] : [])].forEach((feature) => {
      const review = reviews.get(feature.properties.parcelId);
      if (review?.favorite && (!distressOnly || review.distressStatus === "evidence")) {
        known.set(feature.properties.parcelId, feature);
      }
    });
    return { type: "FeatureCollection" as const, features: [...known.values()] };
  }, [distressOnly, parcels, reviews, savedParcels, selected]);

  useEffect(() => {
    savedIndexRef.current = new Map(
      favoriteParcels.features.map((feature) => [feature.properties.parcelId, feature]),
    );
    const source = mapRef.current?.getSource("saved-parcels") as GeoJSONSource | undefined;
    source?.setData(favoriteParcels as GeoJSON.FeatureCollection);
  }, [favoriteParcels, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    map.setLayoutProperty("usgs-aerial", "visibility", aerial ? "visible" : "none");
  }, [aerial, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    ["county-grid-fill", "county-grid-line", "county-grid-label"].forEach((layer) => {
      map.setLayoutProperty(layer, "visibility", gridVisible ? "visible" : "none");
    });
  }, [gridVisible, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    map.setFilter("land-parcels-selected", ["==", ["get", "parcelId"], selected?.properties.parcelId || ""]);
  }, [mapReady, selected]);

  useEffect(() => {
    if (!viewport || viewport.zoom < VIEW_ZOOM_THRESHOLD) {
      setParcels(EMPTY_PARCELS);
      setParcelsLoaded(false);
      setViewMessage("Tap a grid area or zoom in");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoadingParcels(true);
      const params = new URLSearchParams({
        bbox: viewport.bbox.join(","),
        minAcres: String(Math.max(0, Number(minAcres) || 0)),
        maxAcres: String(Math.max(Number(minAcres) || 0, Number(maxAcres) || 100000)),
        mode,
      });
      const response = await fetch(`/api/land-finder/parcels?${params}`, { signal: controller.signal }).catch(() => null);
      if (response?.status === 422) {
        const body = (await response.json()) as { total?: number };
        setParcels(EMPTY_PARCELS);
        setParcelsLoaded(false);
        setViewMessage(`${(body.total || 0).toLocaleString()} parcels here - zoom in`);
      } else if (response?.ok) {
        const body = (await response.json()) as { parcels: ParcelFeatureCollection; total: number };
        setParcels(body.parcels);
        setParcelsLoaded(true);
        setViewMessage(`${body.total.toLocaleString()} parcels`);
      } else {
        setParcels(EMPTY_PARCELS);
        setParcelsLoaded(false);
        setViewMessage("Parcel service unavailable");
      }
      setLoadingParcels(false);
    }, 260);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [maxAcres, minAcres, mode, viewport]);

  function chooseParcel(feature: ParcelFeature) {
    setSelected(feature);
    setDrawerCollapsed(false);
    setSearchResults([]);
    const map = mapRef.current;
    if (map) map.fitBounds(geometryBounds(feature), { padding: 48, maxZoom: 16, duration: 650 });
  }

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (searchQuery.trim().length < 3 || searching) return;
    setSearching(true);
    const params = new URLSearchParams({ q: searchQuery.trim(), mode });
    const response = await fetch(`/api/land-finder/search?${params}`).catch(() => null);
    if (response?.ok) {
      const body = (await response.json()) as { parcels: ParcelFeatureCollection };
      setSearchResults(body.parcels.features);
      if (body.parcels.features.length === 1) {
        chooseParcel(body.parcels.features[0]);
      } else if (body.parcels.features.length === 0) {
        setViewMessage(`No parcel matches "${searchQuery.trim()}"`);
      }
    } else {
      setSearchResults([]);
      setViewMessage("Parcel search unavailable");
    }
    setSearching(false);
  }

  function updateReview(patch: Partial<LandFinderReviewInput>) {
    if (!selected || !draft) return;
    const next = { ...draft, ...patch, updatedBy: profile };
    setDraft(next);
    void persistReview(selected.properties.parcelId, next);
  }

  async function logout() {
    await fetch("/api/land-finder/session", { method: "DELETE" });
    window.location.reload();
  }

  function resetCountyView() {
    setSelected(null);
    setDrawerCollapsed(false);
    setSearchQuery("");
    setSearchResults([]);
    setFiltersOpen(false);
    mapRef.current?.fitBounds(
      [[SPOKANE_COUNTY_BOUNDS.west, SPOKANE_COUNTY_BOUNDS.south], [SPOKANE_COUNTY_BOUNDS.east, SPOKANE_COUNTY_BOUNDS.north]],
      { padding: 24, maxZoom: 9.2, duration: 650 },
    );
  }

  function resetFilters() {
    setMinAcres("0.5");
    setMaxAcres("");
    setMode("vacant");
    setDistressOnly(false);
    setSavedOnly(false);
  }

  function toggleFilters() {
    const nextOpen = !filtersOpen;
    setFiltersOpen(nextOpen);
    if (nextOpen && window.matchMedia("(max-width: 1220px)").matches) {
      setSelected(null);
      setDrawerCollapsed(false);
    }
  }

  const selectedId = selected?.properties.parcelId || "";
  const selectedReview = selectedId ? reviews.get(selectedId) : undefined;
  const scoutUrl = selected ? `https://cp.spokanecounty.org/scout/propertyinformation/?PID=${encodeURIComponent(selectedId)}` : "#";
  const zillowQuery = selected ? (selected.properties.address.toLowerCase().includes("unassigned") ? `${selectedId} Spokane County WA` : `${selected.properties.address} ${selected.properties.city} WA`) : "";
  const zillowUrl = `https://www.zillow.com/homes/${encodeURIComponent(zillowQuery)}_rb/`;
  const selectedLocation = selected
    ? [selected.properties.city, [selected.properties.state, selected.properties.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ")
    : "";
  const activeFilterCount = [
    minAcres !== "0.5",
    maxAcres !== "",
    mode !== "vacant",
    distressOnly,
    savedOnly,
  ].filter(Boolean).length;
  const parcelFilterLabel = [distressOnly ? "Distress" : "", savedOnly ? "Favorites" : ""].filter(Boolean).join(" + ");
  const filteredParcelCount = visibleParcels.features.length;
  const mapStatusMessage = parcelFilterLabel && parcelsLoaded && !loadingParcels
    ? `${filteredParcelCount.toLocaleString()} of ${parcels.features.length.toLocaleString()} parcels · ${parcelFilterLabel}`
    : viewMessage;
  const zeroFilterMatches = Boolean(parcelFilterLabel && parcelsLoaded && filteredParcelCount === 0);

  return (
    <div className="lf-app">
      <div ref={mapContainerRef} className="lf-map" aria-label="Spokane County parcel map" />

      <header className="lf-toolbar">
        <button className="lf-title" onClick={resetCountyView} title="Show all Spokane County" aria-label="Show all Spokane County">
          <MapIcon size={19} aria-hidden="true" />
          <span>Land Finder</span>
        </button>
        <form className="lf-search" onSubmit={search}>
          <Search size={18} aria-hidden="true" />
          <input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              if (searchResults.length) setSearchResults([]);
            }}
            placeholder="Address or APN"
            aria-label="Search by address or parcel number"
          />
          <button type="submit" aria-label="Search" title="Search" disabled={searching}>
            {searching ? <LoaderCircle size={17} className="lf-spin" /> : <Search size={17} />}
          </button>
        </form>
        <div className="lf-toolbar-actions">
          <button className={filtersOpen ? "is-active" : ""} onClick={toggleFilters} title="Filters" aria-label="Filters">
            <SlidersHorizontal size={19} />
            {activeFilterCount ? <span className="lf-filter-count">{activeFilterCount}</span> : null}
          </button>
          <button className={aerial ? "is-active" : ""} onClick={() => setAerial((value) => !value)} title={aerial ? "Street map" : "Aerial map"} aria-label={aerial ? "Use street map" : "Use aerial map"}>
            <Layers3 size={19} />
          </button>
          <button className={gridVisible ? "is-active" : ""} onClick={() => setGridVisible((value) => !value)} title="County grid" aria-label="Toggle county grid">
            <Grid3X3 size={19} />
          </button>
          <button className={savedOnly ? "is-saved" : ""} onClick={() => setSavedOnly((value) => !value)} title="Saved parcels" aria-label="Show saved parcels">
            <Heart size={19} fill={savedOnly ? "currentColor" : "none"} />
          </button>
        </div>
      </header>

      {filtersOpen ? (
        <section className="lf-filters" aria-label="Parcel filters">
          <div className="lf-filter-field">
            <label htmlFor="lf-min-acres">Min acres</label>
            <input id="lf-min-acres" inputMode="decimal" value={minAcres} onChange={(event) => setMinAcres(event.target.value)} />
          </div>
          <div className="lf-filter-field">
            <label htmlFor="lf-max-acres">Max acres</label>
            <input id="lf-max-acres" inputMode="decimal" placeholder="Any" value={maxAcres} onChange={(event) => setMaxAcres(event.target.value)} />
          </div>
          <div className="lf-filter-field lf-filter-wide">
            <label htmlFor="lf-land-mode">Land</label>
            <select id="lf-land-mode" value={mode} onChange={(event) => setMode(event.target.value as LandMode)}>
              <option value="vacant">Assessor vacant</option>
              <option value="expanded">Include farm / forest</option>
            </select>
          </div>
          <label className="lf-check"><input type="checkbox" checked={distressOnly} onChange={(event) => setDistressOnly(event.target.checked)} /> Distress only</label>
          <label className="lf-check"><input type="checkbox" checked={savedOnly} onChange={(event) => setSavedOnly(event.target.checked)} /> Favorites</label>
          <label className="lf-check lf-mobile-grid"><input type="checkbox" checked={gridVisible} onChange={(event) => setGridVisible(event.target.checked)} /> County grid</label>
          <button className="lf-reset-filters" onClick={resetFilters} disabled={!activeFilterCount} title="Reset filters"><RotateCcw size={16} /> Reset</button>
          <label className="lf-profile">
            <span>Working as</span>
            <select value={profile} onChange={(event) => setProfile(event.target.value)}>
              <option>Team</option><option>Dez</option><option>Mark</option><option>Kim</option>
            </select>
          </label>
          <button className="lf-logout" onClick={logout} title="Sign out" aria-label="Sign out"><LogOut size={18} /></button>
        </section>
      ) : null}

      {searchResults.length > 1 ? (
        <div className="lf-search-results">
          {searchResults.map((feature) => (
            <button key={feature.properties.parcelId} onClick={() => chooseParcel(feature)}>
              <span>{parcelAddress(feature)}</span>
              <small>{feature.properties.parcelId} · {feature.properties.acres.toLocaleString()} ac</small>
            </button>
          ))}
        </div>
      ) : null}

      <div className={`lf-map-status ${zeroFilterMatches ? "is-empty" : ""}`} aria-live="polite">
        {loadingParcels ? <LoaderCircle size={15} className="lf-spin" /> : null}
        {mapStatusMessage}
      </div>

      <button
        type="button"
        className={`lf-sync lf-sync-${syncState}`}
        onClick={() => { if (syncState === "auth") window.location.reload(); }}
        title={syncState === "auth" ? "Session expired. Sign in to sync saved changes." : syncState === "pending" ? "Saved on this phone; shared sync pending" : "Shared review sync"}
        aria-label={syncState === "auth" ? "Session expired. Sign in to sync." : "Shared review sync"}
      >
        {syncState === "ready" ? <Cloud size={16} /> : syncState === "saving" || syncState === "loading" ? <LoaderCircle size={16} className="lf-spin" /> : syncState === "auth" ? <LogIn size={16} /> : <CloudOff size={16} />}
        <span>{syncState === "ready" ? "Synced" : syncState === "saving" ? "Saving" : syncState === "loading" ? "Loading" : syncState === "auth" ? "Sign in to sync" : "Sync pending"}</span>
      </button>

      <div className="lf-legend" aria-label="Map legend">
        <span><i className="lf-dot lf-dot-vacant" /> Vacant</span>
        <span><i className="lf-dot lf-dot-verify" /> Verify</span>
        <span><i className="lf-dot lf-dot-distress" /> Distress</span>
        <span><i className="lf-dot lf-dot-favorite" /> Saved</span>
      </div>

      {selected && draft ? (
        <aside className={`lf-drawer ${drawerCollapsed ? "is-collapsed" : ""}`} aria-label={`Parcel ${selectedId}`}>
          <div className="lf-drawer-handle" aria-hidden="true" />
          <div className="lf-drawer-header">
            <div>
              <p className="lf-parcel-id">APN {selectedId}</p>
              <h1>{parcelAddress(selected)}</h1>
              {selectedLocation ? <p className="lf-location">{selectedLocation}</p> : null}
            </div>
            <div className="lf-drawer-header-actions">
              <button className="lf-drawer-toggle" onClick={() => setDrawerCollapsed((value) => !value)} aria-label={drawerCollapsed ? "Expand parcel details" : "Collapse parcel details"} title={drawerCollapsed ? "Expand" : "Collapse"}>
                {drawerCollapsed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              <button onClick={() => setSelected(null)} aria-label="Close parcel" title="Close"><X size={20} /></button>
            </div>
          </div>

          <div className="lf-drawer-body">
            <div className="lf-quick-actions">
            <button className={draft.favorite ? "is-favorite" : ""} onClick={() => updateReview({ favorite: !draft.favorite })}>
              <Heart size={20} fill={draft.favorite ? "currentColor" : "none"} />
              {draft.favorite ? "Saved" : "Save"}
            </button>
            <button className={draft.calledAt ? "is-done" : ""} onClick={() => updateReview({ calledAt: draft.calledAt ? null : new Date().toISOString() })}>
              <Phone size={20} />
              {draft.calledAt ? "Called" : "Mark called"}
            </button>
            <button className={draft.letterSentAt ? "is-done" : ""} onClick={() => updateReview({ letterSentAt: draft.letterSentAt ? null : new Date().toISOString() })}>
              <Mail size={20} />
              {draft.letterSentAt ? "Letter sent" : "Mark letter"}
            </button>
            </div>

            <div className="lf-facts">
            <div><span>Acres</span><strong>{selected.properties.acres.toLocaleString()}</strong></div>
            <div><span>Land value</span><strong>{formatMoney(selected.properties.landValue)}</strong></div>
            <div><span>Assessor use</span><strong>{selected.properties.useDescription}</strong></div>
            <div><span>Qualification</span><strong>{selected.properties.qualification === "confirmed_vacant" ? "Vacant" : "Verify improvements"}</strong></div>
            </div>

            <div className="lf-source-actions">
              <a href={scoutUrl} target="_blank" rel="noreferrer" title="Open official SCOUT parcel record">SCOUT <ExternalLink size={15} /></a>
              <a href={zillowUrl} target="_blank" rel="noreferrer" title="Search Zillow">Zillow <ExternalLink size={15} /></a>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(selectedId);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1200);
                }}
                title="Copy parcel number"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy APN"}
              </button>
            </div>

            <section className="lf-review-section">
            <div className="lf-review-state" role="group" aria-label="Review status">
              <button className={draft.reviewState === "unreviewed" ? "is-active" : ""} onClick={() => updateReview({ reviewState: "unreviewed" })}>New</button>
              <button className={draft.reviewState === "maybe" ? "is-active" : ""} onClick={() => updateReview({ reviewState: "maybe" })}>Maybe</button>
              <button className={draft.reviewState === "pass" ? "is-pass" : ""} onClick={() => updateReview({ reviewState: "pass" })}>Pass</button>
            </div>
            <div className="lf-verification-row">
              <label>Listing
                <select value={draft.listingStatus} onChange={(event) => updateReview({ listingStatus: event.target.value as LandFinderReviewInput["listingStatus"], listingVerifiedAt: new Date().toISOString() })}>
                  <option value="unknown">Unknown</option><option value="listed">Listed</option><option value="not_listed">Off market</option>
                </select>
              </label>
              <label>Distress
                <select value={draft.distressStatus} onChange={(event) => updateReview({ distressStatus: event.target.value as LandFinderReviewInput["distressStatus"], distressVerifiedAt: new Date().toISOString() })}>
                  <option value="unknown">Unknown</option><option value="evidence">Evidence</option><option value="none">None found</option>
                </select>
              </label>
            </div>
            <details className="lf-evidence">
              <summary>Evidence links</summary>
              <label>Listing source
                <input
                  type="url"
                  inputMode="url"
                  placeholder="https://..."
                  value={draft.listingSourceUrl || ""}
                  onChange={(event) => setDraft({ ...draft, listingSourceUrl: event.target.value || null })}
                  onBlur={(event) => updateReview({ listingSourceUrl: event.target.value.trim() || null })}
                />
              </label>
              <label>Distress source
                <input
                  type="url"
                  inputMode="url"
                  placeholder="https://..."
                  value={draft.distressSourceUrl || ""}
                  onChange={(event) => setDraft({ ...draft, distressSourceUrl: event.target.value || null })}
                  onBlur={(event) => updateReview({ distressSourceUrl: event.target.value.trim() || null })}
                />
              </label>
            </details>
            <label className="lf-notes">
              <span>Notes</span>
              <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value, updatedBy: profile })} placeholder="Access, utilities, owner contact, next step..." />
            </label>
            <div className="lf-history">
              <span><Phone size={14} /> {formatActionDate(draft.calledAt)}</span>
              <span><Mail size={14} /> {formatActionDate(draft.letterSentAt)}</span>
              {selectedReview?.updatedBy ? <span><Check size={14} /> {selectedReview.updatedBy}</span> : null}
            </div>
            </section>
            <p className="lf-source-note">Spokane County Assessor data · owners intentionally not stored</p>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
