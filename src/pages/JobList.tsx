import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { Check } from "lucide-react";
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
  patientName: string;
  jobName: string;
  price: string;
  status: string;
  date: string;
  paymentReceived: boolean;
}

export default function JobList() {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<string>("active"); // "active" | "completed" | "all"

  useEffect(() => {
    if (!currentUser?.email) return;

    // LocalStorage'dan işleri yükle
    const savedJobs = localStorage.getItem(`${currentUser.email}_jobs`);
    if (savedJobs) {
      const storedJobs = JSON.parse(savedJobs);

      // Filtreye göre işleri filtrele
      const filteredJobs = storedJobs.filter((job: Job) => {
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
    }

    // İş güncellemelerini dinle
    const handleJobUpdate = () => {
      const updatedJobs = localStorage.getItem(`${currentUser.email}_jobs`);
      if (updatedJobs) {
        const updatedJobsParsed = JSON.parse(updatedJobs);
        
        // Filtreye göre güncellenen işleri filtrele
        const filteredUpdatedJobs = updatedJobsParsed.filter((job: Job) => {
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
      }
    };

    window.addEventListener('jobUpdate', handleJobUpdate);
    return () => window.removeEventListener('jobUpdate', handleJobUpdate);
  }, [currentUser?.email, filter]);

  const handleStatusChange = (jobId: number, newStatus: string, paymentReceived: boolean = false) => {
    if (!currentUser?.email) return;

    const storageKey = `${currentUser.email}_jobs`;
    const jobs = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const updatedJobs = jobs.map((job: Job) => {
      if (job.id === jobId) {
        return {
          ...job,
          status: newStatus,
          paymentReceived: paymentReceived
        };
      }
      return job;
    });

    localStorage.setItem(storageKey, JSON.stringify(updatedJobs));
    
    // Bekleyen işleri güncelle
    const pendingJobs = updatedJobs.filter(job => job.status === "pending").length;
    localStorage.setItem(`${currentUser.email}_pendingJobs`, pendingJobs.toString());
    
    // İş güncellemesini bildir
    window.dispatchEvent(new CustomEvent('jobUpdate', { 
      detail: { type: 'update', count: pendingJobs }
    }));

    setJobs(updatedJobs);
    toast({
      title: "Başarılı",
      description: "İş durumu güncellendi",
    });
  };

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
                <TableHead>Doktor</TableHead>
                <TableHead>Hasta</TableHead>
                <TableHead>İş</TableHead>
                <TableHead>Ücret</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    {format(new Date(job.date), "d MMMM yyyy", { locale: tr })}
                  </TableCell>
                  <TableCell>{job.doctorName}</TableCell>
                  <TableCell>{job.patientName}</TableCell>
                  <TableCell>{job.jobName}</TableCell>
                  <TableCell>₺{parseFloat(job.price).toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(job.status, job.paymentReceived)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {job.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(job.id, "completed", false)}
                            className="h-8 px-3"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Yapıldı, Ödeme Bekliyor
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(job.id, "completed", true)}
                            className="h-8 px-3"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Tamamlandı
                          </Button>
                        </>
                      )}
                      {job.status === "completed" && !job.paymentReceived && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(job.id, "completed", true)}
                          className="h-8 px-3"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Ödeme Alındı
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {jobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    {filter === "active" ? "Aktif iş bulunmuyor" :
                     filter === "completed" ? "Tamamlanan iş bulunmuyor" :
                     "Henüz iş bulunmuyor"}
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