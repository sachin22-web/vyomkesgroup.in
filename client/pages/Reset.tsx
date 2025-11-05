import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo"; // Import Seo component

export default function Reset() {
  const [sp] = useSearchParams();
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = sp.get("token") || "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("Missing reset token.");
      return;
    }
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!r.ok) {
        const errText = await r.text();
        throw new Error(errText || "Failed to reset password.");
      }
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Failed to reset password. The token might be invalid or expired.");
    }
  };

  return (
    <>
      <Seo title="Reset Password" description="Set a new password for your account." />
      <section className="container py-16 flex items-center justify-center min-h-[calc(100vh-128px)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">Set New Password</CardTitle>
            <p className="text-sm text-muted-foreground">Enter your new password below.</p>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="text-center space-y-4">
                <p className="text-lg text-green-600 font-semibold">Password updated successfully!</p>
                <p className="text-muted-foreground">You can now log in with your new password.</p>
                <Button asChild className="w-full">
                  <Link to="/login">Go to Login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    className="mt-2 w-full"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive text-center">{error}</p>}
                <Button className="w-full" type="submit">Update Password</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}