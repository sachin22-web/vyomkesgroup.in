import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { UserCircle2 } from "lucide-react"; // Import an icon
import { Img } from "@/components/Img"; // Import the Img component
import { Seo } from "@/components/Seo"; // Import Seo component

export default function Profile() {
  const { user, refresh, logout } = useAuth();

  return (
    <>
      <Seo title="Your Profile" description="View and manage your personal profile details." />
      <div className="grid gap-6">
        <h1 className="text-2xl font-semibold">Your Profile</h1> {/* Changed to h1 */}

        <Img
          src="/images/professional_profile.jpg" // Professional profile
          alt="User profile with professional setting"
          className="w-full h-48 object-cover rounded-xl border"
        />

        <Card>
          <CardContent className="p-5 grid gap-4 text-sm">
            {user ? (
              <>
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                  <UserCircle2 className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold">{user.name}</h2> {/* Changed to h2 */}
                    <p className="text-muted-foreground">{user.email || user.phone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-t pt-4">
                  <p className="text-muted-foreground">Full Name</p>
                  <p className="col-span-2 font-medium">{user.name}</p>
                  <p className="text-muted-foreground">Email Address</p>
                  <p className="col-span-2 font-medium">
                    {user.email || "—"}
                  </p>
                  <p className="text-muted-foreground">Phone Number</p>
                  <p className="col-span-2 font-medium">
                    {user.phone || "—"}
                  </p>
                  <p className="text-muted-foreground">Roles</p>
                  <p className="col-span-2 font-medium">
                    {user.roles?.join(", ")}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-end mt-4 border-t pt-4">
                  <Button variant="outline" onClick={refresh} className="w-full sm:w-auto">
                    Refresh Data
                  </Button>
                  <Button onClick={logout} variant="destructive" className="w-full sm:w-auto">Logout</Button>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground text-center py-4">You are not logged in.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}