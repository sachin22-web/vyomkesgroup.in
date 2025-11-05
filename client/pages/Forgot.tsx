import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo"; // Import Seo component

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const r = await fetch("/api/auth/request-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!r.ok) {
      setError("Failed to request reset. Please check your email.");
      return;
    }
    const j = await r.json();
    setSent(j.token || "sent");
  };

  return (
    <>
      <Seo title="Forgot Password" description="Request a password reset link for your account." />
      <section className="container py-16 flex items-center justify-center min-h-[calc(100vh-128px)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">Reset Your Password</CardTitle>
            <p className="text-sm text-muted-foreground">Enter your email to receive a password reset link.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  className="mt-2 w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button className="w-full" type="submit" disabled={!!sent}>
                {sent ? "Reset Link Sent!" : "Send Reset Link"}
              </Button>
            </form>
            {sent && (
              <div className="mt-4 text-sm text-center">
                <p className="text-green-600">A password reset link has been sent to your email.</p>
                {import.meta.env.DEV && ( // Show token in dev mode for convenience
                  <p className="mt-2">
                    Token (demo): <code className="px-2 py-1 rounded bg-secondary">{sent}</code>
                  </p>
                )}
              </div>
            )}
            <p className="mt-4 text-sm text-center">
              <Link className="text-primary hover:underline" to="/login">
                Back to Login
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}