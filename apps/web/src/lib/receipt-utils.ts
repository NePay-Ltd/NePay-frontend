import { toast } from "sonner";
import html2canvas from "html2canvas";

export interface ReceiptData {
    id: string;
    label: string;
    amount: number;
    status: "success" | "pending" | "failed";
    date?: string;
    type: string;
    direction: string;
    currency: string;
    meta: string;
    utilityToken?: string;
    /** Electricity-only receipt fields — see BaseTransaction's own note on where these come from. */
    utilityCustomerName?: string;
    utilityCustomerAddress?: string;
    utilityUnits?: string;
    utilityDisco?: string;
    utilityMeterNumber?: string;
    utilityMeterType?: string;
    utilityProviderTransactionId?: string;
    utilityTariff?: string;
}

/** Label/value rows shown on every receipt (HTML, image, PDF, text) — one source so they never drift apart. */
export function getReceiptRows(receipt: ReceiptData): [string, string][] {
    const dateStr = receipt.date
        ? new Date(receipt.date).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "medium" })
        : "—";
    const rows: [string, string | undefined][] = [
        ["Description", receipt.label],
        ["Transaction Type", receipt.type],
        ["Direction", receipt.direction === "CREDIT" ? "Received" : "Sent"],
        ["Date & Time", dateStr],
        ["Name", receipt.utilityCustomerName],
        ["Address", receipt.utilityCustomerAddress],
        ["Meter No", receipt.utilityMeterNumber],
        ["Meter Type", receipt.utilityMeterType ? receipt.utilityMeterType.replace(/^./, (c) => c.toUpperCase()) : undefined],
        ["Disco", receipt.utilityDisco],
        ["Tariff", receipt.utilityTariff],
        ["Units", receipt.utilityUnits],
        ["Provider Transaction ID", receipt.utilityProviderTransactionId],
        ["Electricity Token", receipt.utilityToken],
        ["Transaction Reference", receipt.id],
    ];
    return rows.filter((r): r is [string, string] => !!r[1]);
}

