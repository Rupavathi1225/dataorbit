import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight } from "lucide-react";

interface RelatedSearch {
  id: string;
  title: string;
  blogs: { title: string } | null;
}

interface WebResult {
  id: string;
  name: string;
  title: string;
  related_search_id: string;
}

const AdminPreLanding = () => {
  const { toast } = useToast();
  const [searches, setSearches] = useState<RelatedSearch[]>([]);
  const [webResults, setWebResults] = useState<WebResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<WebResult[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSearch, setSelectedSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState("");
  
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
    background_image: '',
    target_url: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      const [searchesRes, resultsRes] = await Promise.all([
        supabase.from('related_searches').select('id, title, blogs(title)').order('created_at', { ascending: false }),
        supabase.from('web_results').select('id, name, title, related_search_id').order('created_at', { ascending: false }),
      ]);
      
      if (searchesRes.data) setSearches(searchesRes.data as RelatedSearch[]);
      if (resultsRes.data) setWebResults(resultsRes.data);
      setLoading(false);
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedSearch) {
      const filtered = webResults.filter(wr => wr.related_search_id === selectedSearch);
      setFilteredResults(filtered);
      setSelectedResult("");
    } else {
      setFilteredResults([]);
    }
  }, [selectedSearch, webResults]);

  useEffect(() => {
    if (selectedResult) {
      loadPreLandingConfig();
    }
  }, [selectedResult]);

  const loadPreLandingConfig = async () => {
    const { data } = await supabase
      .from('pre_landing_config')
      .select('*')
      .eq('web_result_id', selectedResult)
      .maybeSingle();
    
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
        background_image: data.background_image || '',
        target_url: '',
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
        background_image: '',
        target_url: '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResult) {
      toast({ title: 'Error', description: 'Please select a web result', variant: 'destructive' });
      return;
    }
    
    const data = {
      web_result_id: selectedResult,
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
      background_image: preLandingData.background_image || null,
    };
    
    const { data: existing } = await supabase
      .from('pre_landing_config')
      .select('id')
      .eq('web_result_id', selectedResult)
      .maybeSingle();
    
    if (existing) {
      const { error } = await supabase.from('pre_landing_config').update(data).eq('web_result_id', selectedResult);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Success', description: 'Pre-landing page updated' });
    } else {
      const { error } = await supabase.from('pre_landing_config').insert(data);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Success', description: 'Pre-landing page created' });
    }
  };

  const selectedSearchData = searches.find(s => s.id === selectedSearch);
  const selectedResultData = filteredResults.find(r => r.id === selectedResult);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Pre-Landing Page Builder</h1>
      
      {/* Selection Path */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Step 1: Select Related Search</h2>
        <Select value={selectedSearch} onValueChange={setSelectedSearch}>
          <SelectTrigger>
            <SelectValue placeholder="Select related search" />
          </SelectTrigger>
          <SelectContent>
            {searches.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.blogs?.title} » {s.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedSearch && (
          <>
            <h2 className="text-lg font-semibold mt-6 mb-4">Step 2: Select Web Result</h2>
            <Select value={selectedResult} onValueChange={setSelectedResult}>
              <SelectTrigger>
                <SelectValue placeholder="Select web result" />
              </SelectTrigger>
              <SelectContent>
                {filteredResults.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} - {r.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
        
        {/* Selected Path Display */}
        {selectedSearchData && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg flex items-center gap-2 text-sm flex-wrap">
            <span className="font-medium">Selected Path:</span>
            <span className="text-muted-foreground">{selectedSearchData.blogs?.title}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{selectedSearchData.title}</span>
            {selectedResultData && (
              <>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-primary font-medium">{selectedResultData.name}</span>
                <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded">Pre-Landing Page</span>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Pre-Landing Form */}
      {selectedResult && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Edit Pre-Landing Page</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Logo URL</label>
              <Input 
                value={preLandingData.logo_url} 
                onChange={(e) => setPreLandingData({ ...preLandingData, logo_url: e.target.value })} 
                placeholder="https://example.com/logo.png"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Main Image URL</label>
              <Input 
                value={preLandingData.main_image_url} 
                onChange={(e) => setPreLandingData({ ...preLandingData, main_image_url: e.target.value })}
                placeholder="https://example.com/main-image.jpg"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Headline</label>
              <Input 
                value={preLandingData.headline} 
                onChange={(e) => setPreLandingData({ ...preLandingData, headline: e.target.value })}
                placeholder="Exciting offer!"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={preLandingData.description} 
                onChange={(e) => setPreLandingData({ ...preLandingData, description: e.target.value })}
                placeholder="Describe what users will get..."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Email Placeholder</label>
              <Input placeholder="Enter your email" disabled />
            </div>
            
            <div>
              <label className="text-sm font-medium">CTA Button Text</label>
              <Input 
                value={preLandingData.button_text} 
                onChange={(e) => setPreLandingData({ ...preLandingData, button_text: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Background Color</label>
              <div className="flex gap-2">
                <Input 
                  type="color" 
                  value={preLandingData.background_color} 
                  onChange={(e) => setPreLandingData({ ...preLandingData, background_color: e.target.value })}
                  className="w-20"
                />
                <Input 
                  value={preLandingData.background_color} 
                  onChange={(e) => setPreLandingData({ ...preLandingData, background_color: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Background Image URL (optional)</label>
              <Input 
                value={preLandingData.background_image} 
                onChange={(e) => setPreLandingData({ ...preLandingData, background_image: e.target.value })}
                placeholder="https://example.com/background.jpg"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Headline Color</label>
                <Input 
                  type="color" 
                  value={preLandingData.headline_color} 
                  onChange={(e) => setPreLandingData({ ...preLandingData, headline_color: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description Color</label>
                <Input 
                  type="color" 
                  value={preLandingData.description_color} 
                  onChange={(e) => setPreLandingData({ ...preLandingData, description_color: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Button Color</label>
                <Input 
                  type="color" 
                  value={preLandingData.button_color} 
                  onChange={(e) => setPreLandingData({ ...preLandingData, button_color: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Countdown Seconds</label>
                <Input 
                  type="number" 
                  value={preLandingData.countdown_seconds} 
                  onChange={(e) => setPreLandingData({ ...preLandingData, countdown_seconds: e.target.value })}
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Headline Font Size</label>
                <Input 
                  type="number" 
                  value={preLandingData.headline_font_size} 
                  onChange={(e) => setPreLandingData({ ...preLandingData, headline_font_size: e.target.value })}
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full">Update Pre-Landing Page</Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPreLanding;