import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "sonner";
import { Save, Upload, FileText, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Default Invoice Information</h1>
            <p className="text-muted-foreground">Set your company details for invoices</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/invoices/generator')}>
              <FileText className="h-4 w-4 mr-2" />
              Generator
            </Button>
            {!profile?.roles?.includes('invoice_user') && (
              <Button variant="outline" onClick={() => navigate('/invoices/storage')}>
                <Database className="h-4 w-4 mr-2" />
                Storage
              </Button>
            )}
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Details */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Company Details</h2>

                <div>
                  <Label>IČ (Company ID)</Label>
                  <Input
                    value={ic}
                    onChange={(e) => setIc(e.target.value)}
                    onBlur={(e) => fetchCompanyFromAres(e.target.value)}
                    placeholder="12345678"
                  />
                  {fetchingAres && <p className="text-xs text-muted-foreground mt-1">Načítání z ARES...</p>}
                </div>

                <div>
                  <Label>Company Name *</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                </div>

                <div>
                  <Label>DIČ (VAT ID)</Label>
                  <Input value={dic} onChange={(e) => setDic(e.target.value)} />
                </div>

                <div>
                  <Label>Street Address</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div>
                    <Label>Postal Code</Label>
                    <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label>Country</Label>
                  <Input value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
              </div>

              {/* Contact & Banking */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Contact Information</h2>

                <div>
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>

                <div>
                  <Label>Website</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
                </div>

                <h2 className="text-lg font-semibold pt-4">Banking Information</h2>

                <div>
                  <Label>Bank Name</Label>
                  <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g., Česká spořitelna" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Bank Account</Label>
                    <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="123456789" />
                  </div>
                  <div>
                    <Label>Bank Code</Label>
                    <Input value={bankCode} onChange={(e) => setBankCode(e.target.value)} placeholder="0100" />
                  </div>
                </div>

                <div>
                  <Label>IBAN</Label>
                  <Input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="CZ65 0800 0000 1920 0014 5399" />
                </div>

                <div>
                  <Label>SWIFT/BIC</Label>
                  <Input value={swift} onChange={(e) => setSwift(e.target.value)} placeholder="GIBACZPX" />
                </div>
              </div>
            </div>

            {/* Logo Upload - Moved to bottom */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-4">Company Logo</h2>
              <div className="flex items-center gap-4">
                {logoUrl && (
                  <img src={logoUrl} alt="Company Logo" className="h-20 w-auto object-contain border rounded" />
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button variant="outline" onClick={() => document.getElementById('logo-upload')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">Max 2MB, PNG or JPG</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={saveCompanyInfo} disabled={loading || !companyName}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Information"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}