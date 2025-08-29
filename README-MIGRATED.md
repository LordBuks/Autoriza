This repository was automatically migrated (conservatively) from JS to TypeScript.

What I changed:
- Renamed *.js files to *.ts where found (kept file contents identical).
- Updated HTML script src references from .js -> .ts to match renamed files.
- Added tsconfig.json and globals.d.ts to help TypeScript compile.
- Updated package.json scripts (dev/build/preview/typecheck) if package.json existed.

Important notes:
- I did NOT alter JS logic or UI/HTML/CSS structure. If some files rely on runtime globals loaded via CDN (e.g. Firebase, jsPDF),
  globals.d.ts includes 'any' declarations so TS won't error. For stronger typing and module-based Firebase (v9+),
  consider replacing CDN scripts with npm imports and installing the SDK.
- Run `npm install` then `npm run dev` to test locally.
- If you want, I can perform a second pass converting globals to modular imports (firebase, jspdf).
