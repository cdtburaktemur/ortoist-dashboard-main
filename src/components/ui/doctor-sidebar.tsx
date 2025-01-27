import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, LayoutDashboard, ClipboardList, Settings, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DoctorMobileSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const links = [
    {
      label: "Ana Sayfa",
      href: "/",
      icon: (
        <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "İş Takibi",
      href: "/job-list",
      icon: (
        <ClipboardList className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Ayarlar",
      href: "/preferences",
      icon: (
        <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetTitle>Doktor Menüsü</SheetTitle>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Doktor Paneli
          </h2>
          <ScrollArea className="h-[calc(100vh-120px)] px-1">
            <div className="space-y-1">
              {links.map((link, i) => (
                <Button
                  key={i}
                  variant={location.pathname === link.href ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2 text-sm"
                  onClick={() => navigate(link.href)}
                >
                  {link.icon}
                  {link.label}
                </Button>
              ))}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-sm"
                onClick={handleLogout}
              >
                <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                Çıkış Yap
              </Button>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function DoctorSidebar({ className }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const links = [
    {
      label: "Ana Sayfa",
      href: "/",
      icon: (
        <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "İş Takibi",
      href: "/job-list",
      icon: (
        <ClipboardList className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Ayarlar",
      href: "/preferences",
      icon: (
        <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  return (
    <div className={cn("pb-12 h-screen bg-background border-r w-52", className)}>
      <div className="space-y-4 py-4">
        <div className="px-2 py-2">
          <div className="mb-6 px-2">
            <h1 className="text-xl font-bold">Ortoist</h1>
          </div>
          <div className="space-y-1">
            {links.map((link, i) => (
              <Button
                key={i}
                variant={location.pathname === link.href ? "secondary" : "ghost"}
                className="w-full justify-start gap-2 text-sm"
                onClick={() => navigate(link.href)}
              >
                {link.icon}
                {link.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
              onClick={handleLogout}
            >
              <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
