import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Job {
  id: number;
  doctorName: string;
  doctorEmail: string | null;
  patientName: string;
  jobName: string;
  price: string;
  status: string;
  date: string;
  technicianEmail: string;
  paymentReceived: boolean;
}

interface DoctorStats {
  doctorName: string;
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
  totalEarnings: number;
  pendingPayments: number;
}

export default function Statistics() {
  const { currentUser } = useAuth();
  const [doctorStats, setDoctorStats] = useState<DoctorStats[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    pendingJobs: 0,
    totalEarnings: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    const calculateStats = () => {
      if (!currentUser?.email) return;

      // Teknisyenin tüm işlerini al
      const storageKey = `${currentUser.email}_jobs`;
      const jobs: Job[] = JSON.parse(localStorage.getItem(storageKey) || "[]");

      // Doktorlara göre grupla
      const doctorGroups = jobs.reduce((groups: { [key: string]: Job[] }, job) => {
        const name = job.doctorName;
        if (!groups[name]) {
          groups[name] = [];
        }
        groups[name].push(job);
        return groups;
      }, {});

      // Her doktor için istatistikleri hesapla
      const stats = Object.entries(doctorGroups).map(([doctorName, doctorJobs]) => {
        const completedJobs = doctorJobs.filter(job => job.status === "completed" && job.paymentReceived).length;
        const pendingJobs = doctorJobs.filter(job => !job.paymentReceived).length;
        const totalEarnings = doctorJobs
          .filter(job => job.paymentReceived)
          .reduce((sum, job) => sum + parseFloat(job.price || "0"), 0);
        const pendingPayments = doctorJobs
          .filter(job => !job.paymentReceived)
          .reduce((sum, job) => sum + parseFloat(job.price || "0"), 0);

        return {
          doctorName,
          totalJobs: doctorJobs.length,
          completedJobs,
          pendingJobs,
          totalEarnings,
          pendingPayments
        };
      });

      // Toplam istatistikleri hesapla
      const totals = {
        totalJobs: jobs.length,
        completedJobs: jobs.filter(job => job.status === "completed" && job.paymentReceived).length,
        pendingJobs: jobs.filter(job => !job.paymentReceived).length,
        totalEarnings: jobs
          .filter(job => job.paymentReceived)
          .reduce((sum, job) => sum + parseFloat(job.price || "0"), 0),
        pendingPayments: jobs
          .filter(job => !job.paymentReceived)
          .reduce((sum, job) => sum + parseFloat(job.price || "0"), 0)
      };

      setDoctorStats(stats);
      setTotalStats(totals);
    };

    calculateStats();

    // İş güncellemelerini dinle
    window.addEventListener('jobUpdate', calculateStats);
    return () => window.removeEventListener('jobUpdate', calculateStats);
  }, [currentUser?.email]);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="space-y-6">
        {/* Toplam İstatistikler */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Toplam İş</h3>
            <p className="text-2xl font-bold mt-2">{totalStats.totalJobs}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Tamamlanan İşler</h3>
            <p className="text-2xl font-bold mt-2">{totalStats.completedJobs}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Bekleyen İşler</h3>
            <p className="text-2xl font-bold mt-2">{totalStats.pendingJobs}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Yapılan Toplam Ödemeler</h3>
            <p className="text-2xl font-bold mt-2">₺{totalStats.totalEarnings.toFixed(2)}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Bekleyen Ödemeler</h3>
            <p className="text-2xl font-bold mt-2">₺{totalStats.pendingPayments.toFixed(2)}</p>
          </Card>
        </div>

        {/* Doktor Bazlı İstatistikler */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Doktor Bazlı İstatistikler</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doktor</TableHead>
                  <TableHead>Toplam İş</TableHead>
                  <TableHead>Tamamlanan</TableHead>
                  <TableHead>Bekleyen</TableHead>
                  <TableHead>Yapılan Ödemeler</TableHead>
                  <TableHead>Bekleyen Ödemeler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctorStats.map((stat) => (
                  <TableRow key={stat.doctorName}>
                    <TableCell>{stat.doctorName}</TableCell>
                    <TableCell>{stat.totalJobs}</TableCell>
                    <TableCell>{stat.completedJobs}</TableCell>
                    <TableCell>{stat.pendingJobs}</TableCell>
                    <TableCell>₺{stat.totalEarnings.toFixed(2)}</TableCell>
                    <TableCell>₺{stat.pendingPayments.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {doctorStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      Henüz iş bulunmuyor
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}