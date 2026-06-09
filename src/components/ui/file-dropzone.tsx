"use client";

import { forwardRef, useCallback, useId, useImperativeHandle, useRef, useState } from "react";
import {
    useDropzone,
    type Accept,
    type DropzoneOptions,
    type FileRejection,
} from "react-dropzone";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
    cloudUpload,
    cross,
    document as documentIcon,
    tickCircle,
    warningSign,
    type IconGlyph,
    type IconName,
} from "./icons";

/**
 * FileDropzone — a token-styled drag-and-drop file upload surface.
 *
 * Built on `react-dropzone`'s headless `useDropzone` hook (logic only — drag
 * state, file selection, validation), with all markup hand-rendered and styled
 * from mithril tokens (CVA-free; matches FileInput's idiom). This is the same
 * "wrap a headless primitive, own the DOM" pattern mithril uses for Radix.
 *
 * Two layers:
 *   1. The dropzone surface — a dashed-border panel that reacts to drag state
 *      (idle / accept / reject) and disabled, with an icon, prompt text, and a
 *      Browse affordance. Click or keyboard-activate opens the native picker;
 *      `getInputProps()` supplies the hidden `<input type="file">`.
 *   2. An optional file list — one row per selected file (icon, name, size,
 *      optional upload progress, remove button) plus rejection rows for files
 *      that failed validation (too large / wrong type / too many).
 *
 * Controlled or uncontrolled: omit `files` to let the component own the list
 * (uncontrolled — read changes via `onFilesChange`); pass `files` to drive it
 * yourself (e.g. to attach upload progress/status from your transport layer).
 *
 * Imperative handle: `ref.current.open()` opens the picker programmatically;
 * `ref.current.clear()` empties an uncontrolled list.
 *
 * @example
 * const [files, setFiles] = useState<FileDropzoneFile[]>([]);
 * <FileDropzone
 *   files={files}
 *   onFilesChange={setFiles}
 *   accept={{ "image/*": [], "application/pdf": [".pdf"] }}
 *   maxSize={5 * 1024 * 1024}
 *   maxFiles={10}
 * />
 */

export type FileDropzoneSize = "small" | "medium" | "large";

export type FileDropzoneStatus = "pending" | "uploading" | "success" | "error";

/** A tracked file in the dropzone list. */
export interface FileDropzoneFile {
    /** Stable id for list keying + removal. Auto-assigned for files added via the dropzone. */
    id: string;
    /** The underlying browser File. */
    file: File;
    /**
     * Upload progress in [0, 1]. When set and `status` is `"uploading"`, a
     * determinate ProgressBar is shown on the row. Omit for no progress UI.
     */
    progress?: number;
    /**
     * Row status. `"error"` renders the row in a danger style with `error` text;
     * `"success"` shows a tick. Defaults to `"pending"`.
     */
    status?: FileDropzoneStatus;
    /** Error message shown on the row when `status === "error"`. */
    error?: string;
}

export interface FileDropzoneHandle {
    /** Open the native file picker programmatically. */
    open: () => void;
    /** Clear the file list (uncontrolled mode only; no-op when `files` is controlled). */
    clear: () => void;
}

export interface FileDropzoneProps {
    // ── react-dropzone passthrough ──────────────────────────────────────────
    /** Accepted file types, e.g. `{ "image/*": [], "application/pdf": [".pdf"] }`. */
    accept?: Accept;
    /** Maximum accepted file size in bytes. Larger files are rejected. */
    maxSize?: number;
    /** Minimum accepted file size in bytes. */
    minSize?: number;
    /** Maximum number of files. Drops beyond this are rejected. */
    maxFiles?: number;
    /** Allow selecting more than one file. @default true */
    multiple?: boolean;
    /** Disable the dropzone (no clicks, no drag, muted styling). @default false */
    disabled?: boolean;
    /** Disable opening the picker on click (drag-only). @default false */
    noClick?: boolean;

