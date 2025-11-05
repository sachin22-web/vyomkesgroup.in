import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Frown } from "lucide-react"; // Import an icon
import { Seo } from "@/components/Seo"; // Import Seo component

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.warn(
        "404: attempted to access non-existent route",
        location.pathname,
      );
    }
  }, [location.pathname]);

  return (
    <>
      <Seo title="Page Not Found" description="The page you are looking for does not exist." />
      <div className="min-h-[calc(100vh-128px)] flex items-center justify-center bg-background text-foreground">
        <div className="text-center p-6 max-w-md">
          <Frown className="h-24 w-24 text-primary mx-auto mb-6" aria-hidden="true" />
          <h1 className="text-5xl font-bold mb-4">404 - Page Not Found</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Oops! The page you're looking for doesn't exist.
          </p>
          <Link to="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFound;