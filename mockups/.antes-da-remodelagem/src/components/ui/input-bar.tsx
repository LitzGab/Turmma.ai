"use client";

/* serafimcloud/input-bar (21st.dev · 12399, MIT) — a caixa de pedido. Vestida na adoção:
   canto de 28 px e a sombra suave da caixa do ChatGPT, sem borda, texto de 16 px, enviar redondo no laranja
   da pinta com seta preta, que vira "Parar" enquanto o texto chega (9.5). A largura quem dá é a tela. */

import {
  memo,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { FileCard, formatoDe } from "@/components/ui/file-card-collections";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ChatStatus = "ready" | "streaming" | "submitted" | "idle";

export type AttachedImage = {
  id: string;
  filename: string;
  url: string;
  size?: number;
};

export type AttachedFile = {
  id: string;
  filename: string;
  size?: number;
};

export type InputBarProps = {
  onSend?: (message: { role: "user"; content: string }) => void;
  onStop?: () => void;
  status?: ChatStatus;
  placeholder?: string;
  className?: string;
  onAttach?: () => void;
  attachedImages?: AttachedImage[];
  attachedFiles?: AttachedFile[];
  onRemoveImage?: (id: string) => void;
  onRemoveFile?: (id: string) => void;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
};

const PaperclipIcon = ({ className = "w-[18px] h-[18px]" }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
  </svg>
);

const SendIcon = ({ className = "w-[14px] h-[14px]" }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const StopIcon = ({ className = "w-[12px] h-[12px]" }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <rect x="6" y="6" width="12" height="12" rx="1" />
  </svg>
);

const XIcon = ({ className = "w-3 h-3" }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function AttachmentButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Anexar arquivo"
      title="Anexar arquivo"
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-borda-campo text-sutil transition-colors duration-150 hover:bg-realce-suave hover:text-tinta disabled:opacity-40"
    >
      <PaperclipIcon className="w-[17px] h-[17px]" />
    </button>
  );
}

function SendButton({
  state,
  onClick,
}: {
  state: "idle" | "typing" | "streaming";
  onClick: () => void;
}) {
  const isStreaming = state === "streaming";
  const isActive = state === "typing" || isStreaming;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isStreaming ? "Parar" : "Enviar"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center h-10 min-w-10 md:h-9 md:min-w-9 gap-2 rounded-full text-[13px] font-medium transition-[background-color,color,opacity] duration-150",
        isActive
          ? (isStreaming ? "bg-noite text-white px-4 hover:bg-noite-alto" : "bg-caramelo text-tinta hover:bg-caramelo-claro")
          : "bg-realce text-inativo",
      )}
    >
      {isStreaming ? (<><StopIcon /> Parar</>) : <SendIcon className="w-[17px] h-[17px]" />}
    </button>
  );
}

function ImageChip({
  url,
  onRemove,
}: {
  url: string;
  onRemove?: () => void;
}) {
  return (
    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-neutral-100 dark:bg-neutral-800 group">
      <img src={url} alt="" className="w-full h-full object-cover" />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove image"
          className="absolute top-0.5 right-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-neutral-900/70 text-white transition-colors"
        >
          <XIcon className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}

function FileChip({
  filename,
  size,
  onRemove,
}: {
  filename: string;
  size?: number;
  onRemove?: () => void;
}) {
  const sizeText =
    size === undefined
      ? null
      : size < 1024 * 1024
        ? `${Math.max(1, Math.round(size / 1024))} KB`
        : `${(size / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
  return (
    <div className="inline-flex items-center gap-3.5 rounded-[14px] bg-realce-suave py-1.5 pl-2 pr-1.5">
      <FileCard formatFile={formatoDe(filename)} tamanho="sm" />
      <div className="flex min-w-0 flex-col">
        <span className="max-w-[160px] truncate text-[13px] font-medium leading-tight text-tinta">
          {filename}
        </span>
        {sizeText && <span className="text-[11.5px] leading-tight text-sutil">{sizeText}</span>}
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Tirar ${filename}`}
          className="inline-flex size-6 items-center justify-center rounded-full text-sutil transition-colors hover:bg-realce hover:text-tinta"
        >
          <XIcon />
        </button>
      )}
    </div>
  );
}

export const InputBar = memo(function InputBar({
  onSend,
  onStop,
  status = "ready",
  placeholder = "Escreva seu pedido…",
  className,
  onAttach,
  attachedImages = [],
  attachedFiles = [],
  onRemoveImage,
  onRemoveFile,
  value: controlledValue,
  onChange: controlledOnChange,
  disabled,
  autoFocus,
  leftActions,
  rightActions,
}: InputBarProps) {
  const [internalInput, setInternalInput] = useState("");
  const isControlled = controlledValue !== undefined;
  const input = isControlled ? controlledValue : internalInput;
  const setInput = useCallback(
    (v: string) => {
      if (isControlled) controlledOnChange?.(v);
      else setInternalInput(v);
    },
    [isControlled, controlledOnChange],
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isStreaming = status === "streaming" || status === "submitted";
  const hasInput = input.trim().length > 0;
  const hasContextItems =
    attachedImages.length > 0 || attachedFiles.length > 0;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0";
    const next = Math.min(el.scrollHeight, 200);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > 200 ? "auto" : "hidden";
  }, [input]);

  useEffect(() => {
    if (!autoFocus) return;
    textareaRef.current?.focus();
  }, [autoFocus]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend?.({ role: "user", content: trimmed });
    setInput("");
  }, [input, isStreaming, disabled, onSend, setInput]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (
      e.target === e.currentTarget ||
      !(e.target as HTMLElement).closest("button, textarea")
    ) {
      textareaRef.current?.focus();
    }
  }, []);

  const sendState: "idle" | "typing" | "streaming" = isStreaming
    ? "streaming"
    : hasInput && !disabled
      ? "typing"
      : "idle";

  return (
    <div className={cn("shrink-0 w-full", className)}>
      <div className="mx-auto w-full">
        <div
          className="relative cursor-text rounded-caixa bg-superficie shadow-caixa"
          onClick={handleContainerClick}
        >
          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-200 ease-out",
              hasContextItems ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="overflow-hidden">
              {hasContextItems && (
                <div className="flex flex-wrap items-center gap-1.5 px-3 pt-3 pb-0.5">
                  {attachedImages.map((img) => (
                    <ImageChip
                      key={img.id}
                      url={img.url}
                      onRemove={
                        onRemoveImage ? () => onRemoveImage(img.id) : undefined
                      }
                    />
                  ))}
                  {attachedFiles.map((file) => (
                    <FileChip
                      key={file.id}
                      filename={file.filename}
                      size={file.size}
                      onRemove={
                        onRemoveFile ? () => onRemoveFile(file.id) : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="pt-4 pb-0 px-5 min-h-[52px]">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(
                "w-full resize-none bg-transparent border-0 outline-none focus-visible:outline-none text-base leading-[1.55] text-tinta placeholder:text-sutil",
                "overflow-hidden",
                disabled && "opacity-50 cursor-not-allowed",
              )}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-2.5 pt-1 pb-2.5">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              {onAttach && (
                <AttachmentButton onClick={onAttach} disabled={disabled} />
              )}
              {leftActions}
            </div>
            <div className="ml-auto flex items-center gap-1">
              {rightActions}
              <SendButton
                state={sendState}
                onClick={() => {
                  if (isStreaming) onStop?.();
                  else if (hasInput) handleSubmit();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default InputBar;
