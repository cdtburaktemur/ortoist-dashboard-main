import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast"; 
import { useEffect, useState } from "react";

interface PriceItem {
  type: string;
  price: number;
  notes: string;
}

export default function PriceList() {
  const [priceList, setPriceList] = useState<PriceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentUser } = useAuth();

  // Kullanıcıya özel storage key'i oluştur
  const getStorageKey = (key: string) => {
    return `${currentUser?.email}_${key}`;
  };

  useEffect(() => {
    if (!currentUser?.email) return;
    
    // Kullanıcının fiyat listesini localStorage'dan al
    const savedPriceList = localStorage.getItem(getStorageKey('priceList'));
    if (savedPriceList) {
      setPriceList(JSON.parse(savedPriceList));
    }
  }, [currentUser?.email]);

  // Arama terimine göre fiyat listesini filtrele
  const filteredPriceList = priceList.filter(item =>
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Fiyat Listesi</h1>
        </div>

        <Card className="p-6">
          <div className="flex flex-col gap-4">
            <div>
              <Label>Fiyat Listesinde Ara</Label>
              <Input
                type="text"
                placeholder="İş türü ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Yapılacak İşin Cinsi</TableHead>
                    <TableHead>Fiyat</TableHead>
                    <TableHead>Notlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPriceList.length > 0 ? (
                    filteredPriceList.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>₺{item.price.toLocaleString('tr-TR')}</TableCell>
                        <TableCell>{item.notes}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        {searchTerm ? (
                          <div className="text-muted-foreground">
                            Arama sonucunda hiç kayıt bulunamadı.
                          </div>
                        ) : (
                          <div className="text-muted-foreground">
                            Henüz fiyat listesi yüklenmemiş. Tercihler sayfasından fiyat listesi yükleyebilirsiniz.
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
