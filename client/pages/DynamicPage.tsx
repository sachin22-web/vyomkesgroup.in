import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Img } from "@/components/Img"; // Import the Img component
import { Seo } from "@/components/Seo"; // Import Seo component

interface PageContent {
  title: string;
  content: string;
  bannerImageUrl?: string; // New field for banner image
}

export default function DynamicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("Page slug is missing.");
      setLoading(false);
      return;
    }

    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api<PageContent>(`/api/pages/${slug}`);
        setPage(data);
      } catch (e: any) {
        setError(e?.message || "Failed to load page content.");
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <section className="container py-12 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container py-12 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!page) {
    return (
      <section className="container py-12 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Page Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The requested page could not be found.</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <>
      <Seo title={page.title} description={page.content.substring(0, 160).replace(/<[^>]*>?/gm, '')} ogImage={page.bannerImageUrl} />
      <section className="container py-12 max-w-4xl">
        {page.bannerImageUrl && (
          <Img
            src={page.bannerImageUrl}
            alt={page.title}
            className="w-full h-48 md:h-64 object-cover rounded-xl border mb-8"
          />
        )}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">{page.title}</h1>
        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
      </section>
    </>
  );
}