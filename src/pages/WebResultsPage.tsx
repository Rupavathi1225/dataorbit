import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trackEvent, getSessionId } from "@/lib/tracking";
import { ArrowLeft, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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
}

interface RelatedSearch {
  id: string;
  title: string;
  blog_id: string;
  web_result_page: number;
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
  const { page } = useParams<{ page: string }>();
  const { toast } = useToast();
  const pageNumber = parseInt(page || "1");
  
  const [webResults, setWebResults] = useState<WebResult[]>([]);
  const [relatedSearch, setRelatedSearch] = useState<RelatedSearch | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [showPreLanding, setShowPreLanding] = useState(false);
  const [preLandingConfig, setPreLandingConfig] = useState<PreLandingConfig | null>(null);
  const [selectedResult, setSelectedResult] = useState<WebResult | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [email, setEmail] = useState("");
  const [submittingEmail, setSubmittingEmail] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: searchData } = await supabase
        .from('related_searches')
        .select('*, blogs(title, slug, categories(slug))')
        .eq('web_result_page', pageNumber)
        .maybeSingle();
      
      if (searchData) {
        setRelatedSearch(searchData as RelatedSearch);
        await trackEvent('page_view', { relatedSearchId: searchData.id, pageUrl: window.location.pathname });
        
        const { data: resultsData } = await supabase
          .from('web_results')
          .select('*')
          .eq('related_search_id', searchData.id)
          .order('is_sponsored', { ascending: false })
          .order('position');
        
        if (resultsData) setWebResults(resultsData);
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [pageNumber]);

  const handleResultClick = async (result: WebResult) => {
    await trackEvent('web_result_click', { 
      relatedSearchId: relatedSearch?.id, 
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
      setShowEmailPopup(true);
    } else {
      window.open(result.url, '_blank');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setSubmittingEmail(true);
    
    const { error } = await supabase.from('email_submissions').insert({
      email: email.trim(),
      web_result_id: selectedResult?.id || null,
      session_id: getSessionId(),
    });
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to submit email', variant: 'destructive' });
      setSubmittingEmail(false);
      return;
    }
    
    await trackEvent('email_submitted', { 
      webResultId: selectedResult?.id,
      pageUrl: window.location.pathname
    });
    
    setEmail("");
    setSubmittingEmail(false);
    setShowEmailPopup(false);
    
    if (preLandingConfig) {
      setCountdown(preLandingConfig.countdown_seconds);
      setShowPreLanding(true);
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
      setSelectedResult(null);
      setPreLandingConfig(null);
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
  const totalResults = webResults.length;

  // Generate masked URL for display
  const getMaskedUrl = (index: number) => {
    return `dataorbit.lid${index + 1}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-8 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-32" />
            <div className="space-y-6 mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded w-40" />
                  <div className="h-5 bg-muted rounded w-48" />
                  <div className="h-4 bg-muted rounded w-full" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Email Popup
  if (showEmailPopup && selectedResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-background rounded-xl p-6 max-w-md w-full relative shadow-2xl">
          <button 
            onClick={() => {
              setShowEmailPopup(false);
              setSelectedResult(null);
              setPreLandingConfig(null);
            }}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Subscribe to continue</h3>
              <p className="text-sm text-muted-foreground">Get exclusive updates and offers</p>
            </div>
          </div>
          
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <Input 
              type="email" 
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              required
              autoFocus
            />
            <Button type="submit" disabled={submittingEmail} className="w-full">
              {submittingEmail ? 'Submitting...' : 'Continue'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Pre-landing page
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
        
        <button 
          onClick={() => {
            setShowPreLanding(false);
            setSelectedResult(null);
            setPreLandingConfig(null);
          }} 
          className="mt-4 text-white/60 hover:text-white text-sm"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <h1 className="text-xl font-bold text-foreground mb-1">
          Results for: {relatedSearch?.title || 'Search'}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {totalResults} result{totalResults !== 1 ? 's' : ''} found
        </p>
        
        <div className="space-y-6">
          {/* Sponsored Results */}
          {sponsoredResults.map((result, index) => (
            <div key={result.id} className="group">
              <div className="flex items-center gap-2 mb-1">
                {result.logo ? (
                  <img src={result.logo} alt={result.name} className="w-5 h-5 rounded" />
                ) : (
                  <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {result.name.charAt(0)}
                  </div>
                )}
                <button
                  onClick={() => handleResultClick(result)}
                  className="text-foreground text-sm hover:underline"
                >
                  https://{getMaskedUrl(index)}
                </button>
                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">AD</span>
              </div>
              <button
                onClick={() => handleResultClick(result)}
                className="text-primary hover:underline font-medium text-left"
              >
                {result.title}
              </button>
              {result.description && (
                <p className="text-sm text-muted-foreground mt-1">{result.description}</p>
              )}
            </div>
          ))}

          {/* Normal Results */}
          {normalResults.map((result, index) => (
            <div key={result.id} className="group">
              <div className="flex items-center gap-2 mb-1">
                {result.logo ? (
                  <img src={result.logo} alt={result.name} className="w-5 h-5 rounded" />
                ) : (
                  <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {result.name.charAt(0)}
                  </div>
                )}
                <button
                  onClick={() => handleResultClick(result)}
                  className="text-foreground text-sm hover:underline"
                >
                  https://{getMaskedUrl(sponsoredResults.length + index)}
                </button>
              </div>
              <button
                onClick={() => handleResultClick(result)}
                className="text-primary hover:underline font-medium text-left"
              >
                {result.title}
              </button>
              {result.description && (
                <p className="text-sm text-muted-foreground mt-1">{result.description}</p>
              )}
            </div>
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default WebResultsPage;
