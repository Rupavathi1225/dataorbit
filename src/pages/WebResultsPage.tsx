import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RecentPosts from "@/components/RecentPosts";
import { trackEvent } from "@/lib/tracking";
import { ExternalLink } from "lucide-react";

interface WebResult {
  id: string;
  name: string;
  logo: string | null;
  url: string;
  title: string;
  description: string | null;
  is_sponsored: boolean;
  position: number;
}

interface RelatedSearch {
  id: string;
  title: string;
  blog_id: string;
  blogs: { title: string; slug: string; categories: { slug: string } | null } | null;
}

interface PreLandingConfig {
  id: string;
  logo_url: string | null;
  logo_position: string;
  logo_size: number;
  main_image_url: string | null;
  headline: string | null;
  description: string | null;
  headline_font_size: number;
  headline_color: string;
  description_color: string;
  button_text: string;
  button_color: string;
  background_color: string;
  background_image: string | null;
  countdown_seconds: number;
}

const WebResultsPage = () => {
  const { searchId } = useParams<{ searchId: string }>();
  const [webResults, setWebResults] = useState<WebResult[]>([]);
  const [relatedSearch, setRelatedSearch] = useState<RelatedSearch | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreLanding, setShowPreLanding] = useState(false);
  const [preLandingConfig, setPreLandingConfig] = useState<PreLandingConfig | null>(null);
  const [selectedResult, setSelectedResult] = useState<WebResult | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: searchData } = await supabase
        .from('related_searches')
        .select('*, blogs(title, slug, categories(slug))')
        .eq('id', searchId)
        .maybeSingle();
      
      if (searchData) {
        setRelatedSearch(searchData as RelatedSearch);
        await trackEvent('page_view', { relatedSearchId: searchId, pageUrl: window.location.pathname });
        
        const { data: resultsData } = await supabase
          .from('web_results')
          .select('*')
          .eq('related_search_id', searchId)
          .order('is_sponsored', { ascending: false })
          .order('position');
        
        if (resultsData) setWebResults(resultsData);
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [searchId]);

  const handleResultClick = async (result: WebResult) => {
    await trackEvent('web_result_click', { 
      relatedSearchId: searchId, 
      webResultId: result.id,
      pageUrl: window.location.pathname
    });
    
    const { data: preLanding } = await supabase
      .from('pre_landing_config')
      .select('*')
      .eq('web_result_id', result.id)
      .maybeSingle();
    
    if (preLanding) {
      setPreLandingConfig(preLanding);
      setSelectedResult(result);
      setCountdown(preLanding.countdown_seconds);
      setShowPreLanding(true);
    } else {
      window.open(result.url, '_blank');
    }
  };

  const handleVisitNow = async () => {
    if (selectedResult) {
      await trackEvent('visit_now_click', { 
        webResultId: selectedResult.id,
        pageUrl: window.location.pathname
      });
      window.open(selectedResult.url, '_blank');
      setShowPreLanding(false);
    }
  };

  useEffect(() => {
    if (showPreLanding && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [showPreLanding, countdown]);

  const sponsoredResults = webResults.filter(r => r.is_sponsored);
  const normalResults = webResults.filter(r => !r.is_sponsored);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e]">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-1/2" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white/10 rounded" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (showPreLanding && preLandingConfig) {
    return (
      <div 
        className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
        style={{ 
          backgroundColor: preLandingConfig.background_color,
          backgroundImage: preLandingConfig.background_image ? `url(${preLandingConfig.background_image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {preLandingConfig.logo_url && (
          <img 
            src={preLandingConfig.logo_url} 
            alt="Logo"
            style={{ width: preLandingConfig.logo_size }}
            className="mb-8"
          />
        )}
        
        {preLandingConfig.main_image_url && (
          <img 
            src={preLandingConfig.main_image_url} 
            alt="Main"
            className="max-w-md w-full rounded-xl mb-8"
          />
        )}
        
        {preLandingConfig.headline && (
          <h1 
            style={{ fontSize: preLandingConfig.headline_font_size, color: preLandingConfig.headline_color }}
            className="font-bold text-center mb-4"
          >
            {preLandingConfig.headline}
          </h1>
        )}
        
        {preLandingConfig.description && (
          <p style={{ color: preLandingConfig.description_color }} className="text-center mb-8 max-w-lg">
            {preLandingConfig.description}
          </p>
        )}
        
        <button
          onClick={handleVisitNow}
          disabled={countdown > 0}
          style={{ backgroundColor: countdown > 0 ? '#666' : preLandingConfig.button_color }}
          className="px-8 py-4 text-white font-semibold rounded-lg transition-all hover:opacity-90 disabled:cursor-not-allowed"
        >
          {countdown > 0 ? `Please wait ${countdown}s...` : preLandingConfig.button_text}
        </button>
        
        <button onClick={() => setShowPreLanding(false)} className="mt-4 text-white/60 hover:text-white text-sm">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {relatedSearch?.blogs && (
          <p className="text-white/60 text-sm mb-6">
            DataOrbit » {relatedSearch.blogs.title} » {relatedSearch.title}
          </p>
        )}
        
        <h1 className="text-2xl font-bold text-white mb-8">Web Results</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {sponsoredResults.length > 0 && (
              <div className="bg-[#252545] rounded-xl p-6 mb-6">
                {sponsoredResults.map((result) => (
                  <div key={result.id} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      {result.logo && <img src={result.logo} alt={result.name} className="w-6 h-6 rounded" />}
                      <span className="text-white/80 text-sm">{result.name}</span>
                    </div>
                    <p className="text-white/60 text-xs mb-1">Sponsored · {result.url}</p>
                    <h3 className="text-primary font-medium text-lg mb-2">{result.title}</h3>
                    {result.description && <p className="text-white/70 text-sm mb-3">{result.description}</p>}
                    <button
                      onClick={() => handleResultClick(result)}
                      className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visit Website
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="space-y-4">
              {normalResults.map((result) => (
                <div 
                  key={result.id} 
                  className="bg-white/5 backdrop-blur rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {result.logo && <img src={result.logo} alt={result.name} className="w-5 h-5 rounded" />}
                    <span className="text-white/80 text-sm">{result.name}</span>
                  </div>
                  <p className="text-white/50 text-xs mb-1">{result.url}</p>
                  <h3 className="text-primary font-medium mb-1">{result.title}</h3>
                  {result.description && <p className="text-white/70 text-sm">{result.description}</p>}
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <RecentPosts />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default WebResultsPage;
