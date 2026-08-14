#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  buildParcelSignalSummaries,
  signalsFromLazarusLead,
  summaryMatchesSignalFilters,
  summaryQualifiesAsDistress,
} from "../src/lib/land-finder/signals.ts";

const NOW = new Date("2026-08-14T12:00:00Z");

function lead(id, tags, sourceDetails, overrides = {}) {
  return {
    id,
    tags,
    source_details: {
      sourceLabel: `Fixture ${id}`,
      sourceType: "Fixture",
      ...sourceDetails,
    },
    status: "new",
    created_at: "2026-08-01T12:00:00Z",
    last_touched_at: "2026-08-10T12:00:00Z",
    ...overrides,
  };
}

const tax = lead("tax-1", ["urgent_tax"], {
  parcelId: "25001.0001",
  sourceType: "Tax Delinquent",
  taxDistressStatus: "urgent_tax",
  urgentTaxCurrentBalanceTotal: "8430",
  urgentTaxCurrentYearsOwing: JSON.stringify([{ year: 2022 }, { year: 2023 }, { year: 2024 }]),
  urgentTaxOldestPositiveYear: "2022",
  urgentTaxVerifiedAt: "2026-08-10T12:00:00Z",
  urgentTaxVerificationUrl: "https://cp.spokanecounty.org/scout/tax/25001.0001",
  ownerFullName: "Private Owner Must Not Leak",
});

const taxDuplicate = lead("tax-2", ["tax"], {
  parcelId: "25001.0001",
  sourceType: "Tax Delinquent Skip Genie",
  taxDistressStatus: "tax",
  amountDue: "8200",
  taxDeadlineVerifiedAt: "2026-07-20T12:00:00Z",
  scoutUrl: "https://cp.spokanecounty.org/scout/propertyinformation/?PID=25001.0001",
});

const probate = lead("probate-1", ["probate"], {
  parcelId: "25001.0001",
  sourceType: "Probate - Qualified PR Prospect",
  probateQualificationStatus: "qualified",
  propertyMatchConfidence: "high",
  authorityConfidence: "high",
  personalRepresentative: "Private Representative Must Not Leak",
  probateCaseNumber: "26-4-00001-32",
  courtPrDocumentFileDate: "2026-08-03",
  courtPrDocumentUrl: "https://cp.spokanecounty.org/courtdocumentviewer/example",
});

const discontinuedForeclosure = lead("foreclosure-closed", ["pre_foreclosure"], {
  parcelId: "25002.0002",
  sourceType: "Pre-Foreclosure",
  foreclosureClassification: "DISCONTINUED_TRUSTEE_SALE",
  foreclosureStatus: "DISCONTINUED",
  foreclosureStatusCheckedAt: "2026-08-11",
  recorderDetailUrl: "https://recording.spokanecounty.org/example",
});

const bankruptcyForeclosure = lead("bankruptcy-1", ["pre_foreclosure"], {
  parcelId: "25003.0003",
  sourceType: "Pre-Foreclosure",
  foreclosureClassification: "ACTIVE_TRUSTEE_SALE_REVIEW",
  foreclosureLatestSignalDate: "2026-08-05",
  publicRecordCheckedAt: "2026-08-12",
  recorderDetailUrl: "https://recording.spokanecounty.org/foreclosure",
  bankruptcyCaseNumber: "26-00001-13",
  bankruptcyChapter: "13",
  bankruptcyEventDate: "2026-08-07",
  bankruptcyEventName: "Motion for relief from stay concerning real property",
  bankruptcyHistoryStatus: "PUBLIC_RSS_OWNER_MATCHED",
  bankruptcyCaseUrl: "https://ecf.waeb.uscourts.gov/example",
});

const enforcement = lead("enforcement-1", ["early_distress"], {
  parcelId: "25004.0004",
  sourceType: "Early Distress",
  primarySignal: "Upcoming substandard and unfit house hearing",
  propertyMatchConfidence: "HIGH",
  checkedAt: "2026-08-09",
  primarySourceUrl: "https://my.spokanecity.org/hearings/example",
});

