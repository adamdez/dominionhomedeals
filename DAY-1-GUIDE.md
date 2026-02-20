# DOMINION HOMES — Day 1 Build Guide
## The Honest Version — Built on What's True

---

## WHAT CHANGED FROM THE FIRST BUILD

Based on your answers, I rebuilt everything:

- **Removed ALL Gold EMD claims** — we'll add it when you have capital
- **Removed inflated stats** ("150+ homes purchased" → honest stats)
- **Rewrote all copy** — positioned as "local team" not "market dominator"
- **New color palette** — warm forest green + stone + amber instead of corporate gold/navy
- **Real team bios** — Adam, Nathan, Logan with honest backgrounds
- **Real testimonials** — framed honestly (2 reviews, not a carousel of 10)
- **Honest footer disclosures** — "we are principals, not agents/brokers"
- **WFG Title mentioned** — builds trust with local recognition

## WHAT YOU HAVE (17 production files)

1. `src/app/layout.tsx` — Root layout with fonts, SEO, LocalBusiness schema
2. `src/app/page.tsx` — Full home page with 7 sections
3. `src/app/globals.css` — Design system (forest/stone/amber theme)
4. `src/app/api/leads/route.ts` — Lead API → Sentinel + TCPA logging
5. `src/components/forms/LeadForm.tsx` — 3-step progressive form
6. `src/components/layout/Header.tsx` — Sticky nav with mobile menu
7. `src/components/layout/Footer.tsx` — Honest disclosures
8. `src/components/sections/Testimonials.tsx` — 2 real reviews
9. `src/components/sections/Situations.tsx` — "Any situation" grid
10. `src/components/animations/FadeIn.tsx` — Scroll animations
11. `src/lib/constants.ts` — All copy, team data, neighborhoods
12. `src/lib/utils.ts` — Utilities
13. `src/lib/sentinel.ts` — CRM client
14. `src/types/index.ts` — TypeScript interfaces
15. `middleware.ts` — Edge audit logging
16. Config files — tailwind, next, tsconfig, postcss, package.json

---

## STEP-BY-STEP: Get This Running

### Prerequisites
You need Node.js installed. If you don't have it:
1. Go to https://nodejs.org
2. Download the LTS version (the green button)
3. Install it (just click Next through everything)
4. Restart VS Code after installing

### Step 1: Open VS Code and open the terminal
Press `Ctrl + ~` (the backtick key, left of the 1 key)

### Step 2: Navigate to where you want the project
```bash
cd Desktop
```
(or wherever you want it)

### Step 3: Create and enter the project folder
```bash
mkdir dominion-homes
cd dominion-homes
```

### Step 4: Initialize git
```bash
git init
```

### Step 5: Create ALL folders at once
Copy this entire block and paste it:
```bash
mkdir -p src/app/api/leads src/app/how-we-work src/app/about src/app/neighborhoods src/components/ui src/components/sections src/components/forms src/components/layout src/components/animations src/lib src/types src/hooks public/images/team public/fonts public/icons
```

### Step 6: Create each file
For each file listed above, do this in VS Code:
1. In the left sidebar (Explorer), right-click the appropriate folder
2. Click "New File"
3. Name it exactly as shown
4. Paste the code I provided

**CREATE IN THIS ORDER** (to avoid import errors):
1. `package.json` (in root — the dominion-homes folder)
2. `tsconfig.json` (root)
3. `next.config.ts` (root)
4. `tailwind.config.ts` (root)
5. `postcss.config.js` (root)
6. `.gitignore` (root)
7. `.env.local` (root)
8. `middleware.ts` (root)
9. `src/types/index.ts`
10. `src/lib/utils.ts`
11. `src/lib/constants.ts` — **UPDATE THE PHONE NUMBER AND EMAIL**
12. `src/lib/sentinel.ts`
13. `src/app/globals.css`
14. `src/components/animations/FadeIn.tsx`
15. `src/components/layout/Header.tsx`
16. `src/components/layout/Footer.tsx`
17. `src/components/forms/LeadForm.tsx`
18. `src/components/sections/Testimonials.tsx`
19. `src/components/sections/Situations.tsx`
20. `src/app/layout.tsx`
21. `src/app/api/leads/route.ts`
22. `src/app/page.tsx` (LAST — it imports from everything above)

### Step 7: Install dependencies
```bash
npm install
```
Wait for it to finish (1-2 minutes).

### Step 8: Run the dev server
```bash
npm run dev
```

### Step 9: Open browser
Go to http://localhost:3000

---

## THINGS TO UPDATE WITH YOUR REAL INFO

In `src/lib/constants.ts`, find and replace:
- `(509) 555-0123` → your real phone number
- `offers@dominionhomedeals.com` → your real email

In `src/components/sections/Testimonials.tsx`:
- Replace the placeholder testimonial quotes with your 2 real ones
- Update the names (use first name + last initial for privacy)

---

## IF SOMETHING BREAKS

**"Module not found" error:**
```bash
rm -rf node_modules .next
npm install
npm run dev
```

**Red underlines in VS Code:**
Press `Ctrl+Shift+P` → type "TypeScript: Restart TS Server" → Enter

**Blank page:**
Check the terminal for error messages. Screenshot them and send to me.

---

## WHAT'S NEXT

When this is running on localhost, tell me and we move to:
- **Day 1, Task 2:** /how-we-work page, /about page with full team bios
- **Day 1, Task 3:** Upload your logo + team photos, integrate them
- **Day 2:** Neighborhood pages (SEO engine)
- **Day 3:** Deploy to Vercel (go live)

Upload your logo file whenever you're ready and I'll integrate it.
