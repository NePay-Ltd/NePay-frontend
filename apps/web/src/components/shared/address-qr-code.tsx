import * as React from "react";
import { QRCodeSVG } from "qrcode.react";

export interface AddressQrCodeProps {
    address: string;
    size?: number;
    className?: string;
}

export function AddressQrCode({
    address,
    size = 180,
    className,
}: AddressQrCodeProps) {
    return (
        <div 
            className={`relative inline-flex items-center justify-center rounded-2xl bg-white p-4 shadow-sm border border-border ${className || ""}`}
        >
            <QRCodeSVG
                value={address}
                size={size}
                level="H" // High error correction to tolerate the center logo
                includeMargin={false}
                fgColor="#000000"
                bgColor="#FFFFFF"
            />
            
            {/* Center Logo Overlay */}
            <div 
                className="absolute flex items-center justify-center rounded-md bg-brand-gradient shadow-md"
                style={{
                    width: size * 0.22,
                    height: size * 0.22,
                }}
            >
                <span className="font-bold text-white" style={{ fontSize: size * 0.12 }}>
                    N
                </span>
            </div>
        </div>
    );
}