    // ── controlled / uncontrolled list ──────────────────────────────────────
    /** Controlled file list. Omit for uncontrolled (the component owns the list). */
    files?: FileDropzoneFile[];
    /** Initial files for uncontrolled mode. @default [] */
    defaultFiles?: FileDropzoneFile[];
    /** Called whenever the list changes (add or remove), in both modes. */
    onFilesChange?: (files: FileDropzoneFile[]) => void;
    /** Called with the files that passed validation on this drop/selection. */
    onDropAccepted?: (files: File[]) => void;
    /** Called with the rejections (with reasons) for files that failed validation. */
    onDropRejected?: (rejections: FileRejection[]) => void;

    // ── appearance ──────────────────────────────────────────────────────────
    /** Surface size — controls padding and icon scale. @default "medium" */
    size?: FileDropzoneSize;
    /** Primary prompt line on the surface. @default "Drag & drop files here" */
    title?: React.ReactNode;
    /** Secondary hint line under the title. Defaults to a hint derived from constraints. */
    description?: React.ReactNode;
    /** Inline browse affordance text. @default "browse" */
    browseText?: string;
    /** Icon shown on the surface (glyph object or registered icon name). @default cloudUpload */
    icon?: IconName | IconGlyph;
    /** Render the file list below the surface. @default true */
    showFileList?: boolean;
    /** Stretch to fill the container width. @default true */
    fill?: boolean;
    /** Additional class on the outer wrapper. */
    className?: string;
    /** Custom renderer for a file row. Receives the file and a `remove` callback. */
    renderFile?: (file: FileDropzoneFile, remove: () => void) => React.ReactNode;
}

/** Human-readable byte size (1 KB = 1024 B). */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, exp);
    // No decimals for bytes; one decimal otherwise, trimming a trailing ".0".
    const str = exp === 0 ? String(value) : value.toFixed(1).replace(/\.0$/, "");
    return `${str} ${units[exp]}`;
}

/** Default hint line derived from accept/size/count constraints. */
function defaultDescription(accept?: Accept, maxSize?: number, maxFiles?: number): string | undefined {
    const parts: string[] = [];
    if (accept) {
        const exts = Object.values(accept).flat();
        const types = exts.length ? exts.join(", ") : Object.keys(accept).join(", ");
        if (types) parts.push(types);
    }
    if (typeof maxSize === "number") parts.push(`up to ${formatFileSize(maxSize)}`);
    if (typeof maxFiles === "number" && maxFiles > 1) parts.push(`max ${maxFiles} files`);
    return parts.length ? parts.join(" · ") : undefined;
}

/** Translate a react-dropzone rejection error into a friendly message. */
function rejectionMessage(rej: FileRejection): string {
    const codes = rej.errors.map((e) => e.code);
    if (codes.includes("file-too-large")) return "File is too large";
    if (codes.includes("file-too-small")) return "File is too small";
    if (codes.includes("file-invalid-type")) return "File type not allowed";
    if (codes.includes("too-many-files")) return "Too many files";
    return rej.errors[0]?.message ?? "File rejected";
}

// Monotonic id source for files added via the dropzone — avoids Math.random and
// keeps keys stable across renders without depending on file identity.
let fileIdSeq = 0;

