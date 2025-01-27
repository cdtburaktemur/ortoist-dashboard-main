import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { DollarSign, Users, ClipboardCheck, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Job {
  id: number;
  doctorName: string;
  patientName: string;
  jobName: string;
  price: string;
  status: "completed" | "pending";
  paymentReceived: boolean;
  date: string;
}

const Index = () => {
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activePatients: 0,
    completedJobs: 0,
    pendingJobs: 0
  });

  useEffect(() => {
    if (isAuthenticated) {
      const jobs: Job[] = JSON.parse(localStorage.getItem("jobs") || "[]");
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthlyJobs = jobs.filter(job => {
        const jobDate = new Date(job.date);
        return jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear;
      });

      // Sadece ödemesi alınan işlerin toplam kazancını hesapla
      const totalEarnings = monthlyJobs
        .filter(job => job.status === "completed" && job.paymentReceived)
        .reduce((sum, job) => sum + Number(job.price), 0);
        
      const uniquePatients = new Set(jobs.map(job => job.patientName)).size;
      const completedJobs = jobs.filter(job => job.status === "completed").length;
      const pendingJobs = jobs.filter(job => job.status === "pending").length;

      setStats({
        totalEarnings,
        activePatients: uniquePatients,
        completedJobs,
        pendingJobs
      });

      // Update notification count in localStorage
      localStorage.setItem("pendingJobs", pendingJobs.toString());
      
      // Dispatch custom event for header notification update
      const event = new CustomEvent('jobUpdate', { 
        detail: { 
          type: 'update',
          count: pendingJobs
        }
      });
      window.dispatchEvent(event);
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      toast({
        title: "Başarılı",
        description: "Giriş yapıldı",
      });
      navigate("/");
    } else {
      toast({
        title: "Hata",
        description: "Kullanıcı adı veya şifre hatalı",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card p-8 rounded-lg shadow-lg w-96 border border-border">
          <h1 className="text-2xl font-bold mb-6 text-center text-foreground">Giriş Yap</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-1">
                Kullanıcı Adı
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                Şifre
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full">
              Giriş Yap
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Toplam Kazanç",
      value: `₺${stats.totalEarnings.toLocaleString('tr-TR')}`,
      icon: DollarSign,
      change: "+12%",
      changeType: "increase",
    },
    {
      title: "Aktif Hastalar",
      value: stats.activePatients.toString(),
      icon: Users,
      change: "+3",
      changeType: "increase",
    },
    {
      title: "Tamamlanan İşler",
      value: stats.completedJobs.toString(),
      icon: ClipboardCheck,
      change: "+8",
      changeType: "increase",
    },
    {
      title: "Bekleyen İşler",
      value: stats.pendingJobs.toString(),
      icon: Clock,
      change: "-2",
      changeType: "decrease",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="p-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="p-6 hover-scale card-shadow dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.title}</p>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</h3>
                    </div>
                    <div className={`p-3 rounded-full ${
                      index === 0 ? "bg-primary-100 text-primary-500 dark:bg-primary-900 dark:text-primary-300" :
                      index === 1 ? "bg-blue-100 text-blue-500 dark:bg-blue-900 dark:text-blue-300" :
                      index === 2 ? "bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-300" :
                      "bg-orange-100 text-orange-500 dark:bg-orange-900 dark:text-orange-300"
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className={`text-sm font-medium ${
                      stat.changeType === "increase" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400"> bu ay</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;