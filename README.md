# Snow Blowout 2027

Static public event site with encrypted private pages. Native Node 24+ and browser Web Crypto; no dependencies, accounts, or backend.

## Privacy boundary

Any page containing sensitive information belongs in encrypted content. The event home page is public. Lodging HTML, names, assignments, booking details, access codes and map image are local files in ignored `private/`, outside the Hosting output. Never add sensitive information to `public/` or public metadata.

Edit `private/lodging.html` and `private/lodging-map.png`. **Back up these ignored source files separately**; a fresh Git clone deliberately does not contain them.

## Build, preview and deploy

Run `npm run build`. Enter the shared password at the hidden prompt and confirm it. Rebuilding with a different password changes the password for all protected content. There is no stored password to edit. Do not put passwords in command arguments, shell history, environment variables, source, or Git. Automation may supply a password through stdin from a secure local mechanism; no password is saved by the builder.

```sh
npm test
npm run build
npm run check
python3 -m http.server 8000 --bind 127.0.0.1 -d dist
# Only after reviewing and authorizing publication:
firebase deploy --only hosting --project blowout2027
```

Firebase publishes **only `dist/`**. Its predeploy guard rejects missing, stale, modified, unexpected or plaintext output. A failed or cancelled build removes the deployable output. Do not manually copy private files into `dist/` or bypass the guard. Build sources, configuration, private content and outputs are hashed in the ignored local `.build-manifest.json`.

## Encryption and unlocking

The bundle contains private HTML and actual image bytes, encrypted together with AES-256-GCM. PBKDF2-SHA-256 uses 600,000 iterations, a fresh random 16-byte salt and a fresh 12-byte IV every build. Metadata contains only the format, salt, iteration count, IV and ciphertext. Image filenames and MIME data are inside the encrypted bundle.

The browser derives a nonextractable key locally, renders only after authenticated decryption, and uses temporary Blob URLs for images. The password never leaves the browser. The key and decrypted bundle stay in memory only: no localStorage, sessionStorage, IndexedDB or cookies. Navigation within the same tab retains the unlock; refresh, Lock and page teardown clear it. Lock invalidates pending unlock attempts and revokes image URLs. JavaScript cannot guarantee physical zeroization of garbage-collected strings.

## Adding sensitive pages or images

Put their source in `private/`. Register page IDs and images in `scripts/config.mjs`, add corresponding generic shells to the explicit public/output allowlists, and register nonsecret routes in `public/site-config.js`. Use `data-private-image="registered-name"` instead of plaintext image URLs. Rebuild; all registered pages/images share the encrypted bundle and password. Keep new routes generic and their metadata free of private details.

Public page content is in `public/index.html`; shared styles are in `public/styles.css`. The public countdown is in `public/countdown.js`. Preserve visible OpenStreetMap attribution when replacing the private map.

## Verification and limits

`npm test` uses temporary project copies and disposable passwords, never the real build/password. It checks the actual builder, correct and incorrect passwords, tampering, fresh salt/IV, image roundtrip, output privacy, stale source checks and deployment guard failures.

A strong, unique shared passphrase matters: downloaded ciphertext allows offline guessing. Password holders can copy decrypted content. This is encryption, not server-side access control, and a compromised hosting origin/browser can capture an entered password.

Older Git commits, Firebase releases, caches and public copies already contain plaintext trip details. Encryption does not erase them. History/release cleanup is separate work and has not been performed. Until an encrypted release is explicitly deployed, the existing live site remains unchanged and public.
