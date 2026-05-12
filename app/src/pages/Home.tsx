import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Users, AlertTriangle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router";

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    maluwag: { label: "Maluwag", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" },
    may_seats_pa: { label: "May Seats Pa", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
    halos_puno: { label: "Halos Puno", className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
    puno_na: { label: "Puno Na", className: "bg-orange-100 text-orange-700 hover:bg-orange-100" },
    unsafe: { label: "Unsafe", className: "bg-red-100 text-red-700 hover:bg-red-100" },
    unknown: { label: "No Data", className: "bg-gray-100 text-gray-500 hover:bg-gray-100" },
  };
  const config = configs[status] || configs.unknown;
  return <Badge variant="secondary" className={config.className}>{config.label}</Badge>;
}

function RouteCard({ route }: { route: { id: number; name: string; code: string; origin: string; destination: string; color: string | null } }) {
  const navigate = useNavigate();
  const { data: crowding } = trpc.route.crowding.useQuery({ id: route.id });

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/routes/${route.id}`)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-10 rounded-full" style={{ backgroundColor: route.color || "#3B82F6" }} />
            <div>
              <h3 className="font-semibold text-sm">{route.name}</h3>
              <p className="text-xs text-muted-foreground">{route.origin} → {route.destination}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={crowding?.status || "unknown"} />
                {crowding && crowding.confidence > 0 && (
                  <span className="text-xs text-muted-foreground">{crowding.confidence}% confidence</span>
                )}
              </div>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={(e) => {
            e.stopPropagation();
            navigate(`/report?routeId=${route.id}`);
          }}>
            Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { data: routes, isLoading } = trpc.route.list.useQuery();
  const { data: activeTrips } = trpc.trip.list.useQuery();
  const { data: recentReports } = trpc.report.list.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-8 w-32 mt-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome, {user?.name || "Commuter"}!</h1>
        <p className="text-muted-foreground mt-1">Track jeepney routes and report capacity in Naga City.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Routes</p>
              <p className="text-2xl font-bold">{routes?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Trips</p>
              <p className="text-2xl font-bold">{activeTrips?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reports Today</p>
              <p className="text-2xl font-bold">{recentReports?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trust Score</p>
              <p className="text-2xl font-bold">92%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Available Routes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routes?.map(route => <RouteCard key={route.id} route={route} />)}
        </div>
      </div>
    </div>
  );
}
