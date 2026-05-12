import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Bus, Route, ClipboardCheck } from "lucide-react";

export default function AnalyticsPage() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: routeAnalytics } = trpc.dashboard.routeAnalytics.useQuery();
  const { data: reports } = trpc.report.list.useQuery();
  const { data: routes } = trpc.route.list.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Operator Dashboard</h1>
        <p className="text-muted-foreground mt-1">Real-time fleet and route analytics for Naga City.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Route className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Routes</p>
              <p className="text-2xl font-bold">{stats?.totalRoutes || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Bus className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Trips</p>
              <p className="text-2xl font-bold">{stats?.activeTrips || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <ClipboardCheck className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Reports</p>
              <p className="text-2xl font-bold">{stats?.totalReports || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fleet Size</p>
              <p className="text-2xl font-bold">{stats?.totalJeepneys || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Capacity Status Distribution (Last 30 min)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.statusDistribution && Object.keys(stats.statusDistribution).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.statusDistribution).map(([status, count]) => {
                  const total = Object.values(stats.statusDistribution).reduce((a, b) => a + b, 0);
                  const percentage = Math.round((count / total) * 100);
                  const colors: Record<string, string> = {
                    maluwag: "bg-emerald-500",
                    may_seats_pa: "bg-blue-500",
                    halos_puno: "bg-yellow-500",
                    puno_na: "bg-orange-500",
                    unsafe: "bg-red-500",
                  };
                  const labels: Record<string, string> = {
                    maluwag: "Maluwag",
                    may_seats_pa: "May Seats Pa",
                    halos_puno: "Halos Puno",
                    puno_na: "Puno Na",
                    unsafe: "Unsafe",
                  };
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{labels[status] || status}</span>
                        <span>{count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors[status] || "bg-gray-500"} rounded-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent reports available.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {reports && reports.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-auto">
                {reports.slice(0, 20).map(report => (
                  <div key={report.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={
                          report.status === "maluwag" ? "bg-emerald-100 text-emerald-700" :
                          report.status === "may_seats_pa" ? "bg-blue-100 text-blue-700" :
                          report.status === "halos_puno" ? "bg-yellow-100 text-yellow-700" :
                          report.status === "puno_na" ? "bg-orange-100 text-orange-700" :
                          "bg-red-100 text-red-700"
                        }
                      >
                        {report.status}
                      </Badge>
                      <div>
                        <p className="text-sm">{report.route.name}</p>
                        <p className="text-xs text-muted-foreground">{report.jeepney.plateNumber}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {report.createdAt ? new Date(report.createdAt).toLocaleTimeString() : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No reports yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Route Activity (Last 30 min)</CardTitle>
        </CardHeader>
        <CardContent>
          {routeAnalytics && routeAnalytics.length > 0 ? (
            <div className="space-y-3">
              {routeAnalytics.map(item => {
                const route = routes?.find(r => r.id === item.routeId);
                return (
                  <div key={item.routeId} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: route?.color || "#3B82F6" }} />
                      <span className="font-medium">{route?.name || `Route ${item.routeId}`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{item.count} reports</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No route activity data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
