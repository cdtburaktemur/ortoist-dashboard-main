import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
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

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    email: "",
    role: "technician" as "technician" | "doctor"
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (value: "technician" | "doctor") => {
    setFormData(prev => ({
      ...prev,
      role: value
    }));
  };

  const validateForm = () => {
    if (isRegistering) {
      if (!formData.username || !formData.password || !formData.confirmPassword || !formData.fullName || !formData.email || !formData.role) {
        toast.error("Lütfen tüm alanları doldurun");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error("Şifreler eşleşmiyor");
        return false;
      }
      if (!formData.email.includes("@")) {
        toast.error("Geçerli bir email adresi girin");
        return false;
      }
    } else {
      if (!formData.username || !formData.password) {
        toast.error("Lütfen kullanıcı adı ve şifre girin");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (isRegistering) {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      console.log("Mevcut kullanıcılar:", users); // Debug log
      
      const userExists = users.some((user: User) => user.username === formData.username);
      
      if (userExists) {
        toast.error("Bu kullanıcı adı zaten kullanılıyor");
        return;
      }

      const newUser: User = {
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        createdAt: new Date().toISOString()
      };
      
      console.log("Yeni kullanıcı kaydediliyor:", newUser); // Debug log
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));
      console.log("Güncellenmiş kullanıcı listesi:", users); // Debug log
      
      toast.success("Kayıt başarılı! Giriş yapabilirsiniz");
      setIsRegistering(false);
      setFormData(prev => ({
        ...prev,
        confirmPassword: "",
        password: ""
      }));
    } else {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const user = users.find((u: User) => 
        u.username === formData.username && u.password === formData.password
      );

      if (!user) {
        toast.error("Kullanıcı adı veya şifre hatalı");
        return;
      }

      login(user);
      toast.success("Giriş başarılı!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md p-6 bg-white dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-center mb-6 dark:text-white">
          {isRegistering ? "Kayıt Ol" : "Giriş Yap"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Kullanıcı Adı</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Kullanıcı adı"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Şifre"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {isRegistering && (
            <>
              <div>
                <Label htmlFor="fullName">Ad Soyad</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Rol Seçimi</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as "technician" | "doctor" }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technician">Teknisyen</SelectItem>
                    <SelectItem value="doctor">Doktor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full">
            {isRegistering ? "Kayıt Ol" : "Giriş Yap"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setFormData({
                username: "",
                password: "",
                confirmPassword: "",
                fullName: "",
                email: "",
                role: "technician"
              });
            }}
            className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {isRegistering ? "Zaten hesabınız var mı? Giriş yapın" : "Hesabınız yok mu? Kayıt olun"}
          </button>
        </div>
      </Card>
    </div>
  );
}