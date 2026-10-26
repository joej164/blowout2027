# Snow Blowout 2027

Annual friends winter getaway site — Sunriver, Oregon. Static HTML/CSS/vanilla JS, no dependencies.

## Pages

- **Home** (`public/index.html`) — event overview, dates, live countdown, highlights
- **Lodging Options** (`public/lodging/index.html`) — two rental options with full details, comparison table, guest list, priorities, pending verification

Shared styles: `public/styles.css`

## Lodging options overview

| Option | Property | Approx Budget/Person |
|--------|----------|---------------------|
| 1 | Todd #1 | ~$300 |
| 2 | Sparks #5 | ~$350 |

Rough planning budgets; final costs depend on insurance, fees, and group size. See `public/lodging/index.html` for sleeping arrangements, property details, and verification items.

## Editing content

### Dates and countdown

The countdown is configured via constants at the bottom of `public/index.html`:

| Constant       | Current value                    | Purpose                          |
|----------------|----------------------------------|----------------------------------|
| `EVENT_START`  | `2027-01-14T00:00:00-08:00`     | Pacific midnight, Thu Jan 14     |
| `EVENT_END`    | `2027-01-19T00:00:00-08:00`     | End of Mon Jan 18 (checkout day) |
| `LABEL_BEFORE` | `"Until Jan 14 · Pacific time"` | Label shown above countdown      |
| `MSG_DURING`   | `"Snow Blowout is happening…"`  | Shown during the event           |
| `MSG_AFTER`    | `"Snow Blowout 2027 is a wrap…"`| Shown after checkout             |

The `<noscript>` block and `.date-banner` show dates without JavaScript.

### Lodging options

Edit `public/lodging/index.html` directly. The page uses full-width `<section class="lodging-section">` blocks instead of narrow cards. Each option is a `.lodging-option` section containing:

- **Option header** (`.option-header`) — photo placeholder + title, tagline, location, listing link
- **Two-column layout** (`.lodging-two-col`) — property details, pricing, beds on one side; sleeping arrangements on the other
- **Pros/cons** in a two-column layout
- **Status bar** (`.option-status`) — quote/booking status and pending items

To update an option: find its `<section>` and edit the budget amount in `.price-box`, stats in `.stat-grid`, sleeping allocations in `.allocation-details`, or pros/cons in `.pro-list` / `.con-list`. The planning budgets are ~$300 for Todd #1 and ~$350 for Sparks #5.

The comparison table and location map appear near the top of the page.

### Location map

The static map is `public/images/lodging-map-two-options.png`, displayed directly below At a Glance. Replace this image to update locations, preserving visible labels and OpenStreetMap attribution. House numbers are highlighted directly on the OpenStreetMap buildings, replacing the inaccurate listing-coordinate pins. Public rental references:

| Property | Source |
|----------|--------|
| Sparks #5 | [Bennington Sunriver](https://www.benningtonsunriver.com/properties/sparks-5) |
| Todd #1 | [Bennington Sunriver](https://www.benningtonsunriver.com/properties/todd-lane-1) |
| Todd #10 | [Vacasa](https://www.vacasa.com/unit/1015893) |
| Todd #11 | [Bennington Sunriver](https://www.benningtonsunriver.com/properties/todd-11) |

Map CSS is at the end of `public/styles.css`. The image includes OpenStreetMap attribution; no external map library or runtime tile requests are required.

### Photos

Replace `<span class="card-photo-label">Photo coming soon</span>` inside `.option-photo` with an `<img>` tag when photos are available.

## Local development

Serve the `public/` directory:

```bash
python3 -m http.server 8000 -d public
```

## Firebase Hosting

```bash
firebase emulators:start --only hosting   # local preview
firebase deploy --only hosting            # production (requires auth)
```
