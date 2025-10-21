import { useState, useEffect } from 'react';
import { useOrganizationBranding } from '@/hooks/finance/useOrganizationBranding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export const CompanyBrandingForm = () => {
  const { branding, isLoading, isUploading, uploadLogo, updateBranding, deleteLogo } = useOrganizationBranding();
  const [formData, setFormData] = useState({
    company_address: branding?.company_address || '',
    company_city: branding?.company_city || '',
    company_state: branding?.company_state || '',
    company_postal_code: branding?.company_postal_code || '',
    company_country: branding?.company_country || 'USA',
    company_phone: branding?.company_phone || '',
    company_email: branding?.company_email || '',
    company_website: branding?.company_website || '',
  });

  // Sync form data with branding when it changes
  useEffect(() => {
    if (branding) {
      setFormData({
        company_address: branding.company_address || '',
        company_city: branding.company_city || '',
        company_state: branding.company_state || '',
        company_postal_code: branding.company_postal_code || '',
        company_country: branding.company_country || 'USA',
        company_phone: branding.company_phone || '',
        company_email: branding.company_email || '',
        company_website: branding.company_website || '',
      });
    }
  }, [branding]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PNG, JPG, or SVG file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    await uploadLogo(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBranding(formData);
  };

  const handleRemoveLogo = async () => {
    await deleteLogo();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Logo
          </CardTitle>
          <CardDescription>
            Upload your company logo to appear on invoices. Recommended size: 400x400px
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            {branding?.logo_url ? (
              <div className="relative">
                <img
                  src={branding.logo_url}
                  alt="Company Logo"
                  className="h-24 w-24 object-contain rounded-lg border-2 border-border bg-background"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={handleRemoveLogo}
                  disabled={isUploading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1">
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors w-fit">
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      {branding?.logo_url ? 'Change Logo' : 'Upload Logo'}
                    </>
                  )}
                </div>
              </Label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-2">
                PNG, JPG, or SVG • Max 5MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            This information will appear on all invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_address">Street Address</Label>
            <Input
              id="company_address"
              value={formData.company_address}
              onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_city">City</Label>
              <Input
                id="company_city"
                value={formData.company_city}
                onChange={(e) => setFormData({ ...formData, company_city: e.target.value })}
                placeholder="New York"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_state">State</Label>
              <Input
                id="company_state"
                value={formData.company_state}
                onChange={(e) => setFormData({ ...formData, company_state: e.target.value })}
                placeholder="NY"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_postal_code">Zip Code</Label>
              <Input
                id="company_postal_code"
                value={formData.company_postal_code}
                onChange={(e) => setFormData({ ...formData, company_postal_code: e.target.value })}
                placeholder="10001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_phone">Phone</Label>
              <Input
                id="company_phone"
                type="tel"
                value={formData.company_phone}
                onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_email">Email</Label>
              <Input
                id="company_email"
                type="email"
                value={formData.company_email}
                onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                placeholder="billing@company.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_website">Website (Optional)</Label>
            <Input
              id="company_website"
              type="url"
              value={formData.company_website}
              onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
              placeholder="https://www.company.com"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          Save Company Branding
        </Button>
      </div>
    </form>
  );
};
