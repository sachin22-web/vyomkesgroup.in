import { Link, NavLink } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Menu } from "lucide-react"; // Import Menu icon
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"; // Import Sheet components

interface NavPage {
  _id: string;
  title: string;
  slug: string;
  inHeader: boolean;
  sortOrder: number;
}

function NavItem({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive ? "text-accent-foreground bg-white/10" : "text-white hover:text-accent-foreground hover:bg-white/5"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export function Header() {
  const [headerPages, setHeaderPages] = useState<NavPage[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false); // State for mobile sheet

  useEffect(() => {
    const fetchNavPages = async () => {
      try {
        const pages = await api<NavPage[]>("/api/pages/nav");
        // Filter out the 'about' slug if it's still coming from dynamic pages, as we have a dedicated one now.
        setHeaderPages(pages.filter(p => p.inHeader && p.slug !== 'about').sort((a, b) => a.sortOrder - b.sortOrder));
      } catch (e) {
        console.error("Failed to fetch header navigation pages:", e);
      }
    };
    fetchNavPages();
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-header-footer-blue/80 bg-header-footer-blue text-white shadow-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white grid place-items-center">
            <span className="text-header-footer-blue font-black">V</span>
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">Vyomkesh Industries</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <NavItem to="/plans">Plans</NavItem>
          <NavItem to="/about">About</NavItem> {/* Link to the new About page */}
          {headerPages.map((page) => (
            <NavItem key={page._id} to={`/pages/${page.slug}`}>
              {page.title}
            </NavItem>
          ))}
        </nav>

        {/* Mobile Navigation (Sheet) */}
        <div className="md:hidden flex items-center gap-2">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"> {/* Added focus-visible styles */}
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] sm:w-[300px] bg-header-footer-blue text-white border-r-0">
              <div className="flex flex-col gap-4 p-4">
                <SheetClose asChild>
                  <Link to="/" className="flex items-center gap-3 mb-4">
                    <div className="h-9 w-9 rounded-xl bg-white grid place-items-center">
                      <span className="text-header-footer-blue font-black">V</span>
                    </div>
                    <span className="font-extrabold text-lg tracking-tight text-white">Vyomkesh Industries</span>
                  </Link>
                </SheetClose>
                <NavItem to="/plans" onClick={() => setIsSheetOpen(false)}>Plans</NavItem>
                <NavItem to="/about" onClick={() => setIsSheetOpen(false)}>About</NavItem> {/* Link to the new About page */}
                {headerPages.map((page) => (
                  <NavItem key={page._id} to={`/pages/${page.slug}`} onClick={() => setIsSheetOpen(false)}>
                    {page.title}
                  </NavItem>
                ))}
                <div className="border-t border-white/20 pt-4 mt-4 space-y-2">
                  <SheetClose asChild>
                    <Button asChild variant="ghost" className="w-full justify-start text-white hover:bg-white/10 hover:text-white">
                      <Link to="/login">Login</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild variant="outline" className="w-full justify-start border-white text-white hover:bg-white hover:text-header-footer-blue">
                      <Link to="/signup">Sign up</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      onClick={() => {
                        setIsSheetOpen(false);
                        const element = document.getElementById('calculator');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="w-full justify-start rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      Calculate Returns
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Auth Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <Button asChild variant="ghost" className="text-white hover:bg-white/20 hover:text-white">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild className="bg-white text-header-footer-blue font-semibold hover:bg-white/90">
            <Link to="/signup">Sign up</Link>
          </Button>
          <Button
            onClick={() => {
              const element = document.getElementById('calculator');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Calculate Returns
          </Button>
        </div>
      </div>
    </header>
  );
}
