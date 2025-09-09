import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { RequestType } from '@/types/requests';
import { REQUEST_CATEGORIES } from '@/types/requests';
import RequestTypeEditorDialog from './RequestTypeEditorDialog';
import { toast } from '@/components/ui/sonner';

export default function RequestTypeManager() {
  const { user } = useAuth();
  const [types, setTypes] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RequestType | null>(null);

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
      (t.name.toLowerCase().includes(term) || (t.description || '').toLowerCase().includes(term))
    );
  }, [types, search, category]);

  const handleDelete = async (t: RequestType) => {
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

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Request Types</h1>
          <p className="text-sm text-muted-foreground">Create and manage the request options available to your organization.</p>
        </div>
        <Button onClick={() => { setEditing(null); setEditorOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> New Type
        </Button>
      </header>

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
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(t); setEditorOpen(true); }} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(t)} aria-label="Delete">
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
                <Button size="sm" variant="outline" onClick={() => toggleActive(t)}>{t.is_active ? 'Deactivate' : 'Activate'}</Button>
                <Button size="sm" variant="secondary" onClick={() => { setEditing(t); setEditorOpen(true); }}>Edit</Button>
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

      <RequestTypeEditorDialog open={editorOpen} onOpenChange={setEditorOpen} initial={editing} onSaved={load} />
    </div>
  );
}
