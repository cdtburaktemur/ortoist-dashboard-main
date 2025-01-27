import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import * as XLSX from 'xlsx';
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface PriceItem {
  type: string;
  price: number;
  notes: string;
}

const formSchema = z.object({
  darkMode: z.boolean(),
  autoSave: z.boolean(),
});

const Preferences = () => {
  const { currentUser } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      darkMode: document.documentElement.classList.contains("dark"),
      autoSave: true,
    },
  });

  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  const handleDarkModeToggle = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Geçmiş işleri silmek istediğinize emin misiniz?")) {
      localStorage.removeItem("jobs");
      toast.success("Geçmiş işler başarıyla silindi", {
        duration: 3000,
      });
    }
  };

  const downloadTemplate = () => {
    try {
      // Örnek veri oluştur
      const data = [
        { 
          'YAPILACAK İŞİN CİNSİ (TEK ÇENE)': 'Standart Tedavi', 
          'FİYAT': 5000,
          'FİYATA EKLENECEK BİLGİLER': 'Örnek not'
        },
        { 
          'YAPILACAK İŞİN CİNSİ (TEK ÇENE)': 'Premium Tedavi', 
          'FİYAT': 7500,
          'FİYATA EKLENECEK BİLGİLER': 'Premium hizmet içerir'
        }
      ];

      // Excel dosyası oluştur
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Sütun genişliklerini ayarla
      ws['!cols'] = [
        { wch: 40 }, // İş cinsi sütunu
        { wch: 15 }, // Fiyat sütunu
        { wch: 40 }  // Notlar sütunu
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Fiyat Listesi');

      // Dosyayı indir
      XLSX.writeFile(wb, 'fiyat-listesi-sablonu.xlsx');
      toast.success("Fiyat listesi şablonu indirildi", {
        duration: 3000,
      });
    } catch (error) {
      toast.error("Şablon indirilirken bir hata oluştu", {
        duration: 3000,
      });
    }
  };

  const getStorageKey = (key: string) => {
    return `${currentUser?.email}_${key}`;
  };

  const handlePriceListUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser?.email || !event.target.files || !event.target.files[0]) return;
    
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];

        // Excel verilerini PriceItem formatına dönüştür
        const formattedData = jsonData.map((row: any) => ({
          type: row['YAPILACAK İŞİN CİNSİ (TEK ÇENE)'] || '',
          price: parseFloat(row['FİYAT']) || 0,
          notes: row['FİYATA EKLENECEK BİLGİLER'] || ''
        }));

        // Sadece geçerli verileri filtrele
        const validData = formattedData.filter(item => item.type && item.price > 0);

        if (validData.length === 0) {
          toast.error('Excel dosyasında geçerli veri bulunamadı. Lütfen şablona uygun bir dosya yükleyin.');
          return;
        }

        // Kullanıcıya özel olarak kaydet
        localStorage.setItem(getStorageKey('priceList'), JSON.stringify(validData));
        
        toast.success('Fiyat listesi başarıyla yüklendi');

        // Input'u temizle
        event.target.value = '';
      } catch (error) {
        console.error('Excel yükleme hatası:', error);
        toast.error('Excel dosyası okunurken bir hata oluştu. Lütfen şablona uygun bir dosya yükleyin.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleClearPriceList = () => {
    if (!currentUser?.email) return;
    localStorage.removeItem(getStorageKey('priceList'));
    toast.success('Fiyat listesi temizlendi');
  };

  const clearCompletedJobs = () => {
    const allJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
    const activeJobs = allJobs.filter(
      (job: any) => job.status === "pending" || (job.status === "completed" && !job.paymentReceived)
    );
    localStorage.setItem("jobs", JSON.stringify(activeJobs));
    toast({
      title: "Geçmiş işler temizlendi",
      description: "Tamamlanmış ve ödemesi alınmış tüm işler silindi.",
      duration: 3000,
    });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Karanlık mod değişikliğini hemen uygula
    if (values.darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    
    // Tercihleri kaydet
    localStorage.setItem("preferences", JSON.stringify(values));
    
    // Kullanıcıya bildirim göster
    toast({
      title: "Tercihler güncellendi",
      description: "Tercihleriniz başarıyla kaydedildi.",
      duration: 3000,
    });
  };

  useEffect(() => {
    // Tema tercihini localStorage'dan al
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      form.setValue("darkMode", true);
    } else {
      document.documentElement.classList.remove("dark");
      form.setValue("darkMode", false);
    }

    // Diğer tercihleri localStorage'dan al
    const savedPreferences = localStorage.getItem("preferences");
    if (savedPreferences) {
      const preferences = JSON.parse(savedPreferences);
      form.reset(preferences);
    }
  }, [form]);

  const isDoctor = currentUser?.role === "doctor";

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Tercihler</h1>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Karanlık Mod</h2>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Karanlık Mod</Label>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={handleDarkModeToggle}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Otomatik Kaydetme</h2>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-save">Otomatik Kaydet</Label>
              <Switch
                id="auto-save"
                checked={form.watch("autoSave")}
                onCheckedChange={(checked) => form.setValue("autoSave", checked)}
              />
            </div>
          </Card>

          {!isDoctor && (
            <Card className="p-6">
              <h2 className="text-lg font-medium mb-4">Fiyat Listesi Yönetimi</h2>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label>Fiyat Listesi İşlemleri</Label>
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={downloadTemplate} className="text-sm">
                      Şablon İndir
                    </Button>
                    <div className="relative">
                      <Input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handlePriceListUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button className="text-sm">Fiyat Listesi Yükle</Button>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={handleClearPriceList} 
                      className="text-sm"
                    >
                      Fiyat Listesini Sil
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Fiyat listesini yüklemek için önce şablonu indirin ve Excel dosyasını bu formata göre düzenleyin.
                    Yeni bir fiyat listesi yüklemeden önce mevcut listeyi silmeniz gerekir.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Veri Yönetimi</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label>Geçmiş İşleri Temizle</Label>
                <div className="flex gap-4">
                  <Button
                    variant="destructive"
                    onClick={handleClearHistory}
                    className="text-sm"
                  >
                    Geçmişi Temizle
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tüm geçmiş işleri kalıcı olarak siler. Bu işlem geri alınamaz.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Preferences;