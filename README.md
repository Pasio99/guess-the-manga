# Guess the Manga Modern

Rewrite moderno della web app `Guess the Manga`, costruito come app statica gratuita con React, TypeScript, Vite e persistenza local-first in IndexedDB.

## Cosa cambia

- Nuova struttura moderna: `src/domain`, `src/persistence`, `src/components`, `src/data`.
- Immagini locali in `public/images`, niente hotlink a GitHub raw.
- UI responsive con effetti, sfumature, glassmorphism leggero e animazioni.
- Palette originale mantenuta: nero, bianco, `#6200ea`, `#3700b3`, grigi scuri.
- 4 tentativi reali per livello.
- Ogni invio consuma un tentativo, anche se il campo è vuoto.
- Puoi cambiare livello quando vuoi.
- Se torni a un livello in corso, ritrovi immagine, tentativi e indizio nello stesso stato.
- Quando un livello è risolto o fallito diventa solo consultabile.
- Indizi semitrasparenti come nella versione originale.
- Export/import JSON dei progressi.
- Test unitari della logica critica.

## Nota anti-cheat importante

Questa versione è **local-first** e resta gratuita anche su hosting statico. Usa IndexedDB invece di `localStorage` come persistenza principale.

Questo impedisce gli abusi nell'esperienza normale del giocatore: la app non concede mai più di 4 invii per livello, e lo stato viene salvato per livello. Però nessuna app 100% client-side può garantire anti-cheat assoluto contro chi modifica dati e codice dal browser. Per anti-cheat reale serve uno stato server-side, ad esempio Cloudflare Workers/D1 o Supabase free tier.

La codebase è pronta per quel passaggio: la persistenza è isolata dietro `ProgressStore`.

## Requisiti

- Node.js 20.19 o superiore.
- npm.

## Avvio locale

```bash
npm install
npm run dev
```

## Build produzione

```bash
npm run build
npm run preview
```

## Test

```bash
npm run test
npm run test:e2e
```

Per Playwright, se è la prima volta:

```bash
npx playwright install
```

## Deploy a 0€

Opzioni semplici:

- Cloudflare Pages: consigliato se vuoi restare su static hosting moderno e gratuito.
- Netlify: semplice per app statiche.
- Vercel: semplice per app frontend.
- GitHub Pages: ancora valido.

Per GitHub Pages con repository tipo `guess-the-manga`, usa:

```bash
BASE_PATH=/guess-the-manga/ npm run build
```

Poi pubblica la cartella `dist`.

## Dove modificare i livelli

I livelli sono in:

```txt
src/data/levels.ts
```

Ogni livello deve avere esattamente 4 immagini. Questa è una regola di prodotto, non un dettaglio casuale.

## File principali

```txt
src/domain/gameEngine.ts          # regole tentativi, avanzamento, stato livello
src/domain/answer.ts              # normalizzazione e controllo risposte
src/persistence/indexedDbStore.ts # salvataggio IndexedDB
src/components/GameScreen.tsx     # schermata di gioco
src/components/LevelMenu.tsx      # menu livelli libero
src/components/StatsScreen.tsx    # statistiche, import/export/reset
src/styles/index.css              # tema moderno mantenendo la palette originale
```

## Roadmap consigliata

1. Aggiungere altri livelli tramite manifest tipizzato.
2. Aggiungere immagini WebP/AVIF ottimizzate mantenendo fallback PNG.
3. Sostituire `IndexedDbProgressStore` con uno store server-side quando vuoi vero anti-cheat.
4. Aggiungere account opzionale senza obbligare il giocatore casuale a registrarsi.

## Deploy automatico su GitHub Pages

Questo progetto include già il workflow:

```txt
.github/workflows/deploy-github-pages.yml
```

Procedura consigliata:

1. Crea un repository GitHub.
2. Carica tutti i file del progetto nella root del repository, non dentro una sottocartella.
3. Vai in **Settings → Pages**.
4. In **Build and deployment → Source**, scegli **GitHub Actions**.
5. Fai push su `main` o `master`.
6. Il workflow calcola automaticamente il `BASE_PATH` corretto:
   - `/nome-repository/` per un project site tipo `https://utente.github.io/nome-repository/`;
   - `/` per un user site tipo `https://utente.github.io/`.

Se la pagina resta bianca, quasi sempre il problema è che GitHub Pages non sta usando **GitHub Actions** come sorgente oppure i file sono stati caricati dentro una cartella invece che nella root del repository.
