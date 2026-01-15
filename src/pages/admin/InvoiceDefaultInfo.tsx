import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "sonner";
import { Save, Upload, FileText, Database, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { LoadingOverlay } from "@/components/LoadingOverlay";

export default function InvoiceDefaultInfo() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingAres, setFetchingAres] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [ic, setIc] = useState("");
  const [dic, setDic] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Česká republika");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [iban, setIban] = useState("");
  const [swift, setSwift] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bankName, setBankName] = useState("");

  useEffect(() => {
    fetchCompanyInfo();
  }, [user]);

  const fetchCompanyInfo = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("company_info")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setCompanyName(data.company_name || "");
      setIc(data.ic || "");
      setDic(data.dic || "");
      setAddress(data.address || "");
      setCity(data.city || "");
      setPostalCode(data.postal_code || "");
      setCountry(data.country || "Česká republika");
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setBankAccount(data.bank_account || "");
      setBankCode(data.bank_code || "");
      setIban(data.iban || "");
      setSwift(data.swift || "");
      setWebsite(data.website || "");
      setLogoUrl(data.logo_url || "");
      setBankName(data.bank_name || "");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setLoading(true);
    try {
      // Upload directly to Cloudinary
      const imageUrl = await uploadToCloudinary(file);

      setLogoUrl(imageUrl);
      toast.success("Logo uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error(error.message || "Error uploading logo");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyFromAres = async (ico: string) => {
    if (!ico || ico.length < 8) return;

    setFetchingAres(true);
    try {
      const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`);

      if (!response.ok) throw new Error('Company not found');

      const data = await response.json();

      const companyName = data.obchodniJmeno || '';
      const dic = data.dic || '';

      const sidlo = data.sidlo;
      let fullAddress = '';
      let cityName = '';
      let postal = '';

      if (sidlo) {
        const street = sidlo.nazevUlice || '';
        const houseNumber = sidlo.cisloDomovni || '';
        const orientationNumber = sidlo.cisloOrientacni || '';
        cityName = sidlo.nazevObce || '';
        postal = sidlo.psc?.toString() || '';

        fullAddress = [street, houseNumber, orientationNumber].filter(Boolean).join(' ');
      }

      setCompanyName(companyName);
      setDic(dic);
      setAddress(fullAddress);
      setCity(cityName);
      setPostalCode(postal);

      toast.success("Údaje načteny z ARES");
    } catch (error) {
      toast.error("Nepodařilo se načíst údaje z ARES");
    } finally {
      setFetchingAres(false);
    }
  };

  const saveCompanyInfo = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("company_info")
        .upsert({
          user_id: user.id,
          company_name: companyName,
          ic,
          dic,
          address,
          city,
          postal_code: postalCode,
          country,
          email,
          phone,
          bank_account: bankAccount,
          bank_code: bankCode,
          iban,
          swift,
          logo_url: logoUrl,
          website,
          bank_name: bankName
        }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success("Company information saved");
    } catch (error) {
      console.error("Error saving company info:", error);
      toast.error("Error saving information");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !companyName) {
    return <LoadingOverlay message="Načítám výchozí info..." />;
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <AdminPageHeader
          title="Fakturační údaje"
          description="Nastavte si výchozí údaje vaší firmy pro faktury"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/invoices/generator')}
                className="bg-card/50 backdrop-blur-sm border-0 shadow-sm rounded-xl px-4 h-10"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generator
              </Button>
              {!profile?.roles?.includes('invoice_user') && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/invoices/storage')}
                  className="bg-card/50 backdrop-blur-sm border-0 shadow-sm rounded-xl px-4 h-10"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Sklad
                </Button>
              )}
              <Button
                onClick={saveCompanyInfo}
                disabled={loading || !companyName}
                variant="gradient"
                className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-xl px-4 h-10"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Ukládání..." : "Uložit změny"}
              </Button>
            </div>
          }
        />

        <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden p-6 md:p-8">
          <CardContent className="p-0 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Company Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                  <Database className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Firemní údaje</h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">IČ (Identifikační číslo)</Label>
                    <div className="relative">
                      <Input
                        value={ic}
                        onChange={(e) => setIc(e.target.value)}
                        onBlur={(e) => fetchCompanyFromAres(e.target.value)}
                        placeholder="12345678"
                        className="bg-background/50 border-0 rounded-xl h-11"
                      />
                      {fetchingAres && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Název firmy *</Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      className="bg-background/50 border-0 rounded-xl h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">DIČ (Daňové číslo)</Label>
                    <Input
                      value={dic}
                      onChange={(e) => setDic(e.target.value)}
                      className="bg-background/50 border-0 rounded-xl h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ulice a číslo popisné</Label>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="bg-background/50 border-0 rounded-xl h-11"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Město</Label>
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="bg-background/50 border-0 rounded-xl h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">PSČ</Label>
                      <Input
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="bg-background/50 border-0 rounded-xl h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Země</Label>
                    <Input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="bg-background/50 border-0 rounded-xl h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Contact & Banking */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Kontakt a Banka</h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email pro faktury</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-background/50 border-0 rounded-xl h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Telefon</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-background/50 border-0 rounded-xl h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Webové stránky</Label>
                    <Input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://..."
                      className="bg-background/50 border-0 rounded-xl h-11"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 pt-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Název banky</Label>
                      <Input
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Např. Česká spořitelna"
                        className="bg-background/50 border-0 rounded-xl h-11"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Číslo účtu</Label>
                        <Input
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value)}
                          placeholder="123456789"
                          className="bg-background/50 border-0 rounded-xl h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Kód banky</Label>
                        <Input
                          value={bankCode}
                          onChange={(e) => setBankCode(e.target.value)}
                          placeholder="0100"
                          className="bg-background/50 border-0 rounded-xl h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">IBAN</Label>
                      <Input
                        value={iban}
                        onChange={(e) => setIban(e.target.value)}
                        placeholder="CZ65 0800 0000 1920 0014 5399"
                        className="bg-background/50 border-0 rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">SWIFT/BIC</Label>
                      <Input
                        value={swift}
                        onChange={(e) => setSwift(e.target.value)}
                        placeholder="GIBACZPX"
                        className="bg-background/50 border-0 rounded-xl h-11"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="border-t border-border/50 pt-8 mt-4">
              <div className="flex items-center gap-2 mb-6">
                <Upload className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Firemní logo</h2>
              </div>

              <div className="flex items-center gap-8">
                {logoUrl && (
                  <div className="relative group">
                    <img
                      src={logoUrl}
                      alt="Company Logo"
                      className="h-28 w-auto object-contain bg-white/50 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/50"
                    />
                  </div>
                )}
                <div className="space-y-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    className="bg-card/50 backdrop-blur-sm border-0 shadow-sm rounded-xl px-6 h-11 transition-all hover:bg-card/80"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Nahrát nové logo
                  </Button>
                  <p className="text-xs text-muted-foreground ml-1">
                    Maximální velikost 2MB (PNG nebo JPG)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}