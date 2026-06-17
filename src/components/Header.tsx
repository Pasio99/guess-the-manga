type HeaderProps = {
  onOpenLevels: () => void;
  onOpenStats: () => void;
};

export function Header({ onOpenLevels, onOpenStats }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand" aria-label="Guess the Manga">
        <span className="brand-mark">?</span>
        <div>
          <p className="eyebrow">Free local-first game</p>
          <h1>Guess the Manga</h1>
        </div>
      </div>

      <nav className="header-actions" aria-label="Navigazione principale">
        <button className="ghost-button" type="button" onClick={onOpenLevels}>
          Livelli
        </button>
        <button className="icon-button" type="button" onClick={onOpenStats} aria-label="Statistiche">
          <span aria-hidden="true">▦</span>
        </button>
      </nav>
    </header>
  );
}
