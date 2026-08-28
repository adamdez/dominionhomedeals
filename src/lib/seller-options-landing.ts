export type SellerOptionsSearchParams = Record<string, string | string[] | undefined>;

type Priority = { title: string; copy: string };

export interface SellerOptionsLanding {
  key: string;
  lane: "urgent" | "options" | "general";
  headline: string;
  introduction: string;
  focusTitle: string;
  focusCopy: string;
  formIntro: string;
  actionLabel: string;
  stickyLabel: string;
  prioritiesHeading: string;
  priorities: readonly Priority[];
  pathOrder: readonly number[];
}

const GENERAL: SellerOptionsLanding = {
  key: "general",
  lane: "general",
  headline: "Need help deciding how to sell?",
  introduction: "Maybe you need to sell soon. Maybe you're trying to work out what would leave you better off. Tell us about the house and what's making the decision hard. We help homeowners in Spokane and the Coeur d'Alene area understand the choices.",
  focusTitle: "Start with what matters to you",
  focusCopy: "Your house, timing, costs, and next move all matter. A direct offer is one option—not the only option.",
  formIntro: "Start with the address. We'll talk about what matters to you.",
  actionLabel: "Review My Options",
  stickyLabel: "Review Options",
  prioritiesHeading: "What would make this a good move for you?",
  priorities: [],
  pathOrder: [0, 1, 2, 3],
};

const AD_LANDINGS: Record<string, SellerOptionsLanding> = {
  urgent_fast_sale: {
    key: "urgent_fast_sale",
    lane: "urgent",
    headline: "Need to sell soon?",
    introduction: "Tell us about your house and the date you're working toward. Our Spokane–Coeur d'Alene home-buying team can discuss an as-is offer and whether a realistic closing plan could fit your timing.",
    focusTitle: "Let's start with your deadline",
    focusCopy: "You don't have to fix the house before we talk. We'll explain what needs checking, what could affect closing, and whether another selling path may fit better.",
    formIntro: "Start with the address. Tell us when you need to sell.",
    actionLabel: "Talk About My Timeline",
    stickyLabel: "Talk Timing",
    prioritiesHeading: "A clear plan for the time you have",
    priorities: [
      { title: "The date that matters", copy: "Tell us the deadline and what needs to happen by then. We'll separate your target date from what can actually be agreed." },
      { title: "The house as it is", copy: "Discuss repairs, belongings, access, and who needs to be involved—before you take on work just to sell." },
      { title: "The terms behind the offer", copy: "Know the buyer, price, costs, title requirements, and closing conditions before relying on a plan. A closing date is never guaranteed just by contacting us." },
    ],
    pathOrder: [2, 0, 1, 3],
  },
  urgent_timeline: {
    key: "urgent_timeline",
    lane: "urgent",
    headline: "Sell without repairing first?",
    introduction: "If repairs, cleanup, and a deadline are colliding, you can explore selling as-is before taking on a project. Talk with our Spokane–Coeur d'Alene home-buying team about an as-is offer and the alternatives.",
    focusTitle: "Weigh the work before you spend",
    focusCopy: "An agent can list a house as-is too. Let's compare the likely price, repairs, fees, time, and uncertainty of each path—not assume a direct offer is always better.",
    formIntro: "Start with the address. Tell us about the repairs and your timing.",
    actionLabel: "Discuss Selling As-Is",
    stickyLabel: "Sell As-Is",
    prioritiesHeading: "Compare the sale—not just the repair bill",
    priorities: [
      { title: "What work is really needed?", copy: "Describe the condition as best you can. You don't need a contractor's estimate before starting a conversation." },
      { title: "Would repairs leave you better off?", copy: "Compare the possible price increase with the cost, time, bills, and risk of doing the work. Estimates still need checking." },
      { title: "What can fit your deadline?", copy: "Discuss a direct as-is offer alongside listing as-is. Get any agreement about cleanup, belongings, and timing in writing." },
    ],
    pathOrder: [2, 0, 1, 3],
  },
  options_net_tradeoffs: {
    key: "options_net_tradeoffs",
    lane: "options",
    headline: "Compare ways to sell your house",
    introduction: "The highest sale price doesn't always leave you with the most after costs. Compare listing as-is, repairing and listing, and an as-is offer from our Spokane–Coeur d'Alene team—with the time and tradeoffs included.",
    focusTitle: "What could you actually keep?",
    focusCopy: "Look at repair costs, agent fees, closing costs, bills while you wait, and amounts owed. You don't need to want a cash offer before we can have a useful conversation.",
    formIntro: "Start with the address. We'll compare realistic paths for your house.",
    actionLabel: "Compare My Selling Options",
    stickyLabel: "Compare Options",
    prioritiesHeading: "Compare the numbers on the same basis",
    priorities: [
      { title: "Separate price from proceeds", copy: "A sale price is the starting point. Subtract your costs and payoffs to estimate what you could keep with each option." },
      { title: "Include time and uncertainty", copy: "Repairs, showings, financing, and a delayed closing can change the outcome. Decide which tradeoffs you are comfortable taking on." },
      { title: "Question the assumptions", copy: "Ask how an offer or estimate was worked out. Listing with an agent may be the better choice; an offer from us is not an independent valuation." },
    ],
    pathOrder: [0, 1, 2, 3],
  },
  options_real_problem: {
    key: "options_real_problem",
    lane: "options",
    headline: "Need help deciding how to sell?",
    introduction: "An inherited house, costly repairs, a move, or family decisions can make selling feel complicated. Start with what's making it hard. Our Spokane–Coeur d'Alene team will talk through realistic options, not assume you already want a cash offer.",
    focusTitle: "Start with the problem—not an offer",
    focusCopy: "Tell us what needs to be different after the sale. We'll discuss where a direct offer could help, where another path may fit, and which questions need a licensed professional.",
    formIntro: "Start with the address. Tell us what's making the decision hard.",
    actionLabel: "Talk Through My Situation",
    stickyLabel: "Talk It Through",
    prioritiesHeading: "A next step that fits your situation",
    priorities: [
      { title: "What is getting in the way?", copy: "Repairs, belongings, tenants, paperwork, or family decisions may matter more than the sale itself. Begin with the issue you want to solve." },
      { title: "Who needs to be involved?", copy: "Tell us your role with the property and who else has a say. We can discuss next steps without assuming the house is ready to transfer." },
      { title: "Which path solves the problem?", copy: "Compare listing, an as-is offer, or different terms where appropriate. Special arrangements depend on the details; nothing is guaranteed." },
    ],
    pathOrder: [0, 1, 2, 3],
  },
};

function singleValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/** Only fixed public copy is selected; arbitrary URL text is never rendered. */
export function getSellerOptionsLanding(params: SellerOptionsSearchParams): SellerOptionsLanding {
  const content = singleValue(params.utm_content);
  if (Object.prototype.hasOwnProperty.call(AD_LANDINGS, content)) return AD_LANDINGS[content];
  const lane = singleValue(params.utm_term);
  if (lane === "urgent") return AD_LANDINGS.urgent_fast_sale;
  if (lane === "options") return AD_LANDINGS.options_real_problem;
  return GENERAL;
}
