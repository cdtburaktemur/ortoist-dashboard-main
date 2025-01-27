import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { DoctorMobileSidebar } from "@/components/ui/doctor-sidebar";
import { MobileSidebar } from "@/components/ui/sidebar";

export default function Header() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const isDoctor = currentUser?.role === "doctor";

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-4">
        {isDoctor ? <DoctorMobileSidebar /> : <MobileSidebar />}
        <span className="text-lg font-semibold">Hoşgeldiniz</span>
      </div>

      <div className="flex items-center gap-4">
        {!isDoctor && (
          <div className="text-sm text-muted-foreground">
            Bekleyen İşler:{" "}
            <span className="font-medium text-foreground">
              {localStorage.getItem(`${currentUser?.email}_pendingJobs`) || "0"}
            </span>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {currentUser?.fullName ? getInitials(currentUser.fullName) : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{currentUser?.fullName}</p>
                <p className="text-xs leading-none text-muted-foreground">{currentUser?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/preferences')}>
              Tercihler
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}