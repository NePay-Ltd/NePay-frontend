import { toast } from "sonner";
import html2canvas from "html2canvas";

import { buildReceiptMarkup, escapeHtml } from "@/lib/receipt-markup";
import { buildReceiptConfig, receiptToText, shareable, type ReceiptConfig, type ReceiptInput } from "@/lib/receipt-config";

/**
 * What a receipt is built from. The on-screen receipt shows everything (fee, total debited, discount);
 * every function below that sends one out - download, share, copy - turns it into the shareable version,
 * which carries only the exact amount that moved. See `shareable`.
 */
export type ReceiptData = ReceiptInput;

function outgoing(receipt: ReceiptData): ReceiptConfig {
    return buildReceiptConfig(shareable(receipt));
}

/** Exported images are captured at 3x so the text stays sharp when zoomed or printed. */
const IMAGE_SCALE = 3;

/** `NePay_Receipt_[reference]` - the reference, made safe for a filename. */
function receiptBaseName(receipt: ReceiptData): string {
    const config = outgoing(receipt);
    const ref = (config.references[0]?.value ?? config.id).replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    return `NePay_Receipt_${ref || "receipt"}`;
}

export function generateReceiptText(receipt: ReceiptData): string {
    return receiptToText(outgoing(receipt));
}

/**
 * Load logo and convert to base64
 */
async function getLogoBase64(): Promise<string> {
    try {
        const response = await fetch("/logo.png");
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Failed to load logo:", error);
        return ""; // Return empty string if logo can't be loaded
    }
}

/**
 * The receipt as a full HTML document (also screenshotted for PNG/PDF). The markup comes
 * from lib/receipt-markup.ts — the same generator the on-screen receipt uses — with the
 * logo embedded as a data URI so a downloaded file still works offline.
 *
 * That markup is `innerHTML`'d into a live, authenticated DOM node in
 * `downloadReceiptImage`/`shareReceiptImage` before being torn down, so every value is
 * escaped inside the generator (an unescaped provider string could carry an
 * `onerror`-style payload that runs in that real session).
 */
export async function generateReceiptHTML(receipt: ReceiptData): Promise<string> {
    const logoBase64 = await getLogoBase64();
    const config = outgoing(receipt);
    const { css, html } = buildReceiptMarkup(config, logoBase64);

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>NePay Receipt - ${escapeHtml(config.references[0]?.value ?? config.id)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@1&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; background: #FFFFFF; padding: 16px; }
        ${css}
    </style>
</head>
<body>
    ${html}
</body>
</html>`;
}

/**
 * Download receipt as HTML file (printable)
 */
export async function downloadReceipt(receipt: ReceiptData): Promise<void> {
    try {
        const html = await generateReceiptHTML(receipt);
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = `${receiptBaseName(receipt)}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success("Receipt downloaded successfully");
    } catch (error) {
        console.error("Download failed:", error);
        toast.error("Failed to download receipt");
    }
}

/**
 * Share receipt using Web Share API or fallback to copy
 */
export async function shareReceipt(receipt: ReceiptData): Promise<void> {
    const receiptText = generateReceiptText(receipt);
    
    try {
        // Try using Web Share API if available
        if (navigator.share) {
            await navigator.share({
                title: "NePay Transaction Receipt",
                text: receiptText,
            });
            toast.success("Receipt shared successfully");
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(receiptText);
            toast.success("Receipt copied to clipboard");
        }
    } catch (error: any) {
        // User cancelled share or clipboard failed
        if (error?.name !== "AbortError") {
            console.error("Share failed:", error);
            // Try clipboard as final fallback
            try {
                await navigator.clipboard.writeText(receiptText);
                toast.success("Receipt copied to clipboard");
            } catch {
                toast.error("Failed to share receipt");
            }
        }
    }
}

/**
 * Download receipt as PDF file
 */
