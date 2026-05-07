# AGENTS.md — Guess the Manga

## Contesto del progetto

Questa repository contiene una web app “Guess the Manga”. La parte principale del gioco è composta da:

- `index.html`: pagina di gioco.
- `FrontEnd/script.js`: logica del livello, submit, pannelli, hint, navigazione, modal immagine.
- `FrontEnd/storage.js`: persistenza progressi in `localStorage`.
- `FrontEnd/styles.css`: stile principale della pagina di gioco e componenti condivisi.
- `FrontEnd/history.html`: pagina statistiche/history, con stile inline da armonizzare con il design globale.
- `FrontEnd/loginAndRegistration.html`: pagina auth/demo da rendere coerente visivamente se viene mantenuta.

Quando lavori su questo progetto, mantieni il gioco semplice, statico e senza nuove dipendenze frontend salvo richiesta esplicita. Preferisci HTML/CSS/JS vanilla.

### Persistenza e modalità livello

- Se un livello è `in_progress`, al refresh deve ripartire esattamente da:
  - stesso livello;
  - stesso pannello;
  - stessi tentativi già usati;
  - stesso stato hint visibile/non visibile.
- Se un livello è `solved`, non deve poter essere rigiocato: solo modalità `view`.
- Se un livello è `failed`, non deve poter essere rigiocato: solo modalità `view`.
- Se un livello è già `played`, `solved` o `failed`, il submit deve essere disabilitato.
- Se l’utente va in `history` e poi torna, lo stato del livello in corso deve rimanere salvato.
- Se l’utente chiude la pagina e la riapre, deve riprendere dal livello in corso.
- Se l’utente sbaglia una risposta e ricarica, il tentativo deve rimanere consumato.
- Se l’utente arriva a 4 tentativi, il livello diventa `failed` e non è più rigiocabile.

### Regole di salvataggio immediato

In `FrontEnd/script.js`, ogni azione importante deve salvare subito lo stato. Non affidarti al salvataggio solo alla fine del round.

Quando parte un livello:

- salva lo stato con `status: "in_progress"`.

Quando l’utente invia una guess:

- se l’input è vuoto, NON consumare tentativo;
- se l’input non è vuoto, incrementa `attemptsMade`;
- salva subito il nuovo numero di tentativi PRIMA di mostrare il risultato;
- se la risposta è sbagliata e non ha raggiunto il massimo tentativi, avanza pannello e salva di nuovo;
- se la risposta è corretta, chiama `finishLevel("Correct")` o normalizza internamente a `solved`;
- se arriva al massimo tentativi, chiama `finishLevel("Failed")` o normalizza internamente a `failed`.

Quando l’utente mostra/nasconde hint:

- salva `hintVisible` immediatamente.

Quando cambia pannello con Previous/Next:

- salva `currentPanel` immediatamente.

Aggiungi o preserva il salvataggio su:

- `pagehide`;
- `visibilitychange`, quando `document.visibilityState === "hidden"`;
- `beforeunload`;
- click su link di `history`;
- click su link `home` dalla history, se presente.

### Stato consigliato in storage

In `FrontEnd/storage.js`, rendi esplicito lo stato del livello. Lo schema può mantenere retrocompatibilità, ma deve supportare chiaramente:

```js
status: "not_started" | "in_progress" | "solved" | "failed"
played: boolean
solved: boolean
failed: boolean
playState: {
  attemptsMade: number,
  maxPanelReached: number,
  currentPanel: number,
  hintVisible: boolean,
  updatedAt: string
} | null
```

Regole:

- `setPlayState(levelId, data)` deve impostare `status: "in_progress"`, salvare `playState`, aggiornare `lastLevelId` e salvare subito.
- `markStarted(levelId)` deve impostare `status: "in_progress"` se il livello non è terminale.
- `markFinished(levelId, status, attempts)` deve impostare:
  - `played: true`;
  - `status: "solved"` se status è `Correct`/`Solved`;
  - `status: "failed"` se status è `Failed`;
  - `solved`/`failed` boolean coerenti;
  - `playState: null`;
  - `state.inProgress: null` se coincide con il livello finito.
- `isPlayed(levelId)` deve tornare true per `played`, `solved`, `failed` o status terminale.
- `isLevelLockedToView(levelId)` in `script.js` deve bloccare tutti i livelli terminali.
- All’apertura di `index.html`, se esiste un livello `in_progress`, riprendi quello prima di defaultare a livello 0 o `lastLevelId`, salvo navigazione esplicita da history tramite `navigateToLevel`.

## Criteri di accettazione

Prima di considerare completato il lavoro, verifica manualmente questi scenari:

1. Avvio un livello, mostro hint, vado al pannello successivo se disponibile, faccio refresh: stesso livello, pannello, tentativi e hint.
2. Inserisco input vuoto e invio: i tentativi non aumentano.
3. Inserisco risposta sbagliata e ricarico subito: il tentativo rimane consumato.
4. Arrivo a 4 tentativi sbagliati: livello `failed`, submit disabilitato, da history si apre solo in view.
5. Risolvo un livello: livello `solved`, submit disabilitato, da history si apre solo in view.
6. Vado in history durante un livello in corso e torno: stato intatto.
7. Chiudo e riapro la pagina: riparte dal livello in corso.
8. Navigazione Previous/Next salva `currentPanel`.
9. Show/Hide hint salva `hintVisible`.
10. Su mobile il layout non taglia input, bottoni o immagine.
