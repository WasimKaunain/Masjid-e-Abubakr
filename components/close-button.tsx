"use client";

export default function CloseButton() {
  return (
    <button
      className="close-button"
      onClick={() => {
        if (window.opener) window.close();
        else window.history.back();
      }}
      type="button"
      aria-label="Close"
    >
      ×
    </button>
  );
}
