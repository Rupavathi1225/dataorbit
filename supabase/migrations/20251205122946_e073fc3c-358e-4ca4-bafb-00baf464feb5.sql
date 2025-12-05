-- Create categories table
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  code_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blogs table
CREATE TABLE public.blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_number SERIAL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category_id INTEGER REFERENCES public.categories(id),
  author TEXT NOT NULL,
  author_bio TEXT,
  author_image TEXT,
  content TEXT NOT NULL,
  featured_image TEXT DEFAULT 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create related_searches table
CREATE TABLE public.related_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id UUID REFERENCES public.blogs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create web_results table
CREATE TABLE public.web_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  related_search_id UUID REFERENCES public.related_searches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo TEXT,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_sponsored BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pre_landing_config table
CREATE TABLE public.pre_landing_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  web_result_id UUID REFERENCES public.web_results(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  logo_position TEXT DEFAULT 'top-center',
  logo_size INTEGER DEFAULT 100,
  main_image_url TEXT,
  headline TEXT,
  description TEXT,
  headline_font_size INTEGER DEFAULT 32,
  headline_color TEXT DEFAULT '#ffffff',
  description_color TEXT DEFAULT '#cccccc',
  button_text TEXT DEFAULT 'Visit Now',
  button_color TEXT DEFAULT '#3b82f6',
  background_color TEXT DEFAULT '#1a1a2e',
  background_image TEXT,
  countdown_seconds INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tracking_sessions table
CREATE TABLE public.tracking_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  ip_address TEXT,
  device TEXT,
  browser TEXT,
  country TEXT,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tracking_events table
CREATE TABLE public.tracking_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  blog_id UUID REFERENCES public.blogs(id) ON DELETE SET NULL,
  related_search_id UUID REFERENCES public.related_searches(id) ON DELETE SET NULL,
  web_result_id UUID REFERENCES public.web_results(id) ON DELETE SET NULL,
  ip_address TEXT,
  device TEXT,
  country TEXT,
  source TEXT,
  page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_submissions table
CREATE TABLE public.email_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  web_result_id UUID REFERENCES public.web_results(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.related_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_landing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_submissions ENABLE ROW LEVEL SECURITY;

-- Create public read policies for frontend
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read blogs" ON public.blogs FOR SELECT USING (status = 'published');
CREATE POLICY "Public read related_searches" ON public.related_searches FOR SELECT USING (true);
CREATE POLICY "Public read web_results" ON public.web_results FOR SELECT USING (true);
CREATE POLICY "Public read pre_landing_config" ON public.pre_landing_config FOR SELECT USING (true);

-- Create public insert policies for tracking
CREATE POLICY "Public insert tracking_sessions" ON public.tracking_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert tracking_events" ON public.tracking_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert email_submissions" ON public.email_submissions FOR INSERT WITH CHECK (true);

-- Create public read policies for tracking (for analytics)
CREATE POLICY "Public read tracking_sessions" ON public.tracking_sessions FOR SELECT USING (true);
CREATE POLICY "Public read tracking_events" ON public.tracking_events FOR SELECT USING (true);
CREATE POLICY "Public read email_submissions" ON public.email_submissions FOR SELECT USING (true);

-- Admin policies for full access (using service role in admin)
CREATE POLICY "Admin full access categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access blogs" ON public.blogs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access related_searches" ON public.related_searches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access web_results" ON public.web_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access pre_landing_config" ON public.pre_landing_config FOR ALL USING (true) WITH CHECK (true);

-- Insert default categories
INSERT INTO public.categories (name, slug, code_range) VALUES
('Lifestyle', 'lifestyle', '100-200'),
('Education', 'education', '201-300'),
('Wellness', 'wellness', '301-400'),
('Deals', 'deals', '401-500'),
('Job Seeking', 'job-seeking', '501-600'),
('Alternative Learning', 'alternative-learning', '601-700');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_blogs_updated_at
  BEFORE UPDATE ON public.blogs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pre_landing_updated_at
  BEFORE UPDATE ON public.pre_landing_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();