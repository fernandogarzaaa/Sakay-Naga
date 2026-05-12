import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, ArrowRight } from "lucide-react";
import { useState } from "react";
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

export default function RoutesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { data: routes, isLoading } = trpc.route.list.useQuery();
  const { data: searchResults } = trpc.route.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const displayRoutes = searchQuery.length > 0 ? searchResults : routes;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Jeepney Routes</h1>
        <p className="text-muted-foreground mt-1">Search and view all available routes in Naga City.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search routes..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayRoutes?.map(route => {
          const { data: crowding } = trpc.route.crowding.useQuery({ id: route.id });
          return (
            <Card key={route.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/routes/${route.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-12 rounded-full" style={{ backgroundColor: route.color || "#3B82F6" }} />
                    <div>
                      <h3 className="font-semibold">{route.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{route.origin}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{route.destination}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
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
        })}
      </div>
    </div>
  );
}
