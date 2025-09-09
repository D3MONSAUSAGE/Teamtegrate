import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ShieldCheck, CheckCircle2, Lock, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { RequestType } from '@/types/requests';
import { REQUEST_CATEGORIES } from '@/types/requests';
import RequestTypeEditorDialog from './RequestTypeEditorDialog';
import { toast } from '@/components/ui/sonner';
import { useRequestPermissions } from '@/hooks/access-control/useRequestPermissions';
import { RequestTemplateMarketplace } from '@/components/requests/RequestTemplateMarketplace';
import { RequestAnalyticsDashboard } from '@/components/requests/RequestAnalyticsDashboard';
import { RequestTemplate } from '@/hooks/requests/useRequestTemplates';

export default function RequestTypeManager() {
  const { user } = useAuth();
  const { canManageRequestTypes, canViewRequestType } = useRequestPermissions();
  const [types, setTypes] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RequestType | null>(null);
  const [activeTab, setActiveTab] = useState('manage');

  const load = async () => {
    if (!user?.organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('request_types')
        .select('*')
        .eq('organization_id', user.organizationId)
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      setTypes(data as unknown as RequestType[]);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load request types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.organizationId]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return types.filter(t => 
      (category === 'all' || t.category === category) &&
      (t.name.toLowerCase().includes(term) || (t.description || '').toLowerCase().includes(term)) &&
      canViewRequestType(t)
    );
  }, [types, search, category, canViewRequestType]);

  const handleDelete = async (t: RequestType) => {
    if (!canManageRequestTypes) {
      toast.error('You do not have permission to delete request types');
      return;
    }
    if (!confirm(`Delete request type "${t.name}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase
        .from('request_types')
        .delete()
        .eq('id', t.id)
        .eq('organization_id', user?.organizationId || '');
      if (error) throw error;
      toast.success('Request type deleted');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete request type');
    }
  };

  const toggleActive = async (t: RequestType) => {
    if (!canManageRequestTypes) {
      toast.error('You do not have permission to modify request types');
      return;
    }
    try {
      const { error } = await supabase
        .from('request_types')
        .update({ is_active: !t.is_active })
        .eq('id', t.id)
        .eq('organization_id', user?.organizationId || '');
      if (error) throw error;
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update');
    }
  };

  const handleSelectTemplate = (template: RequestTemplate) => {
    // Convert template to RequestType format for editing
    const templateAsRequestType: Partial<RequestType> = {
      name: template.name,
      description: template.description || '',
      category: template.category,
      form_schema: template.template_data.form_schema || [],
      requires_approval: template.template_data.requires_approval || false,
      approval_roles: template.template_data.approval_roles || ['manager'],
      is_active: true,
      default_job_roles: template.template_data.default_job_roles || [],
      expertise_tags: template.tags || [],
    };
    
    setEditing(templateAsRequestType as RequestType);
    setEditorOpen(true);
  };

  const handleCreateNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-4">
      {!canManageRequestTypes && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You have view-only access to request types. Contact your administrator to manage request types.
          </AlertDescription>
        </Alert>
      )}

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Request Management</h1>
          <p className="text-sm text-muted-foreground">Manage request types, view analytics, and browse templates</p>
        </div>
        <Button 
          onClick={handleCreateNew}
          disabled={!canManageRequestTypes}
        >
          <Plus className="h-4 w-4 mr-2" /> New Type
        </Button>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manage">Manage Types</TabsTrigger>
          <TabsTrigger value="templates">Template Marketplace</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-4">

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Find request types by name, category or status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input placeholder="Search by name or description" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="rounded-md border bg-background px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All categories</option>
              {Object.keys(REQUEST_CATEGORIES).map((key) => (
                <option key={key} value={key}>{REQUEST_CATEGORIES[key as keyof typeof REQUEST_CATEGORIES]}</option>
              ))}
            </select>
            <Button variant="outline" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((t) => (
          <Card key={t.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <CardDescription>{t.description || 'No description'}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => { setEditing(t); setEditorOpen(true); }} 
                    aria-label="Edit"
                    disabled={!canManageRequestTypes}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => handleDelete(t)} 
                    aria-label="Delete"
                    disabled={!canManageRequestTypes}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline">{REQUEST_CATEGORIES[t.category as keyof typeof REQUEST_CATEGORIES] || t.category}</Badge>
                {t.requires_approval && (
                  <Badge className="gap-1" variant="secondary"><ShieldCheck className="h-3 w-3" /> Requires Approval</Badge>
                )}
                <Badge variant={t.is_active ? 'default' : 'secondary'} className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {t.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {t.requires_approval && t.approval_roles?.length > 0 && (
                <p className="text-sm text-muted-foreground">Approval roles: {t.approval_roles.join(', ')}</p>
              )}
              <Separator className="my-3" />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => toggleActive(t)}
                  disabled={!canManageRequestTypes}
                >
                  {t.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => { setEditing(t); setEditorOpen(true); }}
                  disabled={!canManageRequestTypes}
                >
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-10 text-center text-muted-foreground">No request types found</CardContent>
          </Card>
        )}
      </div>
        </TabsContent>

        <TabsContent value="templates">
          <RequestTemplateMarketplace
            onSelectTemplate={handleSelectTemplate}
            onCreateNew={handleCreateNew}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <RequestAnalyticsDashboard />
        </TabsContent>
      </Tabs>

      <RequestTypeEditorDialog open={editorOpen} onOpenChange={setEditorOpen} initial={editing} onSaved={load} />
    </div>
  );
}
