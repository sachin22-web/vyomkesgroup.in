import React, { PropsWithChildren } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Outlet } from "react-router-dom"; // Outlet को इंपोर्ट करें

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet /> {/* यहां Outlet को रेंडर करें */}
      </main>
      <Footer />
    </div>
  );
}