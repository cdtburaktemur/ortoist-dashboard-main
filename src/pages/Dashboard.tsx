import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DollarSign, Users, Clock, X, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO, subMonths, addMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Stats {
  totalEarnings: number;
  activePatients: number;
  completedJobs: number;
  pendingJobs: number;
  pendingPayments: number;
}

interface Note {
  id: string;
  date: string;
  text: string;
}

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

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalEarnings: 0,
    activePatients: 0,
    completedJobs: 0,
    pendingJobs: 0,
    pendingPayments: 0
  });

  const getStorageKey = (key: string) => {
    return `${currentUser?.email}_${key}`;
  };

  useEffect(() => {
    const updateStats = () => {
      if (!currentUser?.email) return;

      // Teknisyenin işlerini al
      const storageKey = `${currentUser.email}_jobs`;
      const jobs: Job[] = JSON.parse(localStorage.getItem(storageKey) || "[]");

      // Aktif (devam eden veya ödemesi bekleyen) benzersiz hasta sayısı
      const activePatients = new Set(
        jobs.filter(job => !job.paymentReceived)
            .map(job => job.patientName)
      ).size;

      // Tamamlanmış ve ödemesi alınmış işler
      const completedJobs = jobs.filter(
        job => job.status === "completed" && job.paymentReceived
      ).length;

      // Devam eden veya ödemesi bekleyen işler
      const pendingJobs = jobs.filter(
        job => !job.paymentReceived
      ).length;

      // Ödemesi alınmış işlerin toplam tutarı
      const totalEarnings = jobs
        .filter(job => job.paymentReceived)
        .reduce((sum, job) => sum + parseFloat(job.price || "0"), 0);

      // Ödemesi bekleyen işlerin toplam tutarı
      const pendingPayments = jobs
        .filter(job => !job.paymentReceived)
        .reduce((sum, job) => sum + parseFloat(job.price || "0"), 0);

      setStats({
        activePatients,
        completedJobs,
        pendingJobs,
        totalEarnings,
        pendingPayments
      });

      // Header'daki bekleyen iş sayısını güncelle
      localStorage.setItem(`${currentUser.email}_pendingJobs`, pendingJobs.toString());
    };

    // İlk yükleme
    updateStats();

    // İş güncellemelerini dinle
    window.addEventListener('jobUpdate', updateStats);
    return () => window.removeEventListener('jobUpdate', updateStats);

    // LocalStorage'dan notları yükle
    const savedNotes = localStorage.getItem(getStorageKey("calendar_notes"));
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, [currentUser?.email]);

  const saveNote = () => {
    if (!selectedDate || !noteText.trim() || !currentUser?.email) return;

    const newNote: Note = {
      id: Date.now().toString(),
      date: selectedDate.toISOString(),
      text: noteText.trim()
    };

    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    localStorage.setItem(getStorageKey("calendar_notes"), JSON.stringify(updatedNotes));
    setNoteText("");
    toast.success("Not eklendi");
  };

  const deleteNote = (noteId: string) => {
    if (!currentUser?.email) return;

    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);
    localStorage.setItem(getStorageKey("calendar_notes"), JSON.stringify(updatedNotes));
    toast.success("Not silindi");
  };

  const getDayNotes = (date: Date) => {
    return notes.filter(note => 
      isSameDay(parseISO(note.date), date)
    );
  };

  const statCards = [
    {
      title: "Aktif Hastalar",
      value: stats.activePatients,
      icon: <Users className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: "Tamamlanan İşler",
      value: stats.completedJobs,
      icon: <Clock className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: "Bekleyen İşler",
      value: stats.pendingJobs,
      icon: <Clock className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: "Yapılan Toplam Ödemeler",
      value: `₺${stats.totalEarnings.toFixed(2)}`,
      icon: <Users className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: "Bekleyen Ödemeler",
      value: `₺${stats.pendingPayments.toFixed(2)}`,
      icon: <Clock className="h-4 w-4 text-muted-foreground" />
    }
  ];

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* İstatistik Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center gap-2">
              {card.icon}
              <h3 className="text-sm font-medium">{card.title}</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{card.value}</p>
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
            {days.map((day) => {
              const dayNotes = getDayNotes(day);
              return (
                <Popover key={day.toISOString()}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={isToday(day) ? "default" : "outline"}
                      className={cn(
                        "h-9 md:h-12 w-full relative",
                        !isSameMonth(day, currentDate) && "text-muted-foreground",
                        dayNotes.length > 0 && "border-primary border-2"
                      )}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs md:text-sm">{format(day, "d")}</span>
                      </div>
                      {dayNotes.length > 0 && (
                        <div className="absolute bottom-0.5 right-0.5">
                          <span className={cn(
                            "h-3 w-3 md:h-4 md:w-4 rounded-full flex items-center justify-center text-[8px] md:text-[10px] font-medium text-white",
                            isToday(day) ? "bg-red-500" : "bg-blue-500",
                            "ring-1 ring-white dark:ring-gray-900"
                          )}>
                            {dayNotes.length}
                          </span>
                        </div>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] md:w-80 p-3" side="bottom" align="start">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm md:text-base">
                          {format(day, "d MMMM yyyy", { locale: tr })}
                        </h3>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {dayNotes.map(note => (
                          <div
                            key={note.id}
                            className="flex items-center justify-between gap-2 rounded-lg border p-2 bg-background/50 backdrop-blur-sm"
                          >
                            <span className="text-xs md:text-sm flex-1 break-words">{note.text}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0"
                              onClick={() => deleteNote(note.id)}
                            >
                              <X className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex gap-1 md:gap-2 pt-2">
                          <Input
                            placeholder="Yeni not..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                saveNote();
                              }
                            }}
                            className="text-xs md:text-sm h-8 md:h-10"
                          />
                          <Button
                            size="icon"
                            onClick={saveNote}
                            disabled={!noteText.trim()}
                            className="h-8 w-8 md:h-10 md:w-10"
                          >
                            <Plus className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
