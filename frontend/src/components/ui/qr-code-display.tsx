import React, { useRef, useEffect, useState } from "react";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, QrCode } from "lucide-react";

interface QRCodeDisplayProps {
  roomAccessId: string;
  roomNumber: string;
  roomType: string;
  onClose?: () => void;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  roomAccessId,
  roomNumber,
  roomType,
  onClose,
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    generateQRCode();
  }, [roomAccessId]);

  const generateQRCode = async () => {
    try {
      const url = `${window.location.origin}/hotel/${roomAccessId}`;
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000", // Black QR code
          light: "#ffffff",
        },
      });
      setQrDataUrl(qrDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const downloadQRCode = async () => {
    if (!qrRef.current) return;

    try {
      // First try the html2canvas approach
      const canvas = await html2canvas(qrRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        width: 400,
        height: 500,
        useCORS: true,
        allowTaint: true,
        ignoreElements: (element) => {
          return element.classList.contains("ignore-capture");
        },
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement("style");
          style.innerHTML = `
            * {
              color: rgb(0, 0, 0) !important;
              background-color: rgb(255, 255, 255) !important;
              border-color: rgb(229, 231, 235) !important;
            }
            .text-black { color: rgb(0, 0, 0) !important; }
            .text-gray-800 { color: rgb(31, 41, 55) !important; }
            .text-gray-600 { color: rgb(75, 85, 99) !important; }
            .text-gray-500 { color: rgb(107, 114, 128) !important; }
            .text-gray-400 { color: rgb(156, 163, 175) !important; }
            .bg-gray-50 { background-color: rgb(249, 250, 251) !important; }
            .border-gray-200 { border-color: rgb(229, 231, 235) !important; }
          `;
          clonedDoc.head.appendChild(style);
        },
      });

      const link = document.createElement("a");
      link.download = `room-${roomNumber}-qr-code.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error downloading QR code with html2canvas:", error);
      // Fallback: Create a simpler version programmatically
      try {
        await downloadSimpleQRCode();
      } catch (fallbackError) {
        console.error("Fallback download also failed:", fallbackError);
        alert("Download failed. Please try again or contact support.");
      }
    }
  };

  const downloadSimpleQRCode = async () => {
    if (!qrDataUrl) return;

    // Create a canvas programmatically
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("Could not get canvas context");
      return;
    }

    canvas.width = 400;
    canvas.height = 450;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 400, 450);

    // Room Number (small text at top)
    ctx.fillStyle = "#000000";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Room ${roomNumber}`, 200, 40);

    // Load and draw QR code
    const qrImage = new Image();
    qrImage.onload = () => {
      if (!ctx) return;

      // Draw QR code (larger size)
      ctx.drawImage(qrImage, 50, 70, 300, 300);

      // Instructions below QR code
      ctx.fillStyle = "#000000";
      ctx.font = "bold 14px Arial";
      ctx.fillText("Scan here to access services", 200, 400);

      ctx.fillStyle = "#666666";
      ctx.font = "12px Arial";
      ctx.fillText("Digital concierge at your fingertips", 200, 420);

      // Download
      const link = document.createElement("a");
      link.download = `room-${roomNumber}-qr-simple.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    qrImage.src = qrDataUrl;
  };

  return (
    <div className="space-y-4">
      {/* QR Code Display */}
      <div
        ref={qrRef}
        className="bg-white p-8 rounded-sm text-center"
        style={{
          width: "400px",
          height: "450px",
          backgroundColor: "#ffffff",
          color: "#000000",
        }}
      >
        {/* Room Number */}
        <div className="mb-6">
          <p className="text-sm" style={{ color: "#000000" }}>
            Room {roomNumber}
          </p>
        </div>

        {/* QR Code */}
        {qrDataUrl && (
          <div className="mb-6 flex justify-center">
            <img src={qrDataUrl} alt="Room QR Code" className="w-72 h-72" />
          </div>
        )}

        {/* Instructions */}
        <div className="text-center">
          <p className="text-sm font-medium mb-1" style={{ color: "#000000" }}>
            Scan here to access services
          </p>
          <p className="text-xs" style={{ color: "#666666" }}>
            Digital concierge at your fingertips
          </p>
        </div>
      </div>

      {/* Download Button */}
      <div className="flex justify-center space-x-3">
        <Button
          onClick={downloadQRCode}
          className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-sm"
        >
          <Download className="h-4 w-4" />
          <span>Download QR Code</span>
        </Button>
        {onClose && (
          <Button variant="outline" onClick={onClose} className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
            Close
          </Button>
        )}
      </div>
    </div>
  );
};
