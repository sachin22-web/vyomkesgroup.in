import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Import Input
import { Label } from "@/components/ui/label"; // Import Label
import { Seo } from "@/components/Seo"; // Import Seo component

export default function AdminBootstrap() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const res = await fetch("/api/admin/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email: email || undefined, phone: phone || undefined, password, confirmPassword, token }),
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.href = "/admin";
    } catch (e) {
      setError("Bootstrap failed. Check token and inputs.");
    }
  };

  return (
    <>
      <Seo title="Admin Bootstrap" description="One-time setup to initialize the first admin user for the platform." />
      <section className="container py-16 max-w-md">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Initialize Admin</h1>
        <p className="text-sm text-muted-foreground mb-4">One-time setup. Requires server token.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" className="mt-2 w-full" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" className="mt-2 w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" className="mt-2 w-full" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" className="mt-2 w-full" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" className="mt-2 w-full" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="token">Bootstrap Token</Label>
            <Input id="token" className="mt-2 w-full" value={token} onChange={(e) => setToken(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full">Create Admin</Button>
        </form>
      </section>
    </>
  );
}