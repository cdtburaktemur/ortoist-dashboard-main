import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface User {
  username: string;
  fullName: string;
  email: string;
  role: "technician" | "doctor";
  createdAt: string;
}

export default function Profile() {
  const { currentUser, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || "",
    email: currentUser?.email || ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }

    if (!formData.email.includes("@")) {
      toast.error("Geçerli bir email adresi girin");
      return;
    }

    updateUserProfile(formData);
    toast.success("Profil bilgileri güncellendi");
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === "doctor" ? "default" : "secondary";
  };

  const getRoleText = (role: string) => {
    return role === "doctor" ? "Doktor" : "Teknisyen";
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold tracking-tight">Profil Ayarları</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Profil Bilgileri */}
        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Profil Bilgileri</h2>
            <p className="text-sm text-muted-foreground">
              Kişisel bilgilerinizi güncelleyin
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Ad Soyad</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Ad Soyad"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="E-posta"
              />
            </div>

            <div className="space-y-2">
              <Label>Kullanıcı Adı</Label>
              <Input
                value={currentUser?.username}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>Kayıt Tarihi</Label>
              <Input
                value={new Date(currentUser?.createdAt || "").toLocaleDateString("tr-TR")}
                disabled
                className="bg-muted"
              />
            </div>

            <Button type="submit" className="w-full">
              Kaydet
            </Button>
          </form>
        </Card>

        {/* Sistem Bilgileri */}
        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Sistem Bilgileri</h2>
            <p className="text-sm text-muted-foreground">
              Sistemdeki diğer kullanıcılar
            </p>
          </div>

          <div className="space-y-4">
            {JSON.parse(localStorage.getItem("users") || "[]")
              .filter((user: User) => user.username !== currentUser?.username)
              .map((user: User) => (
                <div
                  key={user.username}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.fullName}</p>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleText(user.role)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}