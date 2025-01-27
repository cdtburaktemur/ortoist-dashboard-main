import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO, subMonths, addMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

interface Stats {
  totalJobs: number;
  pendingJobs: number;
  completedJobs: number;
  totalEarnings: number;
  pendingPayments: number;
}

export default function DoctorDashboard() {
  const { currentUser } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    pendingJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    if (!currentUser?.email) return;

    const calculateStats = () => {
      // Tüm teknisyenlerin işlerini al ve doktora ait olanları filtrele
      const doctorJobs = Object.keys(localStorage)
        .filter(key => key.endsWith('_jobs'))
        .flatMap(key => {
          const jobs = JSON.parse(localStorage.getItem(key) || "[]");
          return jobs.filter((job: Job) => {
            return job.doctorEmail === currentUser.email || 
                   (job.doctorEmail === null && job.doctorName === currentUser.fullName);
          });
        });

      const newStats = {
        totalJobs: doctorJobs.length,
        pendingJobs: doctorJobs.filter(job => job.status !== 'completed').length,
        completedJobs: doctorJobs.filter(job => job.status === 'completed').length,
        totalEarnings: doctorJobs
          .filter(job => job.paymentReceived)
          .reduce((sum, job) => sum + parseFloat(job.price), 0),
        pendingPayments: doctorJobs
          .filter(job => !job.paymentReceived)
          .reduce((sum, job) => sum + parseFloat(job.price), 0)
      };

      setStats(newStats);
    };

    calculateStats();

    // İş güncellemelerini dinle
    const handleJobUpdate = () => {
      calculateStats();
    };

    window.addEventListener('jobUpdate', handleJobUpdate);
    return () => window.removeEventListener('jobUpdate', handleJobUpdate);
  }, [currentUser?.email, currentUser?.fullName]);

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const statCards = [
    {
      title: "Toplam İş",
      value: stats.totalJobs,
      icon: <Users className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: "Devam Eden İşler",
      value: stats.pendingJobs,
      icon: <Clock className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: "Tamamlanan İşler",
      value: stats.completedJobs,
      icon: <Clock className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: "Yapılan Toplam Ödemeler",
      value: stats.totalEarnings.toFixed(2),
      icon: <Users className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: "Bekleyen Ödemeler",
      value: stats.pendingPayments.toFixed(2),
      icon: <Clock className="h-4 w-4 text-muted-foreground" />
    }
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* İstatistik Kartları */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between space-y-0">
              <h3 className="text-sm font-medium tracking-tight text-muted-foreground">
                {stat.title}
              </h3>
              {stat.icon}
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Takvim */}
      <Card className="p-4 md:p-6 mt-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-2xl font-semibold tracking-tight">
              {format(currentDate, "MMMM yyyy", { locale: tr })}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day) => (
              <div
                key={day}
                className="text-center text-xs md:text-sm font-medium text-muted-foreground p-1 md:p-2"
              >
                {day}
              </div>
            ))}
            {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() - 1 }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {eachDayOfInterval({
              start: startOfMonth(currentDate),
              end: endOfMonth(currentDate)
            }).map((day) => (
              <Button
                key={day.toISOString()}
                variant={isToday(day) ? "default" : "outline"}
                className={cn(
                  "h-9 md:h-12 w-full relative",
                  !isSameMonth(day, currentDate) && "text-muted-foreground"
                )}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs md:text-sm">{format(day, "d")}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
