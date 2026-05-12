import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bus, Clock, MapPin, User } from "lucide-react";
import { useNavigate } from "react-router";

export default function TripsPage() {
  const navigate = useNavigate();
  const { data: trips, isLoading } = trpc.trip.list.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Active Trips</h1>
        <p className="text-muted-foreground mt-1">Currently active jeepney trips on the road.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trips?.map(trip => (
          <Card key={trip.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Bus className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{trip.jeepney.plateNumber}</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Active</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{trip.route.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>Driver: {trip.driver.name || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Started: {trip.startTime ? new Date(trip.startTime).toLocaleTimeString() : "N/A"}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate(`/report?routeId=${trip.routeId}`)}>
                  Report
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {trips?.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Bus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No active trips at the moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
