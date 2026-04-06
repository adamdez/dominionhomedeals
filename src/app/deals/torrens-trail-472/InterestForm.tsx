'use client'

import { DealInterestForm } from '@/components/off-market/DealInterestForm'

export function InterestForm() {
  return (
    <DealInterestForm
      address="472 Torrens Trail"
      city="Spirit Lake"
      state="ID"
      zip="83869"
      landingPage="/deals/torrens-trail-472"
      source="deal-page-torrens-trail"
      propertyLabel="472 Torrens Trail"
      submitLabel="Request more info"
      variant="default"
    />
  )
}