export async function downloadReceiptPDF(receipt: ReceiptData): Promise<void> {
    try {
        const html = await generateReceiptHTML(receipt);
        
        // Create a temporary container
        const container = document.createElement("div");
        container.innerHTML = html;
        container.style.position = "fixed";
        container.style.left = "-9999px";
        container.style.top = "-9999px";
        container.style.width = "560px";
        document.body.appendChild(container);
        
        // Generate PDF using html2pdf
        const element = container.querySelector(".receipt") as HTMLElement;
        if (!element) {
            throw new Error("Receipt element not found");
        }
        
        await document.fonts?.ready;
        // Dynamically import html2pdf for better Next.js compatibility
        const html2pdf = (await import("html2pdf.js")).default;
        
        const opt = {
            margin: 10,
            filename: `${receiptBaseName(receipt)}.pdf`,
            image: { type: "jpeg" as const, quality: 0.98 },
            html2canvas: { scale: IMAGE_SCALE, useCORS: true, backgroundColor: "#FFFFFF" },
            jsPDF: { unit: "mm" as const, format: "a4", orientation: "portrait" as const },
        };
        
        await html2pdf().set(opt).from(element).save();
        
        // Cleanup
        document.body.removeChild(container);
        toast.success("Receipt downloaded as PDF");
    } catch (error) {
        console.error("PDF download failed:", error);
        toast.error("Failed to download receipt as PDF");
    }
}

/**
 * Download receipt as PNG image
 */
export async function downloadReceiptImage(receipt: ReceiptData): Promise<void> {
    try {
        const html = await generateReceiptHTML(receipt);
        
        // Create a temporary container
        const container = document.createElement("div");
        container.innerHTML = html;
        container.style.position = "fixed";
        container.style.left = "-9999px";
        container.style.top = "-9999px";
        container.style.width = "560px";
        container.style.backgroundColor = "#FFFFFF";
        document.body.appendChild(container);
        
        // Convert to canvas
        const element = container.querySelector(".receipt") as HTMLElement;
        if (!element) {
            throw new Error("Receipt element not found");
        }
        
        await document.fonts?.ready;
        const canvas = await html2canvas(element, {
            scale: IMAGE_SCALE,
            backgroundColor: "#FFFFFF",
            logging: false,
        });
        
        // Download as image
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `${receiptBaseName(receipt)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup
        document.body.removeChild(container);
        toast.success("Receipt downloaded as image");
    } catch (error) {
        console.error("Image download failed:", error);
        toast.error("Failed to download receipt as image");
    }
}

/**
 * Share receipt as image
 */
export async function shareReceiptImage(receipt: ReceiptData): Promise<void> {
    let container: HTMLElement | null = null;
    try {
        const html = await generateReceiptHTML(receipt);
        
        // Create a temporary container
        container = document.createElement("div");
        container.innerHTML = html;
        container.style.position = "fixed";
        container.style.left = "-9999px";
        container.style.top = "-9999px";
        container.style.width = "560px";
        container.style.backgroundColor = "#FFFFFF";
        document.body.appendChild(container);
        
        // Convert to canvas
        const element = container.querySelector(".receipt") as HTMLElement;
        if (!element) {
            throw new Error("Receipt element not found");
        }
        
        await document.fonts?.ready;
        const canvas = await html2canvas(element, {
            scale: IMAGE_SCALE,
            backgroundColor: "#FFFFFF",
            logging: false,
        });
        
        // Convert canvas to blob using Promise wrapper
        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, "image/png");
        });

        if (!blob) {
            throw new Error("Failed to create image blob");
        }
        
        // Create File object
        const file = new File([blob], `${receiptBaseName(receipt)}.png`, {
            type: "image/png",
        });
        
        // Try, in order: native file share -> copy image to clipboard -> download the PNG.
        // The capture above takes a moment, so a browser can reject the share/clipboard call
        // for lost user-activation or missing permission; none of those should end in a failure toast.
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title: "NePay Transaction Receipt" });
                toast.success("Receipt shared successfully");
                return;
            } catch (error: any) {
                if (error?.name === "AbortError") return;
                console.warn("File share rejected, falling back:", error);
            }
        }
        if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
            try {
                await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                toast.success("Receipt image copied to clipboard");
                return;
            } catch (error) {
                console.warn("Clipboard image copy rejected, falling back to download:", error);
            }
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${receiptBaseName(receipt)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Sharing isn't available here, so the receipt image was downloaded");
    } catch (error: any) {
        if (error?.name !== "AbortError") {
            console.error("Image share failed:", error);
            toast.error("Failed to share receipt as image");
        }
    } finally {
        // Cleanup
        if (container && document.body.contains(container)) {
            document.body.removeChild(container);
        }
    }
}
