"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function ToastNotice({
  message,
  tone = "success"
}: {
  message?: string | null;
  tone?: "success" | "error";
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const hideTimer = window.setTimeout(() => {
      setVisible(false);
    }, 2600);

    return () => {
      window.clearTimeout(hideTimer);
    };
  }, [message]);

  if (!mounted || !message) {
    return null;
  }

  return createPortal(
    <div className={`app-toast app-toast-${tone}${visible ? " visible" : " exiting"}`} role="status" aria-live="polite">
      {message}
    </div>,
    document.body
  );
}