const driveBy = lead("driveby-1", [], {
  parcelId: "25005.0005",
  sourceType: "Drive-by",
  driveByTags: ["vacant", "boarded", "fire_damage"],
  driveByCapturedAt: "2026-08-13T17:00:00Z",
  driveByGoogleMapsUrl: "https://maps.google.com/?q=47,-117",
});

const vendorBankruptcyOnly = lead("vendor-1", ["tax"], {
  parcelId: "25006.0006",
  sourceType: "Tax Delinquent Skip Genie",
  taxDistressStatus: "tax",
  urgentTaxVerifiedAt: "2026-08-01",
  skipgenieBankruptcies: "1",
});

const summaries = buildParcelSignalSummaries([
  tax,
  taxDuplicate,
  probate,
  discontinuedForeclosure,
  bankruptcyForeclosure,
  enforcement,
  driveBy,
  vendorBankruptcyOnly,
], NOW);

const taxProbateSummary = summaries.find((summary) => summary.parcelId === "25001.0001");
assert(taxProbateSummary, "Tax/probate parcel summary was not created.");
assert.equal(taxProbateSummary.qualification, "verified");
assert.deepEqual(taxProbateSummary.categories, ["tax", "probate"]);
assert.equal(taxProbateSummary.signals.filter((signal) => signal.category === "tax").length, 1, "Duplicate tax rows were not collapsed.");
assert.equal(
  taxProbateSummary.signals.find((signal) => signal.category === "tax")?.facts.find((fact) => fact.label === "Years owing")?.value,
  "2022, 2023, 2024",
  "Tax years were not normalized for compact display.",
);
assert.equal(taxProbateSummary.activeSignalCount, 2);
assert(summaryQualifiesAsDistress(taxProbateSummary));
assert(summaryMatchesSignalFilters(taxProbateSummary, { categories: ["tax"], verifiedOnly: true, multiSignalOnly: true }));
assert(!summaryMatchesSignalFilters(taxProbateSummary, { categories: ["foreclosure"], verifiedOnly: false, multiSignalOnly: false }));

const closedSummary = summaries.find((summary) => summary.parcelId === "25002.0002");
assert(closedSummary, "Resolved foreclosure summary was not retained.");
assert.equal(closedSummary.signals[0].status, "resolved");
assert.equal(closedSummary.qualification, "none");
assert(!summaryQualifiesAsDistress(closedSummary));

const bankruptcySummary = summaries.find((summary) => summary.parcelId === "25003.0003");
assert(bankruptcySummary, "Bankruptcy/foreclosure summary was not created.");
assert.deepEqual(bankruptcySummary.categories, ["foreclosure", "bankruptcy"]);
assert.equal(bankruptcySummary.activeSignalCount, 2);

const enforcementSignals = signalsFromLazarusLead(enforcement, NOW);
assert.equal(enforcementSignals[0]?.category, "enforcement");
assert.equal(enforcementSignals[0]?.confidence, "high");

const driveBySummary = summaries.find((summary) => summary.parcelId === "25005.0005");
assert(driveBySummary, "Drive-by condition summary was not created.");
assert.equal(driveBySummary.qualification, "candidate");
assert.match(driveBySummary.signals[0].summary, /vacant, boarded, fire damage/i);

const vendorSignals = signalsFromLazarusLead(vendorBankruptcyOnly, NOW);
assert(!vendorSignals.some((signal) => signal.category === "bankruptcy"), "Unverified vendor bankruptcy count became a property-linked signal.");

assert(summaryMatchesSignalFilters(undefined, {
  categories: [],
  verifiedOnly: false,
  multiSignalOnly: false,
  manualEvidence: true,
}), "Manual evidence did not remain a qualifying override.");

const serialized = JSON.stringify(summaries);
assert(!serialized.includes("Private Owner Must Not Leak"), "Owner PII leaked into signal output.");
assert(!serialized.includes("Private Representative Must Not Leak"), "Representative PII leaked into signal output.");

console.log(JSON.stringify({
  result: "PASS",
  fixtureLeads: 8,
  parcelSummaries: summaries.length,
  verifiedTaxProbateSignals: taxProbateSummary.activeSignalCount,
  bankruptcyForeclosureSignals: bankruptcySummary.activeSignalCount,
  resolvedForeclosureExcluded: !summaryQualifiesAsDistress(closedSummary),
  piiExcluded: true,
}, null, 2));
