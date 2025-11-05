import { Link, NavLink, Outlet, Navigate } from "react-router-dom";
import { PropsWithChildren } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Menu } from "lucide-react"; // Import LogOut and Menu icons
import { Button } from "@/components/ui/button"; // Import Button component
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"; // Import Sheet components
import { useState } from "react"; // Import useState
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for loading state

function Item({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-md text-sm ${isActive ? "bg-primary/10 text-primary" : "text-foreground/70 hover:text-foreground"}`
      }
    >
      {children}
    </NavLink>
  );
}

export function UserShell({ children }: PropsWithChildren) {
  const { user, loading, logout } = useAuth(); // Get loading state
  const [isSheetOpen, setIsSheetOpen] = useState(false); // State for mobile sheet

  const doLogout = async () => {
    try {
      await logout();
    } finally {
      window.location.href = "/login"; // Redirect to login page after logout
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-48 mx-auto" />
          <Skeleton className="h-6 w-64 mx-auto" />
          <Skeleton className="h-10 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // If not loading and no user, redirect to login
  if (!user && !loading) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Mobile Header for User Shell */}
      <div className="md:hidden sticky top-0 z-30 bg-slate-900 text-white border-b p-4 flex items-center justify-between">
        <Link to="/app" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="text-xl font-semibold">User Dashboard</span>
        </Link>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[250px] sm:w-[300px] bg-slate-900 text-white p-0">
            <div className="p-6">
              <SheetClose asChild>
                <Link to="/app" className="flex items-center space-x-3 mb-8">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">V</span>
                  </div>
                  <span className="text-xl font-semibold">User Dashboard</span>
                </Link>
              </SheetClose>
              <nav className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">MAIN</div>
                <SheetClose asChild>
                  <NavLink to="/app" className={({ isActive }) => 
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span>📊</span>
                    <span>Overview</span>
                  </NavLink>
                </SheetClose>
                
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-6">FINANCE</div>
                <SheetClose asChild>
                  <NavLink to="/app/invest" className={({ isActive }) => 
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span>💰</span>
                    <span>Start Investment</span>
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/app/wallet" className={({ isActive }) => 
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span>💳</span>
                    <span>Wallet</span>
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/app/transactions" className={({ isActive }) => 
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span>📈</span>
                    <span>Transactions</span>
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/app/payouts" className={({ isActive }) => 
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span>💸</span>
                    <span>Payouts</span>
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/app/withdrawals" className={({ isActive }) => 
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span> withdrawing </span>
                    <span>Withdrawals</span>
                  </NavLink>
                </SheetClose>
                
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-6">ACCOUNT</div>
                <SheetClose asChild>
                  <NavLink to="/app/referrals" className={({ isActive }) => 
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span>🔗</span>
                    <span>Referrals</span>
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/app/kyc" className={({ isActive }) => 
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span>🆔</span>
                    <span>KYC</span>
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/app/support" className={({ isActive }) => 
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span>🎧</span>
                    <span>Support</span>
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/app/profile" className={({ isActive }) => 
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span>👤</span>
                    <span>Profile</span>
                  </NavLink>
                </SheetClose>
                
                <div className="mt-8 pt-6 border-t border-slate-700">
                  <button 
                    onClick={() => { doLogout(); setIsSheetOpen(false); }} 
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors w-full"
                  >
                    <span>🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 bg-slate-900 text-white min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="text-xl font-semibold">User Dashboard</span>
            </div>
            
            <nav className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">MAIN</div>
              <NavLink to="/app" className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span>📊</span>
                <span>Overview</span>
              </NavLink>
              
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-6">FINANCE</div>
              <NavLink to="/app/invest" className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span>💰</span>
                <span>Start Investment</span>
              </NavLink>
              <NavLink to="/app/wallet" className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span>💳</span>
                <span>Wallet</span>
              </NavLink>
              <NavLink to="/app/transactions" className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span>📈</span>
                <span>Transactions</span>
              </NavLink>
              <NavLink to="/app/payouts" className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span>💸</span>
                <span>Payouts</span>
              </NavLink>
              <NavLink to="/app/withdrawals" className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span> withdrawing </span>
                <span>Withdrawals</span>
              </NavLink>
              
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-6">ACCOUNT</div>
              <NavLink to="/app/referrals" className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span>🔗</span>
                <span>Referrals</span>
              </NavLink>
              <NavLink to="/app/kyc" className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span>🆔</span>
                <span>KYC</span>
              </NavLink>
              <NavLink to="/app/support" className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span>🎧</span>
                <span>Support</span>
              </NavLink>
              <NavLink to="/app/profile" className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span>👤</span>
                <span>Profile</span>
              </NavLink>
            </nav>
            
            <div className="mt-8 pt-6 border-t border-slate-700">
              <button 
                onClick={doLogout} 
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors w-full"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

export function AdminShell({ children }: PropsWithChildren) {
  const { user, loading, logout } = useAuth(); // Get loading state
  const [isSheetOpen, setIsSheetOpen] = useState(false); // State for mobile sheet

  const doLogout = async () => {
    try {
      await logout();
    } finally {
      window.location.href = "/admin/login";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-48 mx-auto" />
          <Skeleton className="h-6 w-64 mx-auto" />
          <Skeleton className="h-10 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // If not loading and no user, redirect to admin login
  if (!user && !loading) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Mobile Header for Admin Shell */}
      <div className="md:hidden sticky top-0 z-30 bg-slate-900 text-white border-b p-4 flex items-center justify-between">
        <Link to="/admin" className="font-bold text-lg">Admin Panel</Link>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle admin menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[250px] sm:w-[300px] bg-slate-900 text-white p-0">
            <div className="p-6">
              <SheetClose asChild>
                <Link to="/admin" className="flex items-center space-x-3 mb-8">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">V</span>
                  </div>
                  <span className="text-xl font-semibold">Admin Panel</span>
                </Link>
              </SheetClose>
              
              <nav className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">MAIN</div>
                <SheetClose asChild>
                  <NavLink to="/admin" className={({ isActive }) => 
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span>📊</span>
                    <span>Dashboard</span>
                  </NavLink>
                </SheetClose>
                
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-6">MANAGEMENT</div>
                <SheetClose asChild>
                  <NavLink to="/admin/users" className={({ isActive }) => 
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span>👥</span>
                    <span>Users</span>
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/admin/kyc" className={({ isActive }) => // New KYC link
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span>🆔</span> {/* KYC icon */}
                    <span>KYC Verification</span>
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/admin/plans" className={({ isActive }) => 
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span>📋</span>
                    <span>Plans & Rules</span>
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/admin/investments" className={({ isActive }) => 
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span>💰</span>
                    <span>Investments</span>
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/admin/wallet" className={({ isActive }) => 
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span>💳</span>
                    <span>Wallet & Ledger</span>
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/admin/referrals" className={({ isActive }) => 
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span>🔗</span>
                    <span>Referrals</span>
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/admin/support" className={({ isActive }) => 
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span>🎧</span>
                    <span>Support Desk</span>
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/admin/pages" className={({ isActive }) => // New link for Pages
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span>📄</span>
                    <span>Pages</span>
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/admin/settings" className={({ isActive }) => 
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }>
                    <span>⚙️</span>
                    <span>Settings</span>
                  </NavLink>
                </SheetClose>
              </nav>
              
              <div className="mt-8 pt-6 border-t border-slate-700">
                <button 
                  onClick={() => { doLogout(); setIsSheetOpen(false); }} 
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors w-full"
                >
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 bg-slate-900 text-white min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="text-xl font-semibold">Admin Panel</span>
            </div>
            
            <nav className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">MAIN</div>
              <NavLink to="/admin" className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span>📊</span>
                <span>Dashboard</span>
              </NavLink>
              
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-6">MANAGEMENT</div>
              <NavLink to="/admin/users" className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span>👥</span>
                <span>Users</span>
              </NavLink>
              <NavLink to="/admin/kyc" className={({ isActive }) => // New KYC link
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span>🆔</span> {/* KYC icon */}
                <span>KYC Verification</span>
              </NavLink>
              <NavLink to="/admin/plans" className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span>📋</span>
                <span>Plans & Rules</span>
              </NavLink>
              <NavLink to="/admin/investments" className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span>💰</span>
                <span>Investments</span>
              </NavLink>
              <NavLink to="/admin/wallet" className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span>💳</span>
                <span>Wallet & Ledger</span>
              </NavLink>
              <NavLink to="/admin/referrals" className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span>🔗</span>
                <span>Referrals</span>
              </NavLink>
              <NavLink to="/admin/support" className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span>🎧</span>
                <span>Support Desk</span>
              </NavLink>
              <NavLink to="/admin/pages" className={({ isActive }) => // New link for Pages
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span>📄</span>
                <span>Pages</span>
              </NavLink>
              <NavLink to="/admin/settings" className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }>
                <span>⚙️</span>
                <span>Settings</span>
              </NavLink>
            </nav>
            
            <div className="mt-8 pt-6 border-t border-slate-700">
              <button 
                onClick={doLogout} 
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors w-full"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}