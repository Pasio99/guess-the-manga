type HeaderProps = {
  onOpenLevels: () => void;
  onOpenStats: () => void;
};

export function Header({ onOpenLevels, onOpenStats }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand" aria-label="Guess the Manga">
        <h1>Guess the Manga</h1>
      </div>

      <nav className="header-actions" aria-label="Primary navigation">
        <button className="ghost-button" type="button" onClick={onOpenLevels}>
          Levels
        </button>
        <button className="icon-button" type="button" onClick={onOpenStats} aria-label="Statistics">
          <span aria-hidden="true">▦</span>
        </button>
      </nav>
    </header>
  );
}
