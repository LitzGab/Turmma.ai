import { memo, useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { FileAttachment } from "@/components/ui/file-attachment";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image"; url?: string; image?: string };
type DataImagePart = { type: "data-image"; data?: { url?: string } };
type FilePartType = {
  type: "file";
  filename?: string;
  name?: string;
  fileName?: string;
  size?: number;
  mimeType?: string;
  url?: string;
  data?: string;
};
type ExperimentalAttachment = { contentType?: string; url?: string };

export type UIMessage = {
  id: string;
  parts?: Array<TextPart | ImagePart | DataImagePart | FilePartType | { type: string; [key: string]: unknown }>;
  experimental_attachments?: ExperimentalAttachment[];
};

export type UserMessageProps = {
  message: UIMessage;
  className?: string;
  enableImagePreview?: boolean;
  onImageClick?: (index: number, urls: string[]) => void;
};

type MessagePart = NonNullable<UIMessage["parts"]>[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTextPart(part: MessagePart): part is TextPart {
  return (
    part.type === "text" &&
    typeof (part as { text?: unknown }).text === "string"
  );
}

function getImageUrlFromPart(part: unknown): string | null {
  if (!isRecord(part)) return null;
  const type = part.type;
  if (typeof type !== "string") return null;

  if (type === "image") {
    const imagePart = part as { url?: string; image?: string };
    return imagePart.url ?? imagePart.image ?? null;
  }

  if (type === "data-image") {
    const dataPart = part as { data?: { url?: string } };
    return dataPart.data?.url ?? null;
  }

  if (type === "file") {
    const filePart = part as FilePartType;
    if (filePart.mimeType?.startsWith("image/")) {
      if (filePart.url) return filePart.url;
      if (filePart.data) {
        return `data:${filePart.mimeType};base64,${filePart.data}`;
      }
    }
  }

  return null;
}

function getFileFromPart(part: unknown) {
  if (!isRecord(part)) return null;
  if (part.type !== "file") return null;
  const filePart = part as FilePartType;
  const filename =
    filePart.filename || filePart.name || filePart.fileName || "Attachment";
  const isImage = filePart.mimeType?.startsWith("image/") ?? false;
  if (isImage) return null;
  return {
    filename,
    size: filePart.size,
  };
}

export const UserMessage = memo(function UserMessage({
  message,
  className,
  enableImagePreview = false,
  onImageClick,
}: UserMessageProps) {
  const [, setLightboxIndex] = useState<number | null>(null);
  const textParts = message.parts?.filter(isTextPart) ?? [];
  const text = textParts.map((p) => p.text).join("");

  const images: string[] = [];
  const files: Array<{ filename: string; size?: number }> = [];
  for (const part of message.parts ?? []) {
    const imageUrl = getImageUrlFromPart(part);
    if (imageUrl) images.push(imageUrl);
    const file = getFileFromPart(part);
    if (file) files.push(file);
  }
  if (isRecord(message) && Array.isArray(message.experimental_attachments)) {
    for (const att of message.experimental_attachments as ExperimentalAttachment[]) {
      if (att.contentType?.startsWith("image/") && att.url) {
        images.push(att.url);
      }
    }
  }

  if (!text && images.length === 0 && files.length === 0) return null;

  return (
    <div className={cn("flex flex-col items-end gap-1", className)}>
      {images.length > 0 &&
        images.map((url, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[200px] p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-2xl",
              enableImagePreview && "cursor-pointer",
            )}
            onClick={
              enableImagePreview
                ? () => {
                    setLightboxIndex(i);
                    onImageClick?.(i, images);
                  }
                : undefined
            }
          >
            <img
              src={url}
              alt="attachment"
              className="block object-cover max-w-[184px] max-h-[120px] rounded-xl"
            />
          </div>
        ))}
      {files.length > 0 && (
        <div className="flex flex-col items-end gap-2">
          {files.map((file, i) => (
            <FileAttachment
              key={`${file.filename}-${i}`}
              id={`${file.filename}-${i}`}
              filename={file.filename}
              size={file.size}
            />
          ))}
        </div>
      )}
      {text && (
        <div className="max-w-[85%] md:max-w-[75%]">
          <div className="px-5 py-2.5 text-base rounded-[22px] bg-creme text-tinta">
            <p className="leading-[1.5] whitespace-pre-wrap break-words">{text}</p>
          </div>
        </div>
      )}
    </div>
  );
});