export const FileDropzone = forwardRef<FileDropzoneHandle, FileDropzoneProps>(function FileDropzone(
    {
        accept,
        maxSize,
        minSize,
        maxFiles,
        multiple = true,
        disabled = false,
        noClick = false,
        files: controlledFiles,
        defaultFiles = [],
        onFilesChange,
        onDropAccepted,
        onDropRejected,
        size = "medium",
        title = "Drag & drop files here",
        description,
        browseText = "browse",
        icon = cloudUpload,
        showFileList = true,
        fill = true,
        className,
        renderFile,
    },
    ref,
) {
    const isControlled = controlledFiles !== undefined;
    const [internalFiles, setInternalFiles] = useState<FileDropzoneFile[]>(defaultFiles);
    const files = isControlled ? controlledFiles : internalFiles;

    const [rejections, setRejections] = useState<FileRejection[]>([]);
    const labelId = useId();

    const setFiles = useCallback(
        (next: FileDropzoneFile[]) => {
            if (!isControlled) setInternalFiles(next);
            onFilesChange?.(next);
        },
        [isControlled, onFilesChange],
    );

    // Stable ref to the current list so onDrop doesn't need `files` in its deps
    // (which would re-create the dropzone callbacks on every list change).
    const filesRef = useRef(files);
    filesRef.current = files;

    const onDrop = useCallback(
        (accepted: File[], rejected: FileRejection[]) => {
            setRejections(rejected);
            if (accepted.length) {
                const added: FileDropzoneFile[] = accepted.map((file) => ({
                    id: `fdz-${fileIdSeq++}`,
                    file,
                    status: "pending",
                }));
                const next = multiple ? [...filesRef.current, ...added] : added;
                setFiles(next);
                onDropAccepted?.(accepted);
            }
            if (rejected.length) onDropRejected?.(rejected);
        },
        [multiple, setFiles, onDropAccepted, onDropRejected],
    );

    const dropzoneOptions: DropzoneOptions = {
        accept,
        maxSize,
        minSize,
        maxFiles,
        multiple,
        disabled,
        noClick,
        onDrop,
    };

    const { getRootProps, getInputProps, isDragAccept, isDragReject, isFocused, open } =
        useDropzone(dropzoneOptions);

    useImperativeHandle(
        ref,
        () => ({
            open,
            clear: () => {
                if (!isControlled) setInternalFiles([]);
                setRejections([]);
                onFilesChange?.([]);
            },
        }),
        [open, isControlled, onFilesChange],
    );

    const removeFile = useCallback(
        (id: string) => {
            setFiles(filesRef.current.filter((f) => f.id !== id));
        },
        [setFiles],
    );

    const resolvedDescription =
        description !== undefined ? description : defaultDescription(accept, maxSize, maxFiles);

    const iconSize = size === "small" ? 24 : size === "large" ? 40 : 32;

    return (
        <div className={cn(fill ? "w-full" : "inline-block", className)}>
            {/*
             * Dropzone surface. getRootProps() supplies the drag handlers, role,
             * tabIndex, and keyboard activation; we own all styling. Drag state
             * (accept/reject) tints the border + background using intent tokens.
             */}
            <div
                {...getRootProps({
                    "aria-labelledby": labelId,
                    className: cn(
                        "relative flex flex-col items-center justify-center gap-2 text-center",
                        "rounded-mithril border-2 border-dashed",
                        "transition-colors duration-100 ease-mithril outline-none",
                        // Size → padding
                        size === "small" && "px-4 py-5",
                        size === "medium" && "px-6 py-8",
                        size === "large" && "px-8 py-12",
                        // Resting border/background
                        "border-gray-5 dark:border-gray-1 bg-light-gray-5/40 dark:bg-black/20",
                        // Interactive affordance
                        !disabled && "cursor-pointer",
                        !disabled &&
                            "hover:border-gray-4 hover:bg-light-gray-4/40 dark:hover:border-gray-2 dark:hover:bg-black/30",
                        // Keyboard focus ring (Blueprint focus outline token)
                        isFocused && "border-intent-primary outline outline-2 outline-intent-primary/40",
                        // Drag-accept → primary tint
                        isDragAccept &&
                            "border-intent-primary bg-intent-primary/10 dark:bg-intent-primary/15",
                        // Drag-reject → danger tint
                        isDragReject &&
                            "border-intent-danger bg-intent-danger/10 dark:bg-intent-danger/15",
                        // Disabled → muted, no pointer
                        disabled && "cursor-not-allowed opacity-60",
                    ),
                })}
            >
                {/* getInputProps() doesn't propagate `disabled` to the native input
                 * (react-dropzone gates interaction at the root), so forward it here. */}
                <input {...getInputProps({ disabled })} />

                <Icon
                    icon={isDragReject ? warningSign : icon}
                    size={iconSize}
                    className={cn(
                        isDragAccept && "!text-intent-primary",
                        isDragReject && "!text-intent-danger",
                        !isDragAccept && !isDragReject && "!text-foreground-muted",
                    )}
                />

                <div className="flex flex-col gap-0.5">
                    <span
                        id={labelId}
                        className={cn(
                            "font-sans font-medium text-foreground",
                            size === "small" ? "text-body-sm" : "text-body",
                        )}
                    >
                        {title}{" "}
                        {!disabled && !noClick && (
                            <span className="text-intent-primary underline underline-offset-2">
                                {browseText}
                            </span>
                        )}
                    </span>
                    {resolvedDescription && (
                        <span className="text-body-sm text-foreground-muted">{resolvedDescription}</span>
                    )}
                </div>
            </div>

            {/* File list + rejections */}
            {showFileList && (files.length > 0 || rejections.length > 0) && (
                <ul className="mt-3 flex flex-col gap-2" aria-label="Selected files">
                    {files.map((f) =>
                        renderFile ? (
                            <li key={f.id}>{renderFile(f, () => removeFile(f.id))}</li>
                        ) : (
                            <FileRow key={f.id} file={f} onRemove={() => removeFile(f.id)} />
                        ),
                    )}
                    {rejections.map((rej, i) => (
                        <RejectionRow key={`rej-${i}`} rejection={rej} />
                    ))}
                </ul>
            )}
        </div>
    );
});

