import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle2, Users, UserCheck, Siren } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "maluwag", label: "Maluwag", labelEn: "Spacious", icon: Users, color: "bg-emerald-500 hover:bg-emerald-600", description: "Plenty of seats available" },
  { value: "may_seats_pa", label: "May Seats Pa", labelEn: "Seats Available", icon: UserCheck, color: "bg-blue-500 hover:bg-blue-600", description: "A few seats still open" },
  { value: "halos_puno", label: "Halos Puno", labelEn: "Almost Full", icon: Users, color: "bg-yellow-500 hover:bg-yellow-600", description: "Standing room only soon" },
  { value: "puno_na", label: "Puno Na", labelEn: "Full", icon: Users, color: "bg-orange-500 hover:bg-orange-600", description: "No more seats, standing only" },
  { value: "unsafe", label: "Unsafe", labelEn: "Unsafe", icon: Siren, color: "bg-red-500 hover:bg-red-600", description: "Overcrowded and dangerous" },
];

export default function ReportPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routeIdParam = searchParams.get("routeId");
  const routeId = routeIdParam ? parseInt(routeIdParam) : undefined;

  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: routes } = trpc.route.list.useQuery();
  const { data: jeepneys } = trpc.jeepney.list.useQuery();

  const submitReport = trpc.report.submit.useMutation({
    onSuccess: () => {
      toast.success("Report submitted! Salamat sa pagtulong.");
      setSelectedStatus(null);
      setNotes("");
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit report");
    },
  });

  const handleSubmit = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to submit a report");
      return;
    }
    if (!selectedStatus || !routeId) {
      toast.error("Please select a status and route");
      return;
    }

    // Use first jeepney as default if none selected via QR
    const jeepneyId = jeepneys?.[0]?.id || 1;

    submitReport.mutate({
      jeepneyId,
      routeId,
      status: selectedStatus as "maluwag" | "may_seats_pa" | "halos_puno" | "puno_na" | "unsafe",
      latitude: location?.lat,
      longitude: location?.lng,
      notes: notes || undefined,
    });
  };

  // Try to get GPS location
  useState(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("GPS not available")
      );
    }
  });

  const selectedRoute = routes?.find(r => r.id === routeId);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Report Capacity</h1>
        <p className="text-muted-foreground mt-1">
          Help fellow commuters by reporting the current capacity of your jeepney.
        </p>
      </div>

      {selectedRoute && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="font-medium">Reporting for: {selectedRoute.name}</p>
            <p className="text-sm text-muted-foreground">{selectedRoute.origin} → {selectedRoute.destination}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Capacity Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {STATUS_OPTIONS.map(option => {
              const Icon = option.icon;
              const isSelected = selectedStatus === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedStatus(option.value)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className={`p-3 rounded-lg text-white ${option.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{option.label}</span>
                      <span className="text-sm text-muted-foreground">({option.labelEn})</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Notes (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any additional details about the situation..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {location && (
            <p className="text-xs text-muted-foreground mt-2">
              Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          )}
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        disabled={!selectedStatus || submitReport.isPending}
        onClick={handleSubmit}
      >
        {submitReport.isPending ? "Submitting..." : "Submit Report"}
      </Button>
    </div>
  );
}
