import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Settings, Download, Copy, CheckCircle, XCircle, Sparkles, Loader2, ExternalLink } from "lucide-react";

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
  related_searches: { title: string; web_result_page: number; blogs: { title: string } | null } | null;
}

interface RelatedSearch {
  id: string;
  title: string;
  web_result_page: number;
  blogs: { title: string } | null;
}

interface GeneratedWebResult {
  name: string;
  title: string;
  description: string;
  url: string;
  is_sponsored: boolean;
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [generatingWebResults, setGeneratingWebResults] = useState(false);
  const [generatedWebResults, setGeneratedWebResults] = useState<GeneratedWebResult[]>([]);
  const [selectedGeneratedIndexes, setSelectedGeneratedIndexes] = useState<number[]>([]);
  const [selectedSearchForGeneration, setSelectedSearchForGeneration] = useState("");
  
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    url: '',
    title: '',
    description: '',
    is_sponsored: false,
    is_active: true,
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
      supabase.from('web_results').select('*, related_searches(title, web_result_page, blogs(title))').order('created_at', { ascending: false }),
      supabase.from('related_searches').select('id, title, web_result_page, blogs(title)').order('created_at', { ascending: false }),
    ]);
    
    if (resultsRes.data) setResults(resultsRes.data as WebResult[]);
    if (searchesRes.data) setSearches(searchesRes.data as RelatedSearch[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedSearch = searches.find(s => s.id === formData.related_search_id);

  const generateWebResults = async () => {
    if (!selectedSearchForGeneration) {
      toast({ title: 'Error', description: 'Please select a related search first', variant: 'destructive' });
      return;
    }

    const search = searches.find(s => s.id === selectedSearchForGeneration);
    if (!search) return;

    setGeneratingWebResults(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: { relatedSearchTitle: search.title, type: 'webresults' }
      });

      if (error) throw error;
      
      if (data.webResults && data.webResults.length > 0) {
        setGeneratedWebResults(data.webResults);
        // Auto-select first 4
        setSelectedGeneratedIndexes([0, 1, 2, 3].filter(i => i < data.webResults.length));
        toast({ title: 'Success', description: `${data.webResults.length} web results generated! Select up to 4.` });
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error generating web results:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to generate web results', 
        variant: 'destructive' 
      });
    } finally {
      setGeneratingWebResults(false);
    }
  };

  const toggleGeneratedResult = (index: number) => {
    if (selectedGeneratedIndexes.includes(index)) {
      setSelectedGeneratedIndexes(prev => prev.filter(i => i !== index));
    } else if (selectedGeneratedIndexes.length < 4) {
      setSelectedGeneratedIndexes(prev => [...prev, index]);
    } else {
      toast({ title: 'Limit', description: 'You can select maximum 4 web results', variant: 'destructive' });
    }
  };

  const updateGeneratedResult = (index: number, field: keyof GeneratedWebResult, value: string | boolean) => {
    const updated = [...generatedWebResults];
    updated[index] = { ...updated[index], [field]: value };
    setGeneratedWebResults(updated);
  };

  const saveSelectedWebResults = async () => {
    if (!selectedSearchForGeneration || selectedGeneratedIndexes.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one web result', variant: 'destructive' });
      return;
    }

    const search = searches.find(s => s.id === selectedSearchForGeneration);
    if (!search) return;

    const sortedSelected = [...selectedGeneratedIndexes].sort((a, b) => a - b);
    const resultsToCreate = sortedSelected.map((idx, position) => ({
      name: generatedWebResults[idx].name,
      title: generatedWebResults[idx].title,
      description: generatedWebResults[idx].description,
      url: generatedWebResults[idx].url,
      is_sponsored: generatedWebResults[idx].is_sponsored,
      position: position + 1,
      related_search_id: selectedSearchForGeneration,
    }));

    const { error } = await supabase.from('web_results').insert(resultsToCreate);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `${resultsToCreate.length} web results saved!` });
      setGeneratedWebResults([]);
      setSelectedGeneratedIndexes([]);
      setSelectedSearchForGeneration("");
      fetchData();
    }
  };

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
    } else {
      setPreLandingData({
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
      is_active: true,
      position: result.position.toString(),
      related_search_id: result.related_search_id,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('web_results').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { 
      toast({ title: 'Success', description: 'Web result deleted' }); 
      setSelectedIds(prev => prev.filter(i => i !== id));
      fetchData(); 
    }
  };

  const resetForm = () => {
    setFormData({ name: '', logo: '', url: '', title: '', description: '', is_sponsored: false, is_active: true, position: '1', related_search_id: '' });
    setEditingResult(null);
  };

  // Bulk actions
  const toggleSelectAll = () => {
    if (selectedIds.length === results.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(results.map(r => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const getBaseUrl = () => {
    return window.location.origin;
  };

  const copyLinks = () => {
    const selectedResults = results.filter(r => selectedIds.includes(r.id));
    const links = selectedResults.map(r => `${getBaseUrl()}/wr/${r.related_search_id}`).join('\n');
    navigator.clipboard.writeText(links);
    toast({ title: 'Copied', description: `${selectedResults.length} link(s) copied to clipboard` });
  };

  const copySingleLink = (relatedSearchId: string) => {
    const link = `${getBaseUrl()}/wr/${relatedSearchId}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Copied', description: 'Link copied to clipboard' });
  };

  const exportCSV = (all: boolean) => {
    const dataToExport = all ? results : results.filter(r => selectedIds.includes(r.id));
    const headers = ['Title', 'Name', 'URL', 'Related Search', 'Page', 'Position', 'Type'];
    const rows = dataToExport.map(r => [
      r.title,
      r.name,
      r.url,
      r.related_searches?.title || '',
      r.related_searches?.web_result_page || '',
      r.position,
      r.is_sponsored ? 'Sponsored' : 'Organic'
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `web_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: 'Exported', description: `${dataToExport.length} web result(s) exported` });
  };

  const bulkUpdateSponsored = async (isSponsored: boolean) => {
    const { error } = await supabase.from('web_results').update({ is_sponsored: isSponsored }).in('id', selectedIds);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `${selectedIds.length} web result(s) ${isSponsored ? 'activated as sponsored' : 'set as organic'}` });
      fetchData();
    }
  };

  const bulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} web result(s)?`)) return;
    const { error } = await supabase.from('web_results').delete().in('id', selectedIds);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `${selectedIds.length} web result(s) deleted` });
      setSelectedIds([]);
      fetchData();
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Web Results</h1>
          <p className="text-sm text-muted-foreground">Manage web results for each page</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Web Result</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-background">
            <DialogHeader><DialogTitle>{editingResult ? 'Edit' : 'Add'} Web Result</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Related Search *</label>
                <Select value={formData.related_search_id} onValueChange={(v) => setFormData({ ...formData, related_search_id: v })}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Select related search" /></SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {searches.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.blogs?.title} » {s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Name *</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Title *</label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">URL *</label>
                <Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Logo URL</label>
                <Input value={formData.logo} onChange={(e) => setFormData({ ...formData, logo: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Position</label>
                  <Input type="number" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} min="1" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Checkbox checked={formData.is_sponsored} onCheckedChange={(c) => setFormData({ ...formData, is_sponsored: c === true })} />
                  <label className="text-sm font-medium text-foreground">Sponsored</label>
                </div>
              </div>
              <Button type="submit" className="w-full">{editingResult ? 'Update' : 'Create'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* AI Web Results Generator */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">AI Web Results Generator</h2>
        </div>
        
        <div className="flex gap-4 items-end mb-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground block mb-2">Select Related Search</label>
            <Select value={selectedSearchForGeneration} onValueChange={setSelectedSearchForGeneration}>
              <SelectTrigger><SelectValue placeholder="Select related search (wr=?)" /></SelectTrigger>
              <SelectContent>
                {searches.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.blogs?.title} » {s.title} (wr={s.web_result_page})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={generateWebResults}
            disabled={generatingWebResults || !selectedSearchForGeneration}
            className="gap-2"
          >
            {generatingWebResults ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate 6 Web Results
          </Button>
        </div>

        {/* Generated Results */}
        {generatedWebResults.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Edit & Select Web Results (max 4) - You can edit before saving. Selected results will be added to wr={searches.find(s => s.id === selectedSearchForGeneration)?.web_result_page}
            </p>
            <div className="space-y-4">
              {generatedWebResults.map((result, index) => {
                const isSelected = selectedGeneratedIndexes.includes(index);
                return (
                  <div key={index} className={`border rounded-lg p-4 ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => toggleGeneratedResult(index)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Name</label>
                            <Input 
                              value={result.name}
                              onChange={(e) => updateGeneratedResult(index, 'name', e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Title</label>
                            <Input 
                              value={result.title}
                              onChange={(e) => updateGeneratedResult(index, 'title', e.target.value)}
                              className="h-8"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Description</label>
                          <Textarea 
                            value={result.description}
                            onChange={(e) => updateGeneratedResult(index, 'description', e.target.value)}
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Link</label>
                          <Input 
                            value={result.url}
                            onChange={(e) => updateGeneratedResult(index, 'url', e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={result.is_sponsored}
                            onCheckedChange={(c) => updateGeneratedResult(index, 'is_sponsored', c === true)}
                          />
                          <span className="text-xs">Sponsored</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{selectedGeneratedIndexes.length}/4 selected</span>
              <Button onClick={saveSelectedWebResults} disabled={selectedGeneratedIndexes.length === 0}>
                Save Selected Web Results
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Pre-landing Dialog */}
      <Dialog open={isPreLandingOpen} onOpenChange={setIsPreLandingOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
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
              <div><label className="text-sm font-medium">Headline Color</label><Input type="color" value={preLandingData.headline_color} onChange={(e) => setPreLandingData({ ...preLandingData, headline_color: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Desc Color</label><Input type="color" value={preLandingData.description_color} onChange={(e) => setPreLandingData({ ...preLandingData, description_color: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Button Color</label><Input type="color" value={preLandingData.button_color} onChange={(e) => setPreLandingData({ ...preLandingData, button_color: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Button Text</label><Input value={preLandingData.button_text} onChange={(e) => setPreLandingData({ ...preLandingData, button_text: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Countdown (s)</label><Input type="number" value={preLandingData.countdown_seconds} onChange={(e) => setPreLandingData({ ...preLandingData, countdown_seconds: e.target.value })} /></div>
            </div>
            <div><label className="text-sm font-medium">Background Color</label><Input type="color" value={preLandingData.background_color} onChange={(e) => setPreLandingData({ ...preLandingData, background_color: e.target.value })} className="w-20" /></div>
            <Button type="submit" className="w-full">Save Pre-Landing Config</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Bar */}
      <div className="mb-4 p-3 bg-muted rounded-lg flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">{selectedIds.length} of {results.length} selected</span>
        <div className="flex gap-2 ml-auto flex-wrap">
          <Button variant="outline" size="sm" onClick={() => exportCSV(true)}>
            <Download className="w-4 h-4 mr-1" />Export All CSV
          </Button>
          {selectedIds.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={() => exportCSV(false)}>
                <Download className="w-4 h-4 mr-1" />Export Selected ({selectedIds.length})
              </Button>
              <Button variant="outline" size="sm" onClick={copyLinks}>
                <Copy className="w-4 h-4 mr-1" />Copy
              </Button>
              <Button variant="outline" size="sm" onClick={() => bulkUpdateSponsored(true)}>
                <CheckCircle className="w-4 h-4 mr-1" />Activate
              </Button>
              <Button variant="outline" size="sm" onClick={() => bulkUpdateSponsored(false)}>
                <XCircle className="w-4 h-4 mr-1" />Deactivate
              </Button>
              <Button variant="destructive" size="sm" onClick={bulkDelete}>
                <Trash2 className="w-4 h-4 mr-1" />Delete ({selectedIds.length})
              </Button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-4 w-12">
                  <Checkbox 
                    checked={selectedIds.length === results.length && results.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Name/Title</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Related Search</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Page</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Type</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id} className="border-t border-border">
                  <td className="p-4">
                    <Checkbox 
                      checked={selectedIds.includes(result.id)}
                      onCheckedChange={() => toggleSelect(result.id)}
                    />
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-foreground text-sm">{result.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">{result.title}</div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{result.related_searches?.title}</td>
                  <td className="p-4 text-sm text-muted-foreground">wr={result.related_searches?.web_result_page}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded ${result.is_sponsored ? 'bg-yellow-500/20 text-yellow-600' : 'bg-gray-500/20 text-gray-600'}`}>
                      {result.is_sponsored ? 'Sponsored' : 'Organic'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => copySingleLink(result.related_search_id)} title="Copy Link">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => window.open(`/wr/${result.related_search_id}`, '_blank')} title="View">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openPreLanding(result)} title="Pre-Landing">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(result)} title="Edit">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(result.id)} title="Delete">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
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
