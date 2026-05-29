# Dominion Homes Twilio 10DLC Submission

Use this for the seller follow-up campaign only. Do not mix buyer/investor list texts, capital placement, private lending, debt, investment opportunity, or third-party lead generation language into this campaign.

## Brand

- Legal business name: Dominion Homes, LLC
- Public brand name: Dominion Homes
- Website: https://www.dominionhomedeals.com
- Registered mailing address: PO Box 337, Mead, WA 99021
- Industry: REAL_ESTATE
- Privacy Policy URL: https://www.dominionhomedeals.com/privacy
- Terms and Conditions URL: https://www.dominionhomedeals.com/terms
- Opt-in evidence URL: https://www.dominionhomedeals.com/compliance/sms-consent

## Campaign Use Case

Recommended use case: LOW_VOLUME if registering as a Low-Volume Standard Brand. If Twilio requires a Standard use case, use CUSTOMER_CARE or MIXED only if the submitted sample messages match that selection.

Avoid using "lead generation" in the campaign description. This campaign is first-party follow-up with homeowners who request a property offer from Dominion Homes, LLC.

## Campaign Description

Dominion Homes, LLC sends SMS messages to homeowners or authorized property contacts who request a cash offer through dominionhomedeals.com and explicitly opt in by checking the optional SMS consent checkbox. Messages are used to answer questions about the property inquiry, coordinate a call or property review, provide cash-offer follow-up, schedule appointments, and share transaction status updates for the seller's own property. Recipients are not purchased leads and are not contacted on behalf of third parties. This campaign does not send buyer/investor opportunity messages, lending offers, debt relief, political content, sweepstakes, or third-party lead generation.

## Message Flow

End users opt in on the Dominion Homes website at https://www.dominionhomedeals.com/#get-offer. The first form screen displays this SMS program disclosure before the user clicks the cash-offer CTA:

"Optional SMS updates are available only if you check the SMS consent box in this form. By opting in, you agree to receive recurring marketing and informational texts from Dominion Homes, LLC about your property inquiry, including cash-offer follow-ups, appointment scheduling, and transaction status updates. Message frequency varies, up to 10 msgs/month. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not required to receive an offer."

The lead form asks for the property address, name, and phone number. Directly below the phone field, the user sees an unchecked optional SMS consent checkbox with this language:

"I agree to receive recurring marketing and informational text messages from Dominion Homes, LLC about my property inquiry, including cash offer follow-ups, appointment scheduling, and transaction status updates, at the phone number provided. Messages may be sent using automated technology. Consent is not required to receive an offer. Message frequency varies, up to 10 msgs/month. Message and data rates may apply. Reply STOP to opt out or HELP for help. We do not sell, rent, or share mobile information or SMS opt-in consent with third parties or affiliates for marketing or promotional purposes."

The same checkbox remains available on the final details step before submission. The form can be submitted without checking the SMS consent checkbox; in that case, the submitted phone number is not enrolled in the SMS program and no SMS consent timestamp is stored. Public evidence and screenshot: https://www.dominionhomedeals.com/compliance/sms-consent. Privacy Policy: https://www.dominionhomedeals.com/privacy. Terms and Conditions: https://www.dominionhomedeals.com/terms.

## Sample Messages

1. Dominion Homes: Hi [First Name], thanks for requesting a cash offer for [Property Address]. We are reviewing the details and will follow up soon. Reply STOP to opt out.
2. Dominion Homes: We can talk through [Property Address] [today/tomorrow] at [time]. Does that work for you? Reply STOP to opt out.
3. Dominion Homes: Your property review for [Property Address] is scheduled for [date] at [time]. Questions? Call 509-666-9518. Reply STOP to opt out.
4. Dominion Homes: Quick update on [Property Address]: we are checking title and property details before sending next steps. Reply STOP to opt out.
5. Dominion Homes: Thanks for speaking with us about [Property Address]. We will send the next status update after [next step]. Reply STOP to opt out.

## Campaign Attributes

- Embedded links: false, unless the campaign will actually send links. If links are needed later, resubmit/update with `true` and include exact sample links on the Dominion domain or the actual document provider domain.
- Embedded phone numbers: true, because at least one sample includes 509-666-9518.
- Opt-in keywords: leave blank unless START/JOIN keyword opt-in is enabled.
- Opt-out keywords: STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT
- Help keywords: HELP, INFO
- Opt-in message: Dominion Homes: You are opted in to receive property-inquiry updates from Dominion Homes. Msg frequency varies, up to 10 msgs/month. Msg&data rates may apply. Reply STOP to opt out or HELP for help.
- Opt-out message: Dominion Homes: You are unsubscribed and will receive no further SMS messages. Reply START to resubscribe.
- Help message: Dominion Homes: Reply STOP to opt out. For help, call 509-666-9518 or email leads@dominionhomedeals.com. Msg&data rates may apply.

## Common Rejection Traps To Avoid

- Do not describe the website as a "lead-generation site" in Twilio.
- Do not include buyer/investor list, passive investor, private lending, JV, debt, or capital placement texts in this seller campaign.
- Do not submit sample messages that are generic, identical, or missing the Dominion Homes brand name.
- Do not say the form requires SMS consent. The SMS checkbox is optional and unchecked.
- Do not set embedded links to false if actual outbound messages will contain links.
