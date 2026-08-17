#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  COUNTY_FORECLOSURE_LIST_URL,
  COUNTY_FORECLOSURE_PDF_URL,
  fetchCountyForeclosureSnapshot,
  parseCountyForeclosureHtml,
  signalsFromCountyForeclosures,
} from "../src/lib/land-finder/county-foreclosures.ts";
import { fetchParcelsByIds } from "../src/lib/land-finder/gis.ts";
import { buildParcelSignalSummaries } from "../src/lib/land-finder/signals.ts";

const fixture = `
  <span><b>All Data Below Current As Of Monday, August 17, 2026</b></span>
  <table><tr>
    <td><a href="ParcelDetail.aspx?Parcel=02354.9009&amp;SiteAddress=0 W PINE SPRING RD">02354.9009</a></td>
    <td>0 W PINE SPRING RD</td><td>CHENEY</td><td>Detail</td><td>View</td><td>$12,271</td>
  </tr></table>`;

const parsedFixture = parseCountyForeclosureHtml(fixture);
assert.equal(parsedFixture.parcels.length, 1);
assert.equal(parsedFixture.parcels[0].listedAmount, 12271);
assert.equal(parsedFixture.parcels[0].parcelId, "02354.9009");
assert.equal(parsedFixture.parcels[0].detailUrl, "https://cp.spokanecounty.org/treasurer/foreclosures/ParcelDetail.aspx?Parcel=02354.9009&SiteAddress=0%20W%20PINE%20SPRING%20RD");

const snapshot = await fetchCountyForeclosureSnapshot();
const parcelIds = snapshot.parcels.map((parcel) => parcel.parcelId);
assert.equal(new Set(parcelIds).size, parcelIds.length, "The live county list contained duplicate APNs.");
assert(parcelIds.length >= 20, "The live county list count was implausibly low.");

const signals = signalsFromCountyForeclosures(snapshot);
assert.equal(signals.length, parcelIds.length);
assert(signals.every((signal) => signal.category === "county_foreclosure"));
assert(signals.every((signal) => signal.confidence === "high" && signal.status === "active"));
assert(signals.every((signal) => signal.sources.some((source) => source.url === COUNTY_FORECLOSURE_PDF_URL)));

const summaries = buildParcelSignalSummaries([], new Date(), signals);
assert.equal(summaries.length, parcelIds.length);
assert(summaries.every((summary) => summary.qualification === "verified"));

const geometry = await fetchParcelsByIds(parcelIds);
const mappedIds = new Set(geometry.features.map((feature) => feature.properties.parcelId));
const missingGeometry = parcelIds.filter((parcelId) => !mappedIds.has(parcelId));
assert.equal(missingGeometry.length, 0, `SCOUT geometry was missing for: ${missingGeometry.join(", ")}`);

console.log(JSON.stringify({
  result: "PASS",
  source: COUNTY_FORECLOSURE_LIST_URL,
  listCurrentAsOf: snapshot.asOf,
  uniqueForeclosureParcels: parcelIds.length,
  verifiedSignalSummaries: summaries.length,
  mappedParcelGeometries: geometry.features.length,
  missingGeometries: missingGeometry,
  officialDetailLinks: snapshot.parcels.filter((parcel) => parcel.detailUrl.startsWith(COUNTY_FORECLOSURE_LIST_URL)).length,
  filedPdfLinks: signals.filter((signal) => signal.sources.some((source) => source.url === COUNTY_FORECLOSURE_PDF_URL)).length,
}, null, 2));
