This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Annual Festival Maintenance

> **Scope**: Update ONE file only — `src/config/festival.ts`.
> No UI components, pages, or layouts need editing when the year changes.

### When to update (typically August–September each year)

Once the committee has confirmed the tithi-aligned Puja dates for the new year:

1. **Open `src/config/festival.ts`**

2. **Update `year`**
   ```ts
   year: 2027,          // ← new year
   ```

3. **Update `countdownTarget`** — the exact datetime when the countdown reaches zero.
   This is typically Mahasaptami morning (confirm local timing with club):
   ```ts
   countdownTarget: '2027-10-01T06:00:00',  // ← Mahasaptami, local time
   ```

4. **Update `festivalEnd`** — after this datetime the site shows the post-festival state:
   ```ts
   festivalEnd: '2027-10-04T23:59:59',      // ← night of Vijaya Dashami
   ```

5. **Update each day's `date`** — Shatadal's club-specific schedule (not generic calendar):
   ```ts
   { key: 'mahasaptami',   date: '2027-10-01', ... },
   { key: 'mahashtami',    date: '2027-10-02', ... },
   { key: 'mahanavami',    date: '2027-10-03', ... },
   { key: 'vijaya_dashami',date: '2027-10-04', ... },
   ```

6. **Optionally update `description`, `highlight`, and `rituals`** per day if
   the club is adding or removing specific rituals for that year.

### Verify after updating

```bash
npx tsc --noEmit       # 0 errors
npm run build          # clean build
npm run dev            # check homepage countdown, dates, puja schedule page
```

Confirm in the browser:
- Countdown section shows correct year and dates
- Puja schedule page shows all four days with correct dates
- Hero shows correct start–end date range
- Contact page shows correct visit dates
- No "2025" or stale year values visible anywhere

### What is NOT in festival.ts

Club identity (name, location, contact, social links, branding) lives in
`src/config/site.ts` and does not change year to year.

### Architecture note

`festival.ts` → imported by components/pages as needed.  
If this ever moves to a CMS or API, replace only the `export const festivalConfig`
line with a server-side fetch — no UI component edits required.
