import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, UserCog, Settings, LogOut, BarChart, ListOrdered } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar as UISidebar, MobileSidebar, SidebarLink } from "@/components/ui/sidebar";
import { DoctorSidebar, DoctorMobileSidebar } from "@/components/ui/doctor-sidebar";

const SidebarDemo = () => {
  const location = useLocation();
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

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
      label: "İş Girişi",
      href: "/job-entry",
      icon: (
        <UserCog className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "İş Takibi",
      href: "/job-list",
      icon: (
        <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Fiyat Listesi",
      href: "/price-list",
      icon: (
        <ListOrdered className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "İstatistikler",
      href: "/statistics",
      icon: (
        <BarChart className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Çıkış Yap",
      href: "#",
      icon: (
        <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
      onClick: handleLogout
    },
  ];

  const isDoctor = currentUser?.role === "doctor";

  if (isDoctor) {
    return (
      <>
        <div className="hidden md:block h-screen">
          <DoctorSidebar />
        </div>
        <div className="block md:hidden">
          <DoctorMobileSidebar />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="hidden md:block h-screen">
        <UISidebar />
      </div>
      <div className="block md:hidden">
        <MobileSidebar />
      </div>
    </>
  );
};

export default SidebarDemo;