import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo"; // Import Seo component

export default function Login() {
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email || undefined,
          phone: phone || undefined,
          password,
        }),
      });
      await refresh();
      window.location.href = "/app";
    } catch (err: any) {
      setError("Invalid credentials. Please check your email/phone and password.");
    }
  };

  return (
    <>
      <Seo title="Login" description="Log in to your Vyomkesh Industries account." />
      <section className="container py-16 flex items-center justify-center min-h-[calc(100vh-128px)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">Login to Your Account</CardTitle>
            <p className="text-sm text-muted-foreground">Enter your details to access your dashboard.</p>
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
                  placeholder="you@example.com"
                />
              </div>
              <div className="relative">
                <Label htmlFor="phone">Phone number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  className="mt-2 w-full"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91-XXXXXXXXXX"
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
                />
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button className="w-full" type="submit">Continue</Button>
            </form>
            <p className="mt-4 text-sm text-center">
              No account?{" "}
              <Link className="text-primary hover:underline" to="/signup">
                Sign up
              </Link>
            </p>
            <p className="mt-2 text-sm text-center">
              <Link className="text-muted-foreground hover:underline" to="/forgot">
                Forgot password?
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}