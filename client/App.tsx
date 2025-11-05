import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from 'react-helmet-async';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "@/components/layout/Layout";
import { AuthProvider } from "@/hooks/useAuth";
import Plans from "@/pages/Plans";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Forgot from "@/pages/Forgot";
import Reset from "@/pages/Reset";
import AdminBootstrap from "@/pages/AdminBootstrap";
import { UserShell, AdminShell } from "@/components/layout/AppShell";
import UserOverview from "@/pages/app/Overview";
import UserInvest from "@/pages/app/Invest";
import UserWallet from "@/pages/app/Wallet";
import UserTransactions from "@/pages/app/Transactions";
import UserPayouts from "@/pages/app/Payouts";
import UserWithdrawals from "@/pages/app/Withdrawals";
import UserReferrals from "@/pages/app/Referrals";
import UserKYC from "@/pages/app/KYC";
import UserSupport from "@/pages/app/Support";
import UserProfile from "@/pages/app/Profile";
import AdminOverview from "@/pages/admin/Overview";
import AdminLogin from "@/pages/admin/Login";
import AdminPlans from "@/pages/admin/Plans";
import AdminInvestments from "@/pages/admin/Investments";
import AdminWallet from "@/pages/admin/Wallet";
import AdminPayouts from "@/pages/admin/Payouts";
import AdminWithdrawals from "@/pages/admin/Withdrawals";
import AdminReferrals from "@/pages/admin/Referrals";
import AdminReports from "@/pages/admin/Reports";
import AdminCMS from "@/pages/admin/CMS";
import AdminSettings from "@/pages/admin/Settings";
import AdminSupport from "@/pages/admin/Support";
import AdminAudit from "@/pages/admin/Audit";
import AdminUsers from "@/pages/admin/Users";
import AdminPages from "@/pages/admin/Pages";
import DynamicPage from "@/pages/DynamicPage";
import PublicRoute from "@/components/PublicRoute";
import AdminKyc from "@/pages/admin/KYC";
import Contact from "@/pages/Contact"; // Import the new Contact page
import About from "@/pages/About"; // Import the new About page
import React from "react"; // Import React for React.Fragment

const queryClient = new QueryClient();

const App = () => (
  <React.Fragment> {/* Top-level fragment for App's return */}
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <HelmetProvider>
                <Routes>
                  {/* Routes that should have the full Layout (Header + Footer) */}
                  <Route element={<Layout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/plans" element={<Plans />} />
                    <Route path="/about" element={<About />} /> {/* New dedicated About page */}
                    <Route path="/pages/:slug" element={<DynamicPage />} />
                    <Route path="/real-estate-buy" element={<DynamicPage />} />
                    <Route path="/real-estate-sell" element={<DynamicPage />} />
                    <Route path="/stock-investments" element={<DynamicPage />} />
                    <Route path="/sip-investments" element={<DynamicPage />} />
                    <Route path="/crypto-investments" element={<DynamicPage />} />
                    <Route path="/new-projects" element={<DynamicPage />} />
                    <Route path="/contact" element={<Contact />} />
                  </Route>

                  {/* Public routes that should redirect if user is logged in */}
                  <Route element={<PublicRoute />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot" element={<Forgot />} />
                    <Route path="/reset" element={<Reset />} />
                    <Route path="/admin-bootstrap" element={<AdminBootstrap />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                  </Route>

                  {/* User Dashboard */}
                  <Route path="/app" element={<UserShell />}>
                    <Route index element={<UserOverview />} />
                    <Route path="invest" element={<UserInvest />} />
                    <Route path="wallet" element={<UserWallet />} />
                    <Route path="transactions" element={<UserTransactions />} />
                    <Route path="payouts" element={<UserPayouts />} />
                    <Route path="withdrawals" element={<UserWithdrawals />} />
                    <Route path="referrals" element={<UserReferrals />} />
                    <Route path="kyc" element={<UserKYC />} />
                    <Route path="support" element={<UserSupport />} />
                    <Route path="profile" element={<UserProfile />} />
                  </Route>

                  {/* Admin Dashboard */}
                  <Route path="/admin" element={<AdminShell />}>
                    <Route index element={<AdminOverview />} />
                    <Route path="dashboard" element={<AdminOverview />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="plans" element={<AdminPlans />} />
                    <Route path="investments" element={<AdminInvestments />} />
                    <Route path="wallet" element={<AdminWallet />} />
                    <Route path="payouts" element={<AdminPayouts />} />
                    <Route path="withdrawals" element={<AdminWithdrawals />} />
                    <Route path="referrals" element={<AdminReferrals />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="cms" element={<AdminCMS />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="support" element={<AdminSupport />} />
                    <Route path="kyc" element={<AdminKyc />} />
                    <Route path="audit" element={<AdminAudit />} />
                    <Route path="pages" element={<AdminPages />} />
                  </Route>
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </HelmetProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
    <Toaster /> {/* These are now siblings to the main app structure */}
    <Sonner />
  </React.Fragment>
);

createRoot(document.getElementById("root")!).render(<App />);