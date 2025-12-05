import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Settings } from "lucide-react";

interface WebResult {
  id: string;
  name: string;
  logo: string | null;
  url: string;
  title: string;
  description: string | null;
  is_sponsored: boolean;
  position: number;
  related_search_id: string;
  related_searches: { title: string; blogs: { title: string } | null } | null;
}

interface RelatedSearch {
  id: string;
  title: string;
  blogs: { title: string } | null;
}

const AdminWebResults = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<WebResult[]>([]);
  const [searches, setSearches] = useState<RelatedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreLandingOpen, setIsPreLandingOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<WebResult | null>(null);
  const [selectedResultForPreLanding, setSelectedResultForPreLanding] = useState<WebResult | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    url: '',
    title: '',
    description: '',
    is_sponsored: false,
    position: '1',
    related_search_id: '',
  });

  const [preLandingData, setPreLandingData] = useState({
    logo_url: '',
    logo_size: '100',
    main_image_url: '',
    headline: '',
    description: '',
    headline_font_size: '32',
    headline_color: '#ffffff',
    description_color: '#cccccc',
    button_text: 'Visit Now',
    button_color: '#3b82f6',
    background_color: '#1a1a2e',
    countdown_seconds: '3',
  });

  const fetchData = async () => {
    const [resultsRes, searchesRes] = await Promise.all([
      supabase.from('web_results').select('*, related_searches(title, blogs(title))').order('created_at', { ascending: false }),
      supabase.from('related_searches').select('id, title, blogs(title)').order('created_at', { ascending: false }),
    ]);
    
    if (resultsRes.data) setResults(resultsRes.data as WebResult[]);
    if (searchesRes.data) setSearches(searchesRes.data as RelatedSearch[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const resultData = {
      name: formData.name,
      logo: formData.logo || null,
      url: formData.url,
      title: formData.title,
      description: formData.description || null,
      is_sponsored: formData.is_sponsored,
      position: parseInt(formData.position),
      related_search_id: formData.related_search_id,
    };
    
    if (editingResult) {
      const { error } = await supabase.from('web_results').update(resultData).eq('id', editingResult.id);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Web result updated successfully' });
        setIsDialogOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from('web_results').insert(resultData);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Web result created successfully' });
        setIsDialogOpen(false);
        fetchData();
      }
    }
    resetForm();
  };

  const handlePreLandingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResultForPreLanding) return;
    
    const data = {
      web_result_id: selectedResultForPreLanding.id,
      logo_url: preLandingData.logo_url || null,
      logo_size: parseInt(preLandingData.logo_size),
      main_image_url: preLandingData.main_image_url || null,
      headline: preLandingData.headline || null,
      description: preLandingData.description || null,
      headline_font_size: parseInt(preLandingData.headline_font_size),
      headline_color: preLandingData.headline_color,
      description_color: preLandingData.description_color,
      button_text: preLandingData.button_text,
      button_color: preLandingData.button_color,
      background_color: preLandingData.background_color,
      countdown_seconds: parseInt(preLandingData.countdown_seconds),
    };
    
    const { data: existing } = await supabase.from('pre_landing_config').select('id').eq('web_result_id', selectedResultForPreLanding.id).maybeSingle();
    
    if (existing) {
      const { error } = await supabase.from('pre_landing_config').update(data).eq('web_result_id', selectedResultForPreLanding.id);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Success', description: 'Pre-landing config updated' });
    } else {
      const { error } = await supabase.from('pre_landing_config').insert(data);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Success', description: 'Pre-landing config created' });
    }
    setIsPreLandingOpen(false);
  };

  const openPreLanding = async (result: WebResult) => {
    setSelectedResultForPreLanding(result);
    const { data } = await supabase.from('pre_landing_config').select('*').eq('web_result_id', result.id).maybeSingle();
    if (data) {
      setPreLandingData({
        logo_url: data.logo_url || '',
        logo_size: data.logo_size?.toString() || '100',
        main_image_url: data.main_image_url || '',
        headline: data.headline || '',
        description: data.description || '',
        headline_font_size: data.headline_font_size?.toString() || '32',
        headline_color: data.headline_color || '#ffffff',
        description_color: data.description_color || '#cccccc',
        button_text: data.button_text || 'Visit Now',
        button_color: data.button_color || '#3b82f6',
        background_color: data.background_color || '#1a1a2e',
        countdown_seconds: data.countdown_seconds?.toString() || '3',
      });
    }
    setIsPreLandingOpen(true);
  };

  const handleEdit = (result: WebResult) => {
    setEditingResult(result);
    setFormData({
      name: result.name,
      logo: result.logo || '',
      url: result.url,
      title: result.title,
      description: result.description || '',
      is_sponsored: result.is_sponsored,
      position: result.position.toString(),
      related_search_id: result.related_search_id,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('web_results').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Success', description: 'Web result deleted' }); fetchData(); }
  };

  const resetForm = () => {
    setFormData({ name: '', logo: '', url: '', title: '', description: '', is_sponsored: false, position: '1', related_search_id: '' });
    setEditingResult(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">Web Results</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Web Result</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingResult ? 'Edit' : 'Create'} Web Result</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Related Search</label>
                <Select value={formData.related_search_id} onValueChange={(v) => setFormData({ ...formData, related_search_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select related search" /></SelectTrigger>
                  <SelectContent>
                    {searches.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.blogs?.title} » {s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Name</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div><label className="text-sm font-medium">Logo URL</label><Input value={formData.logo} onChange={(e) => setFormData({ ...formData, logo: e.target.value })} /></div>
              </div>
              <div><label className="text-sm font-medium">URL</label><Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} required /></div>
              <div><label className="text-sm font-medium">Title</label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
              <div><label className="text-sm font-medium">Description</label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Position</label><Input type="number" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} min="1" /></div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={formData.is_sponsored} onCheckedChange={(c) => setFormData({ ...formData, is_sponsored: c })} />
                  <label className="text-sm font-medium">Sponsored</label>
                </div>
              </div>
              <Button type="submit" className="w-full">{editingResult ? 'Update' : 'Create'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pre-landing Dialog */}
      <Dialog open={isPreLandingOpen} onOpenChange={setIsPreLandingOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Pre-Landing Page Config</DialogTitle></DialogHeader>
          <form onSubmit={handlePreLandingSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Logo URL</label><Input value={preLandingData.logo_url} onChange={(e) => setPreLandingData({ ...preLandingData, logo_url: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Logo Size (px)</label><Input type="number" value={preLandingData.logo_size} onChange={(e) => setPreLandingData({ ...preLandingData, logo_size: e.target.value })} /></div>
            </div>
            <div><label className="text-sm font-medium">Main Image URL</label><Input value={preLandingData.main_image_url} onChange={(e) => setPreLandingData({ ...preLandingData, main_image_url: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Headline</label><Input value={preLandingData.headline} onChange={(e) => setPreLandingData({ ...preLandingData, headline: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Description</label><Textarea value={preLandingData.description} onChange={(e) => setPreLandingData({ ...preLandingData, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-sm font-medium">Headline Size</label><Input type="number" value={preLandingData.headline_font_size} onChange={(e) => setPreLandingData({ ...preLandingData, headline_font_size: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Headline Color</label><Input type="color" value={preLandingData.headline_color} onChange={(e) => setPreLandingData({ ...preLandingData, headline_color: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Description Color</label><Input type="color" value={preLandingData.description_color} onChange={(e) => setPreLandingData({ ...preLandingData, description_color: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-sm font-medium">Button Text</label><Input value={preLandingData.button_text} onChange={(e) => setPreLandingData({ ...preLandingData, button_text: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Button Color</label><Input type="color" value={preLandingData.button_color} onChange={(e) => setPreLandingData({ ...preLandingData, button_color: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Background</label><Input type="color" value={preLandingData.background_color} onChange={(e) => setPreLandingData({ ...preLandingData, background_color: e.target.value })} /></div>
            </div>
            <div><label className="text-sm font-medium">Countdown (seconds)</label><Input type="number" value={preLandingData.countdown_seconds} onChange={(e) => setPreLandingData({ ...preLandingData, countdown_seconds: e.target.value })} min="0" /></div>
            <Button type="submit" className="w-full">Save Pre-Landing Config</Button>
          </form>
        </DialogContent>
      </Dialog>
      
      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-foreground">Name</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Related Search</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Sponsored</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id} className="border-t border-border">
                  <td className="p-4 text-sm text-foreground">{result.name}</td>
                  <td className="p-4 text-sm text-muted-foreground">{result.related_searches?.blogs?.title} » {result.related_searches?.title}</td>
                  <td className="p-4"><span className={`text-xs px-2 py-1 rounded ${result.is_sponsored ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'}`}>{result.is_sponsored ? 'Yes' : 'No'}</span></td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openPreLanding(result)}><Settings className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(result)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(result.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminWebResults;
