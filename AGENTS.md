# Guess the Manga Modern - Agent Instructions

## Visione prodotto

Questa app deve essere un gioco rapido, fluido e divertente per indovinare un manga da quattro immagini. Il giocatore deve poter cambiare livello quando vuole senza perdere progressi. La libertà di navigazione non deve regalare tentativi extra.

## Regole non negoziabili

- Ogni livello ha esattamente 4 immagini.
- Ogni livello concede al massimo 4 invii reali.
- Un invio vuoto conta come tentativo.
- Dopo una risposta sbagliata si avanza alla prossima immagine sbloccata.
- Se il giocatore cambia livello e torna, vede lo stesso stato del livello: immagine corrente, tentativi usati, indizio visibile o nascosto.
- Un livello risolto o fallito diventa consultabile, non rigiocabile, salvo reset globale intenzionale.
- Gli indizi restano overlay semitrasparenti.
- Palette da preservare: `#000000`, `#ffffff`, `#6200ea`, `#3700b3`, grigi scuri come `#333333`.

## Scelte tecniche attuali

- Vite + React + TypeScript.
- IndexedDB come persistenza primaria.
- `localStorage` solo fallback.
- Nessun backend obbligatorio.
- La persistenza deve restare dietro l'interfaccia `ProgressStore` per rendere semplice una futura integrazione Cloudflare/Supabase.

## Anti-cheat

Non promettere anti-cheat assoluto in una app 100% client-side. Il codice deve impedire più di 4 tentativi nell'esperienza utente normale e salvare ogni tentativo, ma per sicurezza forte serve stato server-side.

## Test minimi da mantenere

- Risposta vuota consuma un tentativo.
- Non si possono superare 4 tentativi.
- Il ritorno a un livello mantiene immagine corrente e tentativi usati.
- Una risposta corretta conclude il livello.
- Un livello concluso non accetta nuovi tentativi.
