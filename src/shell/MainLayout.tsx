
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  Bell,
  Search,
  Menu,
  ChevronRight,
} from "lucide-react";
import Sidebar from "../components/layout/Sidebar";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/projects": "Projects",
  "/tasks": "My Tasks",
  "/issues": "Issue Tracker",
  "/team": "Team Workspace",
  "/settings": "Settings",
};

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const currentPage = pageTitles[location.pathname] || "Workspace";

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#191B1D] text-[#F2F0ED]">

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      {/* Responsive sidebar */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={closeMobileMenu}
      />

      {/* Main content area */}
      <div className="min-h-screen min-w-0 w-full md:pl-64">

        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center justify-between gap-3 border-b border-[#3B4145] bg-[#191B1D]/95 px-4 backdrop-blur-md sm:px-6">

          <div className="flex min-w-0 items-center gap-3">

            {/* Hamburger - mobile only */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="shrink-0 rounded-lg p-2 text-[#F2F0ED] hover:bg-[#32373A] md:hidden"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={22} />
            </button>

            <div className="flex min-w-0 items-center gap-2">
              <span className="hidden text-sm text-[#777D80] sm:block">
                Workspace
              </span>
              <ChevronRight
                size={15}
                className="hidden text-[#777D80] sm:block"
              />
              <h2 className="truncate text-base font-semibold sm:text-lg">
                {currentPage}
              </h2>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">

            <div className="hidden items-center gap-2 rounded-lg border border-[#3B4145] bg-[#292D30] px-3 py-2 lg:flex">
              <Search size={16} className="text-[#777D80]" />
              <input
                type="text"
                placeholder="Search..."
                className="w-32 bg-transparent text-sm text-[#F2F0ED] outline-none placeholder:text-[#777D80] xl:w-48"
              />
            </div>

            <button
              className="relative rounded-lg p-2 text-[#A5A5A2] hover:bg-[#32373A] hover:text-[#F2F0ED]"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#C47B50]" />
            </button>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C47B50] text-sm font-bold text-[#191B1D]">
              K
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)] min-w-0 w-full p-4 sm:p-6 lg:p-8">
          <div className="mx-auto min-w-0 w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
