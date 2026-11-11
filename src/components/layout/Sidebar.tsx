
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Bug,
  Users,
  Settings,
  LogOut,
  X,
  Code2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Projects", path: "/projects", icon: FolderKanban },
  { name: "My Tasks", path: "/tasks", icon: CheckSquare },
  { name: "Issue Tracker", path: "/issues", icon: Bug },
  { name: "Team Workspace", path: "/team", icon: Users },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    onClose();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50
        flex h-screen w-64 flex-col
        border-r border-[#3B4145]
        bg-[#292D30] text-[#F2F0ED]
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
    >
      {/* Brand */}
      <div className="flex h-20 items-center justify-between border-b border-[#3B4145] px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C47B50]">
            <Code2 size={22} className="text-[#191B1D]" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">DevFlow</h1>
            <p className="text-xs text-[#A5A5A2]">Developer Workspace</p>
          </div>
        </div>

        {/* Close button only on mobile */}
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-[#A5A5A2] hover:bg-[#3B4145] md:hidden"
          aria-label="Close navigation menu"
        >
          <X size={21} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-[#777D80]">
          Workspace
        </p>

        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#C47B50]/15 text-[#E9B28D]"
                    : "text-[#A5A5A2] hover:bg-[#32373A] hover:text-[#F2F0ED]"
                }`
              }
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="space-y-2 border-t border-[#3B4145] p-4">
        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "bg-[#C47B50]/15 text-[#E9B28D]"
                : "text-[#A5A5A2] hover:bg-[#32373A] hover:text-[#F2F0ED]"
            }`
          }
        >
          <Settings size={19} />
          Settings
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#E47770] transition-colors hover:bg-[#E47770]/10"
        >
          <LogOut size={19} />
          Sign Out
        </button>

        <p className="px-3 pt-2 text-xs text-[#777D80]">
          DevFlow Workspace
        </p>
      </div>
    </aside>
  );
}
