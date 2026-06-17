import { MAX_ATTEMPTS_PER_LEVEL } from '../domain/types';

type AttemptDotsProps = {
  used: number;
  status: 'not-started' | 'playing' | 'solved' | 'failed';
};

export function AttemptDots({ used, status }: AttemptDotsProps) {
  return (
    <div className="attempts" aria-label={`${used} tentativi usati su ${MAX_ATTEMPTS_PER_LEVEL}`}>
      {Array.from({ length: MAX_ATTEMPTS_PER_LEVEL }, (_, index) => {
        const className = index < used ? `attempt-dot used ${status}` : 'attempt-dot';
        return <span className={className} key={index} aria-hidden="true" />;
      })}
      <span className="attempt-text">{used}/4 tentativi</span>
    </div>
  );
}
