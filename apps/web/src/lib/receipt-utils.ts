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
}

/**
 * Generate receipt text content for sharing
 */
export function generateReceiptText(receipt: ReceiptData): string {
    const dateStr = receipt.date ? new Date(receipt.date).toLocaleString() : "—";
    const amountStr = `${receipt.direction === "CREDIT" ? "+" : ""}${receipt.amount} ${receipt.currency}`;
    
    return `NePay Transaction Receipt
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Transaction ID: ${receipt.id}
Type: ${receipt.type}
Date: ${dateStr}

Details:
Description: ${receipt.label}
Amount: ${amountStr}
Direction: ${receipt.direction === "CREDIT" ? "Received" : "Sent"}
Status: ${receipt.status.toUpperCase()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Powered by NePay
www.nepay.com.ng`;
}

/**
 * Generate receipt HTML for PDF download
 */
function generateReceiptHTML(receipt: ReceiptData): string {
    const dateStr = receipt.date ? new Date(receipt.date).toLocaleString() : "—";
    const amountStr = receipt.amount >= 0 ? `+${receipt.amount}` : receipt.amount.toString();
    const statusColor = 
        receipt.status === "success" ? "#10b981" :
        receipt.status === "pending" ? "#f59e0b" :
        "#ef4444";

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>NePay Receipt - ${receipt.id}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f9fafb;
        }
        .receipt {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 32px;
            border-bottom: 2px solid #f3f4f6;
            padding-bottom: 24px;
        }
        .logo {
            font-size: 24px;
            font-weight: 800;
            color: #7c3aed;
            margin-bottom: 8px;
        }
        .title {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
        }
        .amount {
            font-size: 36px;
            font-weight: 800;
            color: ${receipt.amount > 0 ? "#10b981" : "#ef4444"};
            margin: 24px 0;
            font-family: "Monaco", "Courier New", monospace;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            background: ${statusColor}20;
            color: ${statusColor};
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 24px;
        }
        .details {
            margin-bottom: 24px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
            font-size: 14px;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            color: #6b7280;
            font-weight: 500;
        }
        .detail-value {
            color: #1f2937;
            font-weight: 600;
            text-align: right;
            word-break: break-word;
        }
        .footer {
            text-align: center;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 2px solid #f3f4f6;
            color: #9ca3af;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div class="logo"><img src="/logo.png" alt="" />NePay</div>
            <div class="title">Transaction Receipt</div>
        </div>
        
        <div style="text-align: center; margin-bottom: 32px;">
            <div class="amount">${amountStr} ${receipt.currency}</div>
            <div class="status-badge">${receipt.status.toUpperCase()}</div>
        </div>

        <div class="details">
            <div class="detail-row">
                <span class="detail-label">Transaction ID</span>
                <span class="detail-value">${receipt.id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Description</span>
                <span class="detail-value">${receipt.label}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Type</span>
                <span class="detail-value">${receipt.type}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Direction</span>
                <span class="detail-value">${receipt.direction === "CREDIT" ? "Received" : "Sent"}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date & Time</span>
                <span class="detail-value">${dateStr}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Currency</span>
                <span class="detail-value">${receipt.currency}</span>
            </div>
        </div>

        <div class="footer">
            <p>This is an official NePay transaction receipt</p>
            <p style="margin-top: 8px;">Powered by NePay • www.nepay.com.ng</p>
        </div>
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
        const html = generateReceiptHTML(receipt);
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
        const html = generateReceiptHTML(receipt);
        
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
        const html = generateReceiptHTML(receipt);
        
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
        const html = generateReceiptHTML(receipt);
        
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
