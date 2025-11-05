import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea"; // For page content
import { Img } from "@/components/Img"; // Import the Img component
import { Seo } from "@/components/Seo"; // Import Seo component

type PageItem = {
  _id: string;
  title: string;
  slug: string;
  content: string;
  inHeader: boolean;
  inFooter: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  bannerImageUrl?: string; // Added banner image URL
};

type EditState = Partial<PageItem>;

export default function AdminPages() {
  const [pages, setPages] = useState<PageItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [editingPage, setEditingPage] = useState<EditState | null>(null);

  const fetchPages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<PageItem[]>("/api/admin/pages");
      setPages(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const filteredPages = useMemo(() => {
    const base = pages || [];
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      return base.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.slug.toLowerCase().includes(s) ||
          p.content.toLowerCase().includes(s)
      );
    }
    return base;
  }, [pages, q]);

  const openNewPage = () => {
    setEditingPage({
      title: "",
      slug: "",
      content: "",
      inHeader: false,
      inFooter: false,
      isActive: true,
      sortOrder: (pages?.length || 0) + 1,
      bannerImageUrl: "",
    });
    setOpenDialog(true);
  };

  const openEditPage = (page: PageItem) => {
    setEditingPage({ ...page });
    setOpenDialog(true);
  };

  const savePage = async () => {
    if (!editingPage) return;

    try {
      const isNew = !editingPage._id;
      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/admin/pages" : `/api/admin/pages/${editingPage._id}`;

      const response = await api<PageItem>(url, {
        method,
        body: JSON.stringify(editingPage),
      });

      toast.success(`Page ${isNew ? "created" : "updated"} successfully!`);
      setOpenDialog(false);
      setEditingPage(null);
      await fetchPages(); // Refresh the list
    } catch (e: any) {
      toast.error(e?.message || "Failed to save page.");
    }
  };

  const deletePage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this page?")) return;
    try {
      await api(`/api/admin/pages/${id}`, { method: "DELETE" });
      toast.success("Page deleted successfully!");
      await fetchPages(); // Refresh the list
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete page.");
    }
  };

  return (
    <>
      <Seo title="Admin Pages" description="Manage dynamic content pages for the website, including header and footer navigation." />
      <div className="grid gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold">Dynamic Pages</h1> {/* Changed to h1 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Input
              placeholder="Search pages"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full sm:w-64"
            />
            <Button onClick={openNewPage} className="w-full sm:w-auto">New Page</Button>
          </div>
        </div>

        <Img
          src="/images/admin_cms.jpg"
          alt="Dynamic pages content management system"
          className="w-full h-48 object-cover rounded-xl border"
        />

        <Card>
          <CardContent className="p-5">
            {error && (
              <div className="text-destructive text-sm mb-2">{error}</div>
            )}
            {loading && <div>Loading pages…</div>}
            {!loading && pages?.length === 0 && (
              <div className="text-sm text-muted-foreground">No dynamic pages found.</div>
            )}
            {!loading && pages && pages.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-3">Title</th>
                      <th className="py-2 pr-3">Slug</th>
                      <th className="py-2 pr-3">Header</th>
                      <th className="py-2 pr-3">Footer</th>
                      <th className="py-2 pr-3">Active</th>
                      <th className="py-2 pr-3">Order</th>
                      <th className="py-2 pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPages.map((page) => (
                      <tr key={page._id} className="border-t">
                        <td className="py-2 pr-3">{page.title}</td>
                        <td className="py-2 pr-3">
                          <a href={`/pages/${page.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            /{page.slug}
                          </a>
                        </td>
                        <td className="py-2 pr-3">{page.inHeader ? "Yes" : "No"}</td>
                        <td className="py-2 pr-3">{page.inFooter ? "Yes" : "No"}</td>
                        <td className="py-2 pr-3">{page.isActive ? "Yes" : "No"}</td>
                        <td className="py-2 pr-3">{page.sortOrder}</td>
                        <td className="py-2 pr-3 flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditPage(page)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deletePage(page._id)}>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={openDialog} onOpenChange={(o) => { setOpenDialog(o); if (!o) setEditingPage(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPage?._id ? "Edit Page" : "Create New Page"}</DialogTitle>
            </DialogHeader>
            {editingPage && (
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={editingPage.title || ""}
                    onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug (e.g., 'my-new-page')</Label>
                  <Input
                    id="slug"
                    value={editingPage.slug || ""}
                    onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Lowercase, alphanumeric, hyphens for spaces.</p>
                </div>
                <div>
                  <Label htmlFor="bannerImageUrl">Banner Image URL (Optional)</Label>
                  <Input
                    id="bannerImageUrl"
                    value={editingPage.bannerImageUrl || ""}
                    onChange={(e) => setEditingPage({ ...editingPage, bannerImageUrl: e.target.value })}
                    className="mt-1"
                    placeholder="e.g., /images/my-banner.jpg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">A relevant image for the top of the page.</p>
                </div>
                <div>
                  <Label htmlFor="content">Content (HTML allowed)</Label>
                  <Textarea
                    id="content"
                    value={editingPage.content || ""}
                    onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                    rows={10}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">You can use basic HTML tags for formatting.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inHeader">Show in Header</Label>
                    <Switch
                      id="inHeader"
                      checked={editingPage.inHeader || false}
                      onCheckedChange={(v) => setEditingPage({ ...editingPage, inHeader: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inFooter">Show in Footer</Label>
                    <Switch
                      id="inFooter"
                      checked={editingPage.inFooter || false}
                      onCheckedChange={(v) => setEditingPage({ ...editingPage, inFooter: v })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isActive">Is Active</Label>
                    <Switch
                      id="isActive"
                      checked={editingPage.isActive || false}
                      onCheckedChange={(v) => setEditingPage({ ...editingPage, isActive: v })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sortOrder">Sort Order</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={editingPage.sortOrder || 0}
                      onChange={(e) => setEditingPage({ ...editingPage, sortOrder: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button onClick={savePage}>
                {editingPage?._id ? "Save Changes" : "Create Page"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}