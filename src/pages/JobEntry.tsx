import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

const JobEntry = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
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
    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      console.log("Tüm kullanıcılar:", users);
      
      const doctorUsers = users.filter((user: User) => user.role === "doctor");
      console.log("Filtrelenmiş doktorlar:", doctorUsers);
      
      setDoctors(doctorUsers);
    } catch (error) {
      console.error("Doktor listesi yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Doktor listesi yüklenirken bir hata oluştu",
        variant: "destructive"
      });
    }
  }, []);

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

      console.log("Yeni iş kaydı:", newJob);
      
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

      // Formu sıfırla
      setFormData({
        patientName: "",
        jobName: "",
        price: "",
        customDoctorName: "",
      });
      setSelectedDoctorId("");
      setDoctorInputType("registered");

      // İş listesi sayfasına yönlendir
      navigate("/job-list");
      
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

  return (
    <div className="flex-1 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 dark:bg-gray-800">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Yeni İş Girişi</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Yeni iş detaylarını girin. Tüm alanlar zorunludur.
          </p>
          
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
                        <SelectItem value="" disabled>
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
        </Card>
      </div>
    </div>
  );
};

export default JobEntry;