import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bus, Play, Square } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function DriverPage() {
  const { user } = useAuth();
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [selectedJeepney, setSelectedJeepney] = useState<string>("");

  const { data: routes } = trpc.route.list.useQuery();
  const { data: jeepneys } = trpc.jeepney.list.useQuery();
  const { data: myTrips } = trpc.trip.byDriver.useQuery(
    { driverId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  const startTrip = trpc.trip.start.useMutation({
    onSuccess: () => {
      toast.success("Trip started! Drive safely.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const endTrip = trpc.trip.end.useMutation({
    onSuccess: () => {
      toast.success("Trip ended. Salamat!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const activeTrip = myTrips?.find(t => t.status === "active");

  const handleStartTrip = () => {
    if (!user?.id || !selectedRoute || !selectedJeepney) {
      toast.error("Please select a route and jeepney");
      return;
    }
    startTrip.mutate({
      driverId: user.id,
      routeId: parseInt(selectedRoute),
      jeepneyId: parseInt(selectedJeepney),
    });
  };

  const handleEndTrip = () => {
    if (!activeTrip) return;
    endTrip.mutate({ tripId: activeTrip.id });
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please sign in to access driver mode.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Driver Mode</h1>
        <p className="text-muted-foreground mt-1">Manage your trips and share capacity info.</p>
      </div>

      {activeTrip ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bus className="h-5 w-5" />
              Active Trip
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Route</p>
                <p className="font-semibold">{activeTrip.route.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jeepney</p>
                <p className="font-semibold">{activeTrip.jeepney.plateNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Started</p>
                <p className="font-semibold">{activeTrip.startTime ? new Date(activeTrip.startTime).toLocaleTimeString() : "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="bg-emerald-500">Active</Badge>
              </div>
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleEndTrip}
              disabled={endTrip.isPending}
            >
              <Square className="h-4 w-4 mr-2" />
              {endTrip.isPending ? "Ending..." : "End Trip"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Start New Trip</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Route</label>
              <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a route" />
                </SelectTrigger>
                <SelectContent>
                  {routes?.map(route => (
                    <SelectItem key={route.id} value={String(route.id)}>
                      {route.name} ({route.origin} → {route.destination})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Jeepney</label>
              <Select value={selectedJeepney} onValueChange={setSelectedJeepney}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a jeepney" />
                </SelectTrigger>
                <SelectContent>
                  {jeepneys?.map(jeepney => (
                    <SelectItem key={jeepney.id} value={String(jeepney.id)}>
                      {jeepney.plateNumber} (Capacity: {jeepney.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleStartTrip}
              disabled={startTrip.isPending || !selectedRoute || !selectedJeepney}
            >
              <Play className="h-4 w-4 mr-2" />
              {startTrip.isPending ? "Starting..." : "Start Trip"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trip History</CardTitle>
        </CardHeader>
        <CardContent>
          {myTrips && myTrips.length > 0 ? (
            <div className="space-y-3">
              {myTrips.map(trip => (
                <div key={trip.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{trip.route.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {trip.jeepney.plateNumber} · {trip.startTime ? new Date(trip.startTime).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <Badge variant={trip.status === "active" ? "default" : "secondary"}>
                    {trip.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No trips yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
