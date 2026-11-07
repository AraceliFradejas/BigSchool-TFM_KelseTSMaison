import { useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import StylistChat from './StylistChat';
import { useMaison } from '../../shared/state';
import { Icon } from '../../shared/components';

export default function StylistLauncher() {
  const { language, user } = useMaison();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [preferences, setPreferences] = useState({});
  useEffect(() => {
    setMessages([]);
    setDraft('');
    setPreferences({});
  }, [language, user?.id]);
  const dialog = useRef(null);
  const trigger = useRef(null);
  const title = useId();
  const location = useLocation();
  const currentPath = useRef(location.pathname + location.search);
  currentPath.current = location.pathname + location.search;
  const es = language === 'es';
  useEffect(() => setOpen(false), [location.pathname, location.search]);
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const openedAt = currentPath.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (currentPath.current === openedAt) trigger.current?.focus({ preventScroll: true });
    };
  }, [open]);
  if (/^\/(bag|access|team|orders)(\/|$)/.test(location.pathname)) return null;
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="stylist-launcher"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="stylist-launcher-mark" aria-hidden="true">
          ✧
        </span>
        <span>
          <strong>Maison Stylist</strong>
          <small>{es ? 'Tu asesor de looks' : 'Your outfit adviser'}</small>
        </span>
      </button>
      {open && (
        <dialog
          ref={dialog}
          className="stylist-dialog"
          aria-labelledby={title}
          onCancel={(event) => {
            event.preventDefault();
            setOpen(false);
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="stylist-dialog-content">
            <header className="stylist-dialog-heading">
              <span id={title}>Maison Stylist</span>
              <button
                type="button"
                className="icon-button"
                onClick={() => setOpen(false)}
                aria-label={es ? 'Cerrar asesor' : 'Close adviser'}
                autoFocus
              >
                <Icon name="close" />
              </button>
            </header>
            <StylistChat
              conversation={{ messages, setMessages, draft, setDraft, preferences, setPreferences }}
            />
          </div>
        </dialog>
      )}
    </>
  );
}
