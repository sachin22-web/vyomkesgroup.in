import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Import Input
import { Label } from "@/components/ui/label"; // Import Label
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components
import { Seo } from "@/components/Seo"; // Import Seo component

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(await res.text());
      await res.json();
      window.location.href = "/admin/dashboard";
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <>
      <Seo title="Admin Login" description="Log in to the Vyomkesh Industries admin panel." />
      <section className="container py-16 flex items-center justify-center min-h-[calc(100vh-128px)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">Admin Login</CardTitle>
            <p className="text-sm text-muted-foreground">Access the administrative dashboard.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="mt-2 w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="mt-2 w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button className="w-full" type="submit">Continue</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </>
  );
}