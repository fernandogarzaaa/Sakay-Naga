import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useNavigate, useParams } from "react-router";

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

export default function RouteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const routeId = parseInt(id || "0");

  const { data: route, isLoading } = trpc.route.byId.useQuery({ id: routeId });
  const { data: crowding } = trpc.route.crowding.useQuery({ id: routeId });
  const { data: reports } = trpc.report.byRoute.useQuery({ routeId });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Route not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/routes")}>
          Back to Routes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/routes")} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Routes
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-12 rounded-full" style={{ backgroundColor: route.color || "#3B82F6" }} />
            <div>
              <h1 className="text-2xl font-bold">{route.name}</h1>
              <p className="text-muted-foreground">{route.code} · {route.origin} → {route.destination}</p>
            </div>
          </div>
        </div>
        <Button onClick={() => navigate(`/report?routeId=${route.id}`)}>
          <AlertTriangle className="h-4 w-4 mr-2" />
          Report Capacity
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <StatusBadge status={crowding?.status || "unknown"} />
            {crowding && crowding.confidence > 0 && (
              <span className="text-sm text-muted-foreground">Based on {crowding.count} recent reports · {crowding.confidence}% confidence</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Route Stops</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {route.stops?.map((rs, index) => (
              <div key={rs.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {rs.sequence}
                  </div>
                  {index < (route.stops?.length || 0) - 1 && (
                    <div className="w-0.5 h-8 bg-border mt-1" />
                  )}
                </div>
                <div className="pt-1">
                  <p className="font-medium">{rs.stop.name}</p>
                  {rs.stop.landmark && (
                    <p className="text-sm text-muted-foreground">{rs.stop.landmark}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {reports && reports.length > 0 ? (
            <div className="space-y-3">
              {reports.slice(0, 10).map(report => (
                <div key={report.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={report.status} />
                    <div>
                      <p className="text-sm">Jeepney {report.jeepney.plateNumber}</p>
                      <p className="text-xs text-muted-foreground">by {report.user.name || "Anonymous"}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {report.createdAt ? new Date(report.createdAt).toLocaleTimeString() : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No reports yet for this route.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
