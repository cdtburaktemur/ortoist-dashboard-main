import React, { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function DoctorJobList() {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<string>("active"); // "active" | "completed" | "all"

  useEffect(() => {
    if (!currentUser?.email) return;

    // Tüm teknisyenlerin işlerini al ve doktora ait olanları filtrele
    const allTechnicianJobs = Object.keys(localStorage)
      .filter(key => key.endsWith('_jobs'))
      .flatMap(key => {
        const jobs = JSON.parse(localStorage.getItem(key) || "[]");
        return jobs.filter((job: Job) => {
          // Hem email hem de isim ile eşleşmeyi kontrol et
          return job.doctorEmail === currentUser.email || 
                 (job.doctorEmail === null && job.doctorName === currentUser.fullName);
        });
      });

    // Filtreye göre işleri filtrele
    const filteredJobs = allTechnicianJobs.filter(job => {
      switch (filter) {
        case "active":
          return job.status !== "completed" || !job.paymentReceived;
        case "completed":
          return job.status === "completed" && job.paymentReceived;
        default:
          return true;
      }
    });

    setJobs(filteredJobs);

    // İş güncellemelerini dinle
    const handleJobUpdate = () => {
      const updatedJobs = Object.keys(localStorage)
        .filter(key => key.endsWith('_jobs'))
        .flatMap(key => {
          const jobs = JSON.parse(localStorage.getItem(key) || "[]");
          return jobs.filter((job: Job) => {
            // Hem email hem de isim ile eşleşmeyi kontrol et
            return job.doctorEmail === currentUser.email || 
                   (job.doctorEmail === null && job.doctorName === currentUser.fullName);
          });
        });

      // Filtreye göre işleri filtrele
      const filteredUpdatedJobs = updatedJobs.filter(job => {
        switch (filter) {
          case "active":
            return job.status !== "completed" || !job.paymentReceived;
          case "completed":
            return job.status === "completed" && job.paymentReceived;
          default:
            return true;
        }
      });

      setJobs(filteredUpdatedJobs);
    };

    window.addEventListener('jobUpdate', handleJobUpdate);
    return () => window.removeEventListener('jobUpdate', handleJobUpdate);
  }, [currentUser?.email, currentUser?.fullName, filter]);

  const getStatusBadge = (status: string, paymentReceived: boolean) => {
    if (status === 'completed' && paymentReceived) {
      return <Badge className="bg-green-500">Tamamlandı</Badge>;
    } else if (status === 'completed' && !paymentReceived) {
      return <Badge variant="secondary">Bitti, Ödeme Bekliyor</Badge>;
    } else {
      return <Badge variant="outline">Devam Ediyor</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">İş Takibi</h2>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Durum Filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktif İşler</SelectItem>
              <SelectItem value="completed">Tamamlanan İşler</SelectItem>
              <SelectItem value="all">Tüm İşler</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Hasta</TableHead>
                <TableHead>İş</TableHead>
                <TableHead>Ücret</TableHead>
                <TableHead>Teknisyen</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    {format(new Date(job.date), "d MMMM yyyy", { locale: tr })}
                  </TableCell>
                  <TableCell>{job.patientName}</TableCell>
                  <TableCell>{job.jobName}</TableCell>
                  <TableCell>₺{parseFloat(job.price).toFixed(2)}</TableCell>
                  <TableCell>{job.technicianEmail}</TableCell>
                  <TableCell>{getStatusBadge(job.status, job.paymentReceived)}</TableCell>
                </TableRow>
              ))}
              {jobs.length === 0 && (
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
  );
}
