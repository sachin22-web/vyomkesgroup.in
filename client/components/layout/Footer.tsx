import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface NavPage {
  _id: string;
  title: string;
  slug: string;
  inFooter: boolean;
  sortOrder: number;
}

export function Footer() {
  const [footerPages, setFooterPages] = useState<NavPage[]>([]);

  useEffect(() => {
    const fetchNavPages = async () => {
      try {
        const pages = await api<NavPage[]>("/api/pages/nav");
        // Filter out the 'about' slug if it's still coming from dynamic pages, as we have a dedicated one now.
        setFooterPages(pages.filter(p => p.inFooter && p.slug !== 'about').sort((a, b) => a.sortOrder - b.sortOrder));
      } catch (e) {
        console.error("Failed to fetch footer navigation pages:", e);
      }
    };
    fetchNavPages();
  }, []);

  return (
    <footer className="border-t border-header-footer-blue/80 bg-header-footer-blue text-white shadow-inner">
      <div className="container py-10 grid gap-8 md:grid-cols-5">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white grid place-items-center">
              <span className="text-header-footer-blue font-black">V</span>
            </div>
            <span className="font-extrabold tracking-tight text-white">Vyomkesh Industries</span>
          </div>
          <p className="text-base text-white/80">
            Regulator‑ready compliance, transparent ledgers, and dedicated support.
          </p>
        </div>
        {/* Company Links */}
        <div>
          <h4 className="font-semibold mb-3 text-white">Company</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <Link to="/about" className="hover:text-white hover:underline">About</Link> {/* Link to the new About page */}
            </li>
            {footerPages.filter(p => p.inFooter).map((page) => (
              <li key={page._id}>
                <Link to={`/pages/${page.slug}`} className="hover:text-white hover:underline">{page.title}</Link>
              </li>
            ))}
          </ul>
        </div>
        {/* Legal Links */}
        <div>
          <h4 className="font-semibold mb-3 text-white">Legal</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <Link to="/pages/terms" className="hover:text-white hover:underline">Terms</Link>
            </li>
            <li>
              <Link to="/pages/privacy" className="hover:text-white hover:underline">Privacy</Link>
            </li>
            <li>
              <Link to="/pages/risk" className="hover:text-white hover:underline">Risk Disclosure</Link>
            </li>
          </ul>
        </div>
        {/* Support Info */}
        <div>
          <h4 className="font-semibold mb-3 text-white">Support</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <a href="mailto:support@vyomkeshindustries.com" className="hover:text-white hover:underline">support@vyomkeshindustries.com</a>
            </li>
            <li>
              <Link to="/contact" className="hover:text-white hover:underline">Contact Us</Link> {/* Link to the new Contact page */}
            </li>
          </ul>
        </div>
        <div className="md:col-span-5">
          <div className="border-t border-white/20 py-4 text-center text-xs text-white/60">
            © {new Date().getFullYear()} Vyomkesh Industries. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}