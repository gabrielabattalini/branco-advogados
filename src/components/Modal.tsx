"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Modal({
  titulo,
  onClose,
  children,
  footer,
}: {
  titulo: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/40 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="mt-6 w-full max-w-lg rounded-lg border border-line bg-cream shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-serif text-lg text-navy">{titulo}</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
