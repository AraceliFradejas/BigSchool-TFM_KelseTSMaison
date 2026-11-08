export default function VoiceIcon({ stop, speaker, send }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {stop ? (
        <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
      ) : speaker ? (
        <>
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          <path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" />
        </>
      ) : send ? (
        <>
          <path d="m3 3 18 9-18 9 4-9-4-9Z" />
          <path d="M7 12h14" />
        </>
      ) : (
        <>
          <rect x="9" y="2" width="6" height="13" rx="3" />
          <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" />
        </>
      )}
    </svg>
  );
}
