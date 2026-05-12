import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Camera, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ScanQRPage() {
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState("");
  const [scanning, setScanning] = useState(false);

  const handleManualSubmit = () => {
    if (!qrCode.trim()) {
      toast.error("Please enter a QR code");
      return;
    }
    // Simulate QR scan - navigate to report with the jeepney info
    toast.success("QR code recognized!");
    navigate(`/report?jeepneyQr=${qrCode}`);
  };

  const simulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      const demoCodes = ["SKN-JEEP-001", "SKN-JEEP-002", "SKN-JEEP-003"];
      const randomCode = demoCodes[Math.floor(Math.random() * demoCodes.length)];
      toast.success(`Scanned: ${randomCode}`);
      navigate(`/report?jeepneyQr=${randomCode}`);
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="text-center">
        <h1 className="text-2xl font-bold">Scan QR Code</h1>
        <p className="text-muted-foreground mt-1">Scan the QR code on the jeepney to report capacity.</p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-48 h-48 bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-border">
              {scanning ? (
                <div className="animate-pulse">
                  <Camera className="h-12 w-12 text-primary" />
                </div>
              ) : (
                <QrCode className="h-16 w-16 text-muted-foreground" />
              )}
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={scanning}
              onClick={simulateScan}
            >
              <Camera className="h-4 w-4 mr-2" />
              {scanning ? "Scanning..." : "Simulate QR Scan"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              In a native app, this would open the camera to scan the jeepney's QR code.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Enter QR code (e.g. SKN-JEEP-001)"
          value={qrCode}
          onChange={(e) => setQrCode(e.target.value)}
        />
        <Button onClick={handleManualSubmit}>Go</Button>
      </div>
    </div>
  );
}
