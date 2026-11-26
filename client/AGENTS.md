# Client: notes for agents

How the live page works: [docs/live-auction.md](docs/live-auction.md).

## Where code goes

```
src/
  main.tsx, router.tsx, index.css
  components/          shared UI: AppLayout, Spinner, EmptyState, ErrorState, NotFound
  hooks/               generic hooks (useNow)
  lib/                 config, price, socket, time, token
  i18n/                all user-facing text
  mock/                fake data for local UI work
  features/auctions/
    api.ts, useLiveAuction.ts, useCountdown.ts, StatusBadge.tsx   used by several screens
    list/              /auctions
    create/            /auctions/new
    room/              /auctions/:id        watch and bid
    live/              /auctions/:id/live   big screen, no header
```

- Used by one screen: put it in that screen's folder.
- Used by two or more screens: put it in `features/auctions/`.
- Not about auctions at all: `components/`, `hooks/` or `lib/`.

## Imports

- Always `@/...` for app code and `@shared/...` for the contract. Never `./` or `../`.
- Order: packages, then `@shared`, then `@/`, then the CSS import. A blank line between groups, A–Z inside each.
- Screens don't import from each other.
- `features/auctions/*.ts(x)` doesn't import from a screen folder.
- `components`, `hooks` and `lib` don't import from `features`.
- Load `mock/` only with a dynamic `import()`, behind an `import.meta.env.DEV` check. A static import ships fake data to production.

## Code style

- Text shown to users goes in `i18n/en.ts` and is read with `t()`.
- Prices are integer cents. Use `lib/price.ts` to format and parse.
- Countdowns add `clockOffsetMs` (server clock minus device clock) to the current time.
- Call the value `auction`; `AuctionSnapshot` is its type.
- Name files after their contents. No `helpers.ts`, `utils.ts` or `index.ts` barrels (`i18n/index.ts` is the exception).
- No comments. Make names and small functions say it instead.
- No `void` on promises. Call the function, or pass it directly.
- Plain code first. Extract on the second or third real use.
- Name callback arguments after what they hold: `filter`, `auction`, `bid`, `event`, `result`, `error`. No one-letter names.
- Keep types simple: name a union once (`BidFailure`) instead of deriving it with `Extract<>` or `Foo["bar"]`.
- Components are `PascalCase.tsx`; hooks and modules are `camelCase.ts`.
- A file with one component or hook declares it as a plain `function` and ends with `export default Name;`. A file with several things (`api.ts`, `lib/*`) uses named exports. Types next to a default export stay named, like in `useLiveAuction.ts`.
- 2 spaces, single quotes, semicolons in `src/`.

## Components and conditions

- Pages handle loading, error and not found with early returns, one line each: `Spinner`, `ErrorState` and `NotFound` from `components/`.
- Different UI per auction status or per kind of user goes in its own component with early returns, like `room/BidPanel.tsx`.
- A piece used once that is only a few lines of markup stays inline. Don't give it its own file.
- The parent decides whether a child appears. Children don't return `null` to hide themselves; a panel that picks between states, like `BidPanel`, may.
- Inline is fine for one small element, a class or a word.
- Forms read their values on submit with `new FormData(form)` and disable everything with one `<fieldset disabled>`. See `create/CreateAuctionForm.tsx`.
- Split when a condition repeats or the piece has its own state, not because a file is long.
- To reset a component's state when something changes, give it a `key` (the list page does `<AuctionGrid key={active.key} status={active.status} />`). Don't write reset logic in hooks.
- Don't render the same stateful component from two branches. It remounts and loses what the user typed.
- Error text keys are named after the error code, so the text is ``t(`bid.error.${code}`)``. No mapping functions.

## Before you finish

```bash
npm run build
npm run lint
```

Both must pass (`npm run check` from the repo root also runs the server type check). There are no client tests, so also open the page you changed.

With `VITE_SOCKET_URL` empty, the app runs on `mock/`. To bid as the mock user, open an auction page with `?token=e30.eyJzdWIiOiJtZSJ9.mock` (see [README.md](README.md)).