/** A single accepted-file row: icon, name, size, optional progress, remove button. */
function FileRow({ file: f, onRemove }: { file: FileDropzoneFile; onRemove: () => void }) {
    const status = f.status ?? "pending";
    const isError = status === "error";
    const isUploading = status === "uploading" && typeof f.progress === "number";

    return (
        <li
            className={cn(
                "flex items-center gap-2.5 rounded-mithril px-2.5 py-2",
                "bg-white shadow-input dark:bg-black/30",
                isError && "shadow-[inset_0_0_0_1px_var(--intent-danger)]",
            )}
        >
            <Icon
                icon={isError ? warningSign : status === "success" ? tickCircle : documentIcon}
                size={16}
                className={cn(
                    "shrink-0",
                    isError && "!text-intent-danger",
                    status === "success" && "!text-intent-success",
                    status !== "success" && !isError && "!text-foreground-muted",
                )}
            />

            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex min-w-0 items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate text-body-sm text-foreground">
                        {f.file.name}
                    </span>
                    <span className="shrink-0 text-body-sm tabular-nums text-foreground-muted">
                        {formatFileSize(f.file.size)}
                    </span>
                </div>
                {isUploading && (
                    <ProgressBar value={f.progress} intent="primary" stripes={false} className="h-1" />
                )}
                {isError && f.error && (
                    <span className="text-body-sm text-intent-danger">{f.error}</span>
                )}
            </div>

            <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${f.file.name}`}
                className={cn(
                    "shrink-0 rounded-mithril p-1 text-foreground-muted",
                    "transition-colors duration-100 ease-mithril",
                    "hover:bg-[var(--interactive-hover)] hover:text-foreground",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-intent-primary/40",
                )}
            >
                <Icon icon={cross} size={16} />
            </button>
        </li>
    );
}

/** A rejected-file row: danger-tinted, with the reason. */
function RejectionRow({ rejection }: { rejection: FileRejection }) {
    return (
        <li
            className={cn(
                "flex items-center gap-2.5 rounded-mithril px-2.5 py-2",
                "bg-intent-danger/5 shadow-[inset_0_0_0_1px_var(--intent-danger)]",
            )}
        >
            <Icon icon={warningSign} size={16} className="shrink-0 !text-intent-danger" />
            <div className="flex min-w-0 flex-1 items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate text-body-sm text-foreground">
                    {rejection.file.name}
                </span>
                <span className="shrink-0 text-body-sm text-intent-danger">
                    {rejectionMessage(rejection)}
                </span>
            </div>
        </li>
    );
}
