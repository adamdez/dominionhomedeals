# Dominion Homes Twilio 10DLC Submission

Use this for the seller follow-up campaign only. Do not mix buyer/investor list texts, capital placement, private lending, debt, investment opportunity, or third-party lead generation language into this campaign.

## Brand

- Legal business name: DOMINION GROUP LLC
- Public brand name: Dominion Homes
- Website: https://www.dominionhomedeals.com
- Registered mailing address: PO Box 337, Mead, WA 99021
- Industry: REAL_ESTATE
- Privacy Policy URL: https://www.dominionhomedeals.com/privacy
- Terms and Conditions URL: https://www.dominionhomedeals.com/terms
- Opt-in evidence URL: https://www.dominionhomedeals.com/compliance/sms-consent

## Campaign Use Case

Recommended use case: LOW_VOLUME if registering as a Low-Volume Standard Brand. If Twilio requires a Standard use case, use CUSTOMER_CARE or MIXED only if the submitted sample messages match that selection.

Avoid using "lead generation" in the campaign description. This campaign is first-party follow-up with homeowners who request a property offer from Dominion Homes, operated by Dominion Group LLC.

## Campaign Description

Dominion Homes, operated by Dominion Group LLC, sends SMS only to homeowners who submit a property inquiry on dominionhomedeals.com and opt in by checking an unchecked SMS consent box. Messages are used to respond to the homeowner's inquiry, ask property follow-up questions, schedule calls or walkthroughs, provide updates about an as-is offer, and coordinate next steps. We do not use this campaign for purchased lists, cold prospecting, skip-traced owner lists, or texting people who did not opt in.

## Message Flow

End users opt in on the Dominion Homes website at https://www.dominionhomedeals.com/#get-offer. The first form screen displays this SMS program disclosure before the user clicks the cash-offer CTA:

"Optional SMS updates are available only if you check the SMS consent box in this form. By opting in, you agree to receive recurring marketing and informational texts from Dominion Homes, operated by Dominion Group LLC, about your property inquiry, including cash-offer follow-ups, appointment scheduling, and transaction status updates. Message frequency varies, up to 10 msgs/month. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not required to receive an offer."

The lead form asks for the property address, name, and phone number. Directly below the phone field, the user sees an unchecked optional SMS consent checkbox with this language:

"I agree to receive recurring marketing and informational text messages from Dominion Homes, operated by Dominion Group LLC, about my property inquiry, including cash offer follow-ups, appointment scheduling, and transaction status updates, at the phone number provided. Messages may be sent using automated technology. Consent is not required to receive an offer. Message frequency varies, up to 10 msgs/month. Message and data rates may apply. Reply STOP to opt out or HELP for help. We do not sell, rent, or share mobile information or SMS opt-in consent with third parties or affiliates for marketing or promotional purposes."

The same checkbox remains available on the final details step before submission. The form can be submitted without checking the SMS consent checkbox; in that case, the submitted phone number is not enrolled in the SMS program and no SMS consent timestamp is stored. Public evidence and screenshot: https://www.dominionhomedeals.com/compliance/sms-consent. Privacy Policy: https://www.dominionhomedeals.com/privacy. Terms and Conditions: https://www.dominionhomedeals.com/terms.

## Sample Messages

1. Dominion Homes: Thanks for reaching out about your property. I can look it over and text a few questions so we can see if an as-is offer makes sense. Reply STOP to opt out.
2. Dominion Homes: This is Adam with Dominion Homes. Are you available today or tomorrow to talk about the property you submitted? Reply HELP for help or STOP to opt out.
3. Dominion Homes: Quick update on your property inquiry: we reviewed the info and may need a walkthrough before giving a number. Reply STOP to opt out.
4. Dominion Homes: You're opted in for texts about your property inquiry. Up to 10 msgs/month. Msg&data rates may apply. Reply HELP for help, STOP to cancel.
5. Dominion Homes: You are unsubscribed and will receive no more SMS from Dominion Homes unless you opt in again. Reply HELP for help.

## Campaign Attributes

- Embedded links: false, unless the campaign will actually send links. If links are needed later, resubmit/update with `true` and include exact sample links on the Dominion domain or the actual document provider domain.
- Embedded phone numbers: false, unless the submitted samples include `509-822-5460`.
- Opt-in keywords: leave blank unless START/JOIN keyword opt-in is enabled.
- Opt-out keywords: STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT
- Help keywords: HELP, INFO
- Opt-in message: Dominion Homes: You are opted in to receive property-inquiry updates from Dominion Homes. Msg frequency varies, up to 10 msgs/month. Msg&data rates may apply. Reply STOP to opt out or HELP for help.
- Opt-out message: Dominion Homes: You are unsubscribed and will receive no further SMS messages. Reply START to resubscribe.
- Help message: Dominion Homes: For help, call 509-822-5460 or email admin@dominionhomedeals.com. Reply STOP to opt out. Msg&data rates may apply.

## Common Rejection Traps To Avoid

- Do not describe the website as a "lead-generation site" in Twilio.
- Do not include buyer/investor list, passive investor, private lending, JV, debt, or capital placement texts in this seller campaign.
- Do not submit sample messages that are generic, identical, or missing the Dominion Homes brand name.
- Do not say the form requires SMS consent. The SMS checkbox is optional and unchecked.
- Do not set embedded links to false if actual outbound messages will contain links.
