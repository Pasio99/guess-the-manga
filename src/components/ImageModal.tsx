import { useEffect } from 'react';

type ImageModalProps = {
  src: string;
  alt: string;
  onClose: () => void;
};

export function ImageModal({ src, alt, onClose }: ImageModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.classList.add('modal-open');
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="image-modal" role="dialog" aria-modal="true" aria-label="Immagine ingrandita">
      <button className="modal-backdrop" type="button" aria-label="Chiudi immagine" onClick={onClose} />
      <div className="image-modal-card">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Chiudi">
          ✕
        </button>
        <img src={src} alt={alt} />
      </div>
    </div>
  );
}