function formatReceiptAmount(receipt: ReceiptData): string {
    const abs = Math.abs(receipt.amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const symbol = receipt.currency === "NGN" ? "₦" : "";
    return `${symbol}${abs}${symbol ? "" : ` ${receipt.currency}`}`;
}

const STATUS_LABEL = { success: "Successful", pending: "Pending", failed: "Failed" } as const;

/**
 * Generate receipt text content for sharing
 */
export function generateReceiptText(receipt: ReceiptData): string {
    const lines = getReceiptRows(receipt).map(([label, value]) => `${label}: ${value}`);
    return `NePay Transaction Receipt
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formatReceiptAmount(receipt)} — ${STATUS_LABEL[receipt.status]}

${lines.join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Powered by NePay
www.nepay.com.ng`;
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
 * Escapes text before it's interpolated into `generateReceiptHTML`'s output.
 * That HTML is `innerHTML`'d into a live, authenticated DOM node in
 * `downloadReceiptImage`/`shareReceiptImage` (to screenshot it via
 * html2canvas) before being torn down — an unescaped externally-sourced
 * string (VTpass's `customerName`/`customerAddress`, or anything else on
 * `ReceiptData`) could carry an `onerror`/`onload`-style payload that
 * executes in that real session, not just in a downloaded offline file.
 * `innerHTML` blocks `<script>` execution on its own but does not block
 * inline event handlers, so escaping is still required here.
 */
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Generate receipt HTML (also screenshotted for PNG/PDF). Layout: logo left /
 * title right, centred amount + status, then aligned label/value rows, over a
 * tiled diagonal NePay watermark.
 */
export async function generateReceiptHTML(receipt: ReceiptData): Promise<string> {
    const statusColor =
        receipt.status === "success" ? "#10b981" :
        receipt.status === "pending" ? "#f59e0b" :
        "#ef4444";
    const logoBase64 = await getLogoBase64();
    const rowsHtml = getReceiptRows(receipt)
        .map(([label, value]) => {
            const mono = label === "Electricity Token" || label === "Transaction Reference" || label === "Provider Transaction ID" || label === "Meter No";
            return `<div class="row"><span class="label">${escapeHtml(label)}</span><span class="value${mono ? " mono" : ""}">${escapeHtml(value)}</span></div>`;
        })
        .join("");
    const mark = logoBase64 ? `<img src="${logoBase64}" alt="" />` : "";
    // Tiled watermark: an inline SVG data-URI so html2canvas/html2pdf render it with no extra request.
    const watermarkSvg = encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="140"><text x="110" y="80" text-anchor="middle" transform="rotate(-24 110 70)" font-family="Arial,sans-serif" font-size="28" font-weight="800" fill="#7c3aed" fill-opacity="0.06">NePay</text></svg>`,
    );

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>NePay Receipt - ${escapeHtml(receipt.id)}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 0; padding: 20px; background: #f3f4f6; }
        .receipt { max-width: 480px; margin: 0 auto; background: #fff url("data:image/svg+xml,${watermarkSvg}") repeat; border-radius: 12px; padding: 28px 28px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .top { display: flex; align-items: center; justify-content: space-between; }
        .brand { display: flex; align-items: center; gap: 8px; font-size: 26px; font-weight: 800; color: #1e1b4b; letter-spacing: -0.5px; }
        .brand img { height: 34px; width: auto; display: block; }
        .title { font-size: 15px; color: #374151; }
        .hero { text-align: center; padding: 32px 0 24px; }
        .amount { font-size: 34px; font-weight: 800; color: ${statusColor}; font-variant-numeric: tabular-nums; }
        .status { font-size: 18px; font-weight: 600; color: #111827; margin-top: 10px; }
        .date { font-size: 12px; color: #9ca3af; margin-top: 6px; }
        .rows { border-top: 1px solid #e5e7eb; padding-top: 8px; }
        .row { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding: 11px 0; font-size: 14px; }
        .label { color: #9ca3af; flex: 0 0 auto; max-width: 42%; }
        .value { color: #111827; font-weight: 600; text-align: right; word-break: break-word; flex: 1 1 auto; }
        .value.mono { font-family: "SFMono-Regular", Menlo, Consolas, monospace; font-size: 13px; }
        .footer { margin-top: 20px; padding-top: 16px; border-top: 1px dashed #d1d5db; text-align: center; color: #9ca3af; font-size: 11px; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="top">
            <div class="brand">${mark}<span>NePay</span></div>
            <div class="title">Transaction Receipt</div>
        </div>
        <div class="hero">
            <div class="amount">${escapeHtml(formatReceiptAmount(receipt))}</div>
            <div class="status">${STATUS_LABEL[receipt.status]}</div>
            ${receipt.date ? `<div class="date">${escapeHtml(new Date(receipt.date).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "medium" }))}</div>` : ""}
        </div>
        <div class="rows">${rowsHtml}</div>
        <div class="footer">This is an official NePay transaction receipt.<br/>Powered by NePay • www.nepay.com.ng</div>
    </div>
</body>
</html>
    `;
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
        link.download = `NePay-Receipt-${receipt.id}.html`;
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
        container.style.display = "none";
        document.body.appendChild(container);
        
        // Generate PDF using html2pdf
        const element = container.querySelector(".receipt") as HTMLElement;
        if (!element) {
            throw new Error("Receipt element not found");
        }
        
        // Dynamically import html2pdf for better Next.js compatibility
        const html2pdf = (await import("html2pdf.js")).default;
        
        const opt = {
            margin: 10,
            filename: `NePay-Receipt-${receipt.id}.pdf`,
            image: { type: "jpeg" as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
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
        container.style.backgroundColor = "#ffffff";
        document.body.appendChild(container);
        
        // Convert to canvas
        const element = container.querySelector(".receipt") as HTMLElement;
        if (!element) {
            throw new Error("Receipt element not found");
        }
        
        const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: "#ffffff",
            logging: false,
        });
        
        // Download as image
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `NePay-Receipt-${receipt.id}.png`;
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
        container.style.backgroundColor = "#ffffff";
        document.body.appendChild(container);
        
        // Convert to canvas
        const element = container.querySelector(".receipt") as HTMLElement;
        if (!element) {
            throw new Error("Receipt element not found");
        }
        
        const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: "#ffffff",
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
        const file = new File([blob], `NePay-Receipt-${receipt.id}.png`, {
            type: "image/png",
        });
        
        // Check if Web Share API supports files
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: "NePay Transaction Receipt",
                text: "Here is my NePay transaction receipt",
            });
            toast.success("Receipt shared successfully");
        } else {
            // Fallback: copy image to clipboard
            const items = [
                new ClipboardItem({
                    "image/png": blob,
                }),
            ];
            await navigator.clipboard.write(items);
            toast.success("Receipt image copied to clipboard");
        }
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
