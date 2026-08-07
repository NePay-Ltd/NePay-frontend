"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
    ArrowLeft, 
    UploadCloud, 
    ShoppingCart, 
    Smartphone, 
    Tag, 
    Gamepad2,
    Loader2,
    CheckCircle2
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";
import { useGiftCardRates, useSubmitGiftCard } from "@/lib/queries/gift-cards";

import { Panel, PanelBody } from "@/components/shared/panel";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const BRAND_META: Record<string, any> = {
    amazon: { label: "Amazon", icon: ShoppingCart, color: "text-orange-500", bg: "bg-orange-50" },
    itunes: { label: "iTunes / Apple", icon: Smartphone, color: "text-black", bg: "bg-gray-100" },
    "google-play": { label: "Google Play", icon: Tag, color: "text-blue-500", bg: "bg-blue-50" },
    steam: { label: "Steam", icon: Gamepad2, color: "text-indigo-900", bg: "bg-indigo-50" },
};

export default function SellGiftCardPage({ params }: { params: { brand: string } }) {
    const router = useRouter();
    const brandId = params.brand;
    const meta = BRAND_META[brandId];

    const { data: rates = {} } = useGiftCardRates();
    const submitMutation = useSubmitGiftCard();

    const rate = rates[brandId] || 0;

    const [faceValueUsd, setFaceValueUsd] = React.useState<string>("");
    const [inputType, setInputType] = React.useState<"text" | "file">("text");
    const [cardCode, setCardCode] = React.useState("");
    const [file, setFile] = React.useState<File | null>(null);

    // Dropzone setup
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            "image/*": [".jpeg", ".png", ".jpg"]
        },
        maxFiles: 1,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles[0]) {
                setFile(acceptedFiles[0]);
            }
        },
    });

    const parsedValue = parseFloat(faceValueUsd) || 0;
    const payoutNgn = parsedValue * rate;
    
    // Validation
    const isValid = parsedValue > 0 && (inputType === "text" ? cardCode.trim().length > 0 : file !== null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        const formData = new FormData();
        formData.append("brand", brandId);
        formData.append("faceValueUsd", parsedValue.toString());
        
        if (inputType === "text") {
            formData.append("cardCode", cardCode);
        } else if (file) {
            formData.append("file", file);
        }

        submitMutation.mutate(formData, {
            onSuccess: (data) => {
                router.push(`/gift-cards/submissions/${data.id}`);
            },
            onError: (err) => {
                toast.error(err.message || "Failed to submit gift card");
            }
        });
    };

    if (!meta) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-muted">Brand not found.</p>
                <Button variant="ghost" onClick={() => router.push("/gift-cards")} className="mt-4">
                    Go back
                </Button>
            </div>
        );
    }

    const BrandIcon = meta.icon;

    return (
        <div className="mx-auto max-w-xl space-y-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <h1 className="text-2xl font-bold text-ink">Sell Gift Card</h1>
            </div>

            <Panel>
                <PanelBody className="p-0">
                    {/* Brand Header */}
                    <div className="flex items-center justify-between border-b border-border bg-gray-50/50 p-6">
                        <div className="flex items-center gap-4">
                            <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", meta.bg)}>
                                <BrandIcon className={cn("h-6 w-6", meta.color)} />
                            </div>
                            <div>
                                <h2 className="font-semibold text-ink">{meta.label}</h2>
                                <p className="text-xs text-muted">Current Rate</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono text-xl font-bold text-green-500">
                                {formatNaira(rate)}
                            </div>
                            <p className="text-xs text-muted">per USD</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 p-6">
                        {/* Face Value & Live Payout */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Face Value (USD)</Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-lg text-muted">
                                        $
                                    </span>
                                    <Input 
                                        type="number"
                                        min={1}
                                        step="0.01"
                                        placeholder="0.00"
                                        className="h-14 pl-10 font-mono text-xl"
                                        value={faceValueUsd}
                                        onChange={(e) => setFaceValueUsd(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-xl bg-green-50 p-4">
                                <span className="text-sm font-medium text-green-800">Estimated Payout</span>
                                <span className="font-mono text-2xl font-bold text-green-600">
                                    {formatNaira(payoutNgn)}
                                </span>
                            </div>
                        </div>

                        {/* Card Input / Upload */}
                        <div className="space-y-3 pt-4 border-t border-border">
                            <div className="flex items-center justify-between">
                                <Label>Card Details</Label>
                                <Tabs value={inputType} onValueChange={(v) => setInputType(v as "text" | "file")} className="w-[180px]">
                                    <TabsList className="grid w-full grid-cols-2 h-8">
                                        <TabsTrigger value="text" className="text-xs">Type Code</TabsTrigger>
                                        <TabsTrigger value="file" className="text-xs">Upload Image</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            {inputType === "text" ? (
                                <textarea
                                    placeholder="Enter your alphanumeric e-code here..."
                                    className="min-h-[120px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 resize-none font-mono"
                                    value={cardCode}
                                    onChange={(e) => setCardCode(e.target.value)}
                                />
                            ) : (
                                <div 
                                    {...getRootProps()} 
                                    className={cn(
                                        "flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-gray-50/50 p-6 text-center transition-colors hover:bg-gray-50",
                                        isDragActive ? "border-violet-500 bg-violet-50/50" : "border-border",
                                        file ? "border-green-500 bg-green-50/50" : ""
                                    )}
                                >
                                    <input {...getInputProps()} />
                                    {file ? (
                                        <div className="space-y-2">
                                            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            <p className="text-sm font-medium text-green-700">{file.name}</p>
                                            <p className="text-xs text-green-600/70">Click or drag to replace</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 text-muted">
                                            <UploadCloud className="mx-auto h-8 w-8 opacity-70" />
                                            <p className="text-sm font-medium">Drop an image here or click to browse</p>
                                            <p className="text-xs">JPEG, PNG up to 5MB</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <Button 
                            type="submit" 
                            variant="primary" 
                            size="lg" 
                            fullWidth 
                            disabled={!isValid || submitMutation.isPending}
                        >
                            {submitMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit for Verification"}
                        </Button>
                    </form>
                </PanelBody>
            </Panel>
        </div>
    );
}
