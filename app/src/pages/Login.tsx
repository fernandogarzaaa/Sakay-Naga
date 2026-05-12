import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Bus } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "login" | "register";

export default function Login() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navigate("/");
    },
    onError: (error) => toast.error(error.message),
  });

  const register = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navigate("/");
    },
    onError: (error) => toast.error(error.message),
  });

  const isPending = login.isPending || register.isPending;

  const submit = () => {
    if (!email.trim() || !password) {
      toast.error("Email and password are required.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        toast.error("Name is required.");
        return;
      }
      register.mutate({ name, email, password });
      return;
    }

    login.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mb-3">
            <Bus className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl">Sakay Naga</CardTitle>
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Sign in to continue." : "Create your Sakay Naga account."}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Juan Dela Cruz"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
              }}
            />
          </div>

          <Button
            className="w-full bg-emerald-700 hover:bg-emerald-800"
            size="lg"
            onClick={submit}
            disabled={isPending}
          >
            {isPending ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>

          <Button
            className="w-full"
            variant="ghost"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            disabled={isPending}
          >
            {mode === "login" ? "Create an account" : "I already have an account"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
