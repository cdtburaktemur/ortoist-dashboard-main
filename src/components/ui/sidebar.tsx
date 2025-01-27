import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, LogOut, LayoutDashboard, ClipboardList, FileText, BarChart2, Settings, Plus } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: "technician" | "doctor";
  createdAt: string;
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showJobDialog, setShowJobDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    patientName: "",
    jobName: "",
    price: "",
    customDoctorName: "",
  });
  
  const [doctors, setDoctors] = useState<User[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [doctorInputType, setDoctorInputType] = useState<"registered" | "custom">("registered");

  // Kayıtlı doktorları yükle
  useEffect(() => {
    if (showJobDialog) {
      try {
        const users = JSON.parse(localStorage.getItem("users") || "[]");
        const doctorUsers = users.filter((user: User) => user.role === "doctor");
        setDoctors(doctorUsers);
      } catch (error) {
        console.error("Doktor listesi yüklenirken hata:", error);
        toast({
          title: "Hata",
          description: "Doktor listesi yüklenirken bir hata oluştu",
          variant: "destructive"
        });
      }
    }
  }, [showJobDialog]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser?.email) {
      toast({
        title: "Hata",
        description: "Oturum açmanız gerekiyor.",
        variant: "destructive"
      });
      return;
    }

    // Form validasyonu
    if (doctorInputType === "registered" && !selectedDoctorId) {
      toast({
        title: "Hata",
        description: "Lütfen bir doktor seçin",
        variant: "destructive"
      });
      return;
    }

    if (doctorInputType === "custom" && !formData.customDoctorName.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen doktor adını girin",
        variant: "destructive"
      });
      return;
    }

    if (!formData.patientName.trim() || !formData.jobName.trim() || !formData.price) {
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doldurun",
        variant: "destructive"
      });
      return;
    }

    try {
      // Mevcut işleri al
      const storageKey = `${currentUser.email}_jobs`;
      const existingJobs = JSON.parse(localStorage.getItem(storageKey) || "[]");
      
      // Doktor bilgilerini hazırla
      let doctorName = "";
      let doctorEmail = null;

      if (doctorInputType === "registered") {
        const selectedDoctor = doctors.find(d => d.email === selectedDoctorId);
        if (!selectedDoctor) {
          toast({
            title: "Hata",
            description: "Seçilen doktor bulunamadı",
            variant: "destructive"
          });
          return;
        }
        doctorName = selectedDoctor.fullName;
        doctorEmail = selectedDoctor.email;
      } else {
        doctorName = formData.customDoctorName.trim();
      }

      // Yeni işi oluştur
      const newJob = {
        id: Date.now(),
        patientName: formData.patientName.trim(),
        jobName: formData.jobName.trim(),
        price: formData.price,
        doctorName,
        doctorEmail,
        status: "pending",
        paymentReceived: false,
        date: new Date().toISOString().split('T')[0],
        technicianEmail: currentUser.email
      };
      
      // Yeni işi listeye ekle ve kaydet
      const updatedJobs = [...existingJobs, newJob];
      localStorage.setItem(storageKey, JSON.stringify(updatedJobs));
      
      // Bekleyen işleri güncelle
      const pendingJobs = updatedJobs.filter(job => job.status === "pending").length;
      localStorage.setItem(`${currentUser.email}_pendingJobs`, pendingJobs.toString());
      
      window.dispatchEvent(new CustomEvent('jobUpdate', { 
        detail: { type: 'update', count: pendingJobs }
      }));

      toast({
        title: "Başarılı",
        description: "Yeni iş kaydı oluşturuldu.",
      });

      // Formu sıfırla ve dialog'u kapat
      setFormData({
        patientName: "",
        jobName: "",
        price: "",
        customDoctorName: "",
      });
      setSelectedDoctorId("");
      setDoctorInputType("registered");
      setShowJobDialog(false);
      
    } catch (error) {
      console.error("İş kaydı oluşturulurken hata:", error);
      toast({
        title: "Hata",
        description: "İş kaydı oluşturulurken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Çıkış yapılırken hata:", error);
    }
  };

  return (
    <>
      <div className={cn("pb-12 h-screen bg-background border-r w-52", className)}>
        <div className="space-y-4 py-4">
          <div className="px-2 py-2">
            <div className="mb-6 px-2">
              <h1 className="text-xl font-bold">Ortoist</h1>
            </div>
            <div className="space-y-1">
              <NavLink to="/dashboard">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Ana Sayfa
                </Button>
              </NavLink>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setShowJobDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                İş Ekle
              </Button>
              <NavLink to="/job-list">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  İş Takibi
                </Button>
              </NavLink>
              <NavLink to="/price-list">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Fiyat Listesi
                </Button>
              </NavLink>
              <NavLink to="/statistics">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <BarChart2 className="mr-2 h-4 w-4" />
                  İstatistikler
                </Button>
              </NavLink>
              <NavLink to="/preferences">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Tercihler
                </Button>
              </NavLink>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Çıkış Yap
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* İş Ekleme Dialog */}
      <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
        <DialogContent className="sm:max-w-[425px]" aria-describedby="job-dialog-description">
          <DialogHeader>
            <DialogTitle>Yeni İş Ekle</DialogTitle>
            <DialogDescription id="job-dialog-description">
              Yeni iş detaylarını girin. Tüm alanlar zorunludur.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label>Doktor Seçimi</Label>
              <Tabs 
                defaultValue="registered" 
                value={doctorInputType}
                onValueChange={(value) => {
                  setDoctorInputType(value as "registered" | "custom");
                  setSelectedDoctorId("");
                  setFormData(prev => ({ ...prev, customDoctorName: "" }));
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="registered">Kayıtlı Doktor</TabsTrigger>
                  <TabsTrigger value="custom">Yeni Doktor</TabsTrigger>
                </TabsList>
                <TabsContent value="registered" className="mt-4">
                  <Select
                    value={selectedDoctorId}
                    onValueChange={setSelectedDoctorId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Doktor seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.length > 0 ? (
                        doctors.map((doctor) => (
                          <SelectItem key={doctor.email} value={doctor.email}>
                            {doctor.fullName}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-doctor" disabled>
                          Kayıtlı doktor bulunamadı
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </TabsContent>
                <TabsContent value="custom" className="mt-4">
                  <Input
                    name="customDoctorName"
                    value={formData.customDoctorName}
                    onChange={handleChange}
                    className="input-ring dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    placeholder="Doktor adını girin"
                  />
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="patientName">Hasta Adı</Label>
              <Input
                id="patientName"
                name="patientName"
                value={formData.patientName}
                onChange={handleChange}
                className="input-ring dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder="Hasta adını giriniz"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jobName">İşin Adı</Label>
              <Input
                id="jobName"
                name="jobName"
                value={formData.jobName}
                onChange={handleChange}
                className="input-ring dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder="Yapılacak işi giriniz"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Ücret (TL)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                className="input-ring dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
            
            <Button type="submit" className="w-full">
              İş Kaydını Oluştur
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 -ml-2">
          <Menu className="h-7 w-7" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-48 p-0">
        <SheetTitle className="px-4 py-3 text-left border-b">
          Menü
        </SheetTitle>
        <ScrollArea className="h-[calc(100vh-57px)]">
          <Sidebar className="w-full border-0" />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}