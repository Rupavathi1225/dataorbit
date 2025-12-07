import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogCard from "@/components/BlogCard";
import { initSession, trackEvent } from "@/lib/tracking";

interface Blog {
  id: string;
  serial_number: number;
  title: string;
  slug: string;
  content: string;
  featured_image: string;
  author: string;
  published_at: string;
  categories: { name: string; slug: string } | null;
}

const Index = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await initSession();
      await trackEvent('page_view', { pageUrl: '/' });
      
      const { data } = await supabase
        .from('blogs')
        .select('id, serial_number, title, slug, content, featured_image, author, published_at, categories(name, slug)')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      
      if (data) setBlogs(data as Blog[]);
      setLoading(false);
    };
    init();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Welcome to DataOrbit
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover insightful articles across various topics
          </p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card rounded-xl border border-border animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No blogs published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <BlogCard
                key={blog.id}
                id={blog.id}
                title={blog.title}
                slug={blog.slug}
                featuredImage={blog.featured_image}
                author={blog.author}
                publishedAt={blog.published_at}
                categoryName={blog.categories?.name || 'Uncategorized'}
                categorySlug={blog.categories?.slug || 'uncategorized'}
              />
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
