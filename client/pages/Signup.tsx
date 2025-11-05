import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo"; // Import Seo component

export default function Signup() {
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralId, setReferralId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setReferralId(refCode);
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      await api("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name,
          email: email || undefined,
          phone: phone || undefined,
          password,
          confirmPassword,
          referralId: referralId || undefined,
        }),
      });
      await refresh();
      window.location.href = "/app";
    } catch (err: any) {
      setError(err.message || "Could not sign up. Please try again.");
    }
  };

  return (
    <>
      <Seo title="Sign Up" description="Create your account with Vyomkesh Industries and start investing." />
      <section className="container py-16 flex items-center justify-center min-h-[calc(100vh-128px)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">Create Your Account</CardTitle>
            <p className="text-sm text-muted-foreground">Join Vyomkesh Industries and start your investment journey.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  className="mt-2 w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
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
              <div>
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
                  autoComplete="new-password"
                  className="mt-2 w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className="mt-2 w-full"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <Label htmlFor="referralId">Referral ID (Optional)</Label>
                <Input
                  id="referralId"
                  className="mt-2 w-full"
                  value={referralId}
                  onChange={(e) => setReferralId(e.target.value)}
                  placeholder="Enter referral code"
                />
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button className="w-full" type="submit">Create account</Button>
            </form>
            <p className="mt-4 text-sm text-center">
              Already have an account?{" "}
              <Link className="text-primary hover:underline" to="/login">
                Login
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}