import { createRef } from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
    FileDropzone,
    formatFileSize,
    type FileDropzoneFile,
    type FileDropzoneHandle,
} from "../file-dropzone";

/**
 * FileDropzone wraps react-dropzone's headless `useDropzone` hook with token-styled
 * markup. The hidden `<input type="file">` (from `getInputProps`) drives selection;
 * uploading to it triggers the same path as a drop. The component manages its own list
 * when uncontrolled, or reflects the `files` prop when controlled, and renders one row
 * per file with name, size, and a remove button.
 */
describe("FileDropzone", () => {
    const fileInput = (container: HTMLElement) =>
        container.querySelector('input[type="file"]') as HTMLInputElement;

    it("renders a labelled dropzone surface with the default prompt", () => {
        render(<FileDropzone />);
        expect(screen.getByText("Drag & drop files here")).toBeInTheDocument();
        expect(screen.getByText("browse")).toBeInTheDocument();
        // The surface exposes a hidden file input.
        expect(screen.getByText("browse")).toBeInTheDocument();
    });

    it("adds a row (name + size) when a file is selected, uncontrolled", async () => {
        const user = userEvent.setup();
        const onFilesChange = vi.fn();
        const { container } = render(<FileDropzone onFilesChange={onFilesChange} />);

        const file = new File(["hello world"], "notes.txt", { type: "text/plain" });
        await user.upload(fileInput(container), file);

        expect(screen.getByText("notes.txt")).toBeInTheDocument();
        expect(screen.getByText(formatFileSize(file.size))).toBeInTheDocument();
        expect(onFilesChange).toHaveBeenCalled();
    });

    it("removes a file when its remove button is clicked", async () => {
        const user = userEvent.setup();
        const { container } = render(<FileDropzone />);

        const file = new File(["x"], "report.pdf", { type: "application/pdf" });
        await user.upload(fileInput(container), file);
        expect(screen.getByText("report.pdf")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Remove report.pdf" }));
        expect(screen.queryByText("report.pdf")).not.toBeInTheDocument();
    });

    it("reflects a controlled file list and does not self-mutate", async () => {
        const user = userEvent.setup();
        const files: FileDropzoneFile[] = [
            { id: "a", file: new File(["a"], "a.png", { type: "image/png" }), status: "pending" },
        ];
        const onFilesChange = vi.fn();
        const { container } = render(
            <FileDropzone files={files} onFilesChange={onFilesChange} />,
        );

        expect(screen.getByText("a.png")).toBeInTheDocument();

        // Selecting another file notifies via onFilesChange but the rendered list
        // stays driven by the (unchanged) prop.
        await user.upload(
            fileInput(container),
            new File(["b"], "b.png", { type: "image/png" }),
        );
        expect(onFilesChange).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ file: expect.any(File) })]),
        );
        expect(screen.queryByText("b.png")).not.toBeInTheDocument();
    });

    it("shows a determinate progress bar for an uploading file", () => {
        const files: FileDropzoneFile[] = [
            {
                id: "u",
                file: new File(["x"], "big.zip", { type: "application/zip" }),
                status: "uploading",
                progress: 0.4,
            },
        ];
        render(<FileDropzone files={files} />);
        const row = screen.getByText("big.zip").closest("li") as HTMLElement;
        expect(within(row).getByRole("progressbar")).toBeInTheDocument();
    });

    it("renders an error row for a file with error status", () => {
        const files: FileDropzoneFile[] = [
            {
                id: "e",
                file: new File(["x"], "bad.exe", { type: "application/octet-stream" }),
                status: "error",
                error: "Upload failed",
            },
        ];
        render(<FileDropzone files={files} />);
        expect(screen.getByText("Upload failed")).toBeInTheDocument();
    });

    it("disables selection when disabled", () => {
        const { container } = render(<FileDropzone disabled />);
        expect(fileInput(container)).toBeDisabled();
        // Browse affordance hidden when disabled.
        expect(screen.queryByText("browse")).not.toBeInTheDocument();
    });

    it("exposes imperative open() and clear() via ref", async () => {
        const user = userEvent.setup();
        const ref = createRef<FileDropzoneHandle>();
        const { container } = render(<FileDropzone ref={ref} />);

        await user.upload(
            fileInput(container),
            new File(["x"], "drop.txt", { type: "text/plain" }),
        );
        expect(screen.getByText("drop.txt")).toBeInTheDocument();

        act(() => ref.current?.clear());
        expect(screen.queryByText("drop.txt")).not.toBeInTheDocument();
        expect(typeof ref.current?.open).toBe("function");
    });

    describe("formatFileSize", () => {
        it("formats bytes, KB, and MB", () => {
            expect(formatFileSize(0)).toBe("0 B");
            expect(formatFileSize(512)).toBe("512 B");
            expect(formatFileSize(1024)).toBe("1 KB");
            expect(formatFileSize(1536)).toBe("1.5 KB");
            expect(formatFileSize(2 * 1024 * 1024)).toBe("2 MB");
        });
    });
});
