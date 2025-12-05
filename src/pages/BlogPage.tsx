import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RecentPosts from "@/components/RecentPosts";
import RelatedSearches from "@/components/RelatedSearches";
import { trackEvent } from "@/lib/tracking";

interface Blog {
  id: string;
  serial_number: number;
  title: string;
  slug: string;
  content: string;
  featured_image: string;
  author: string;
  author_bio: string | null;
  author_image: string | null;
  published_at: string;
  categories: { name: string; slug: string } | null;
}

interface RelatedSearch {
  id: string;
  title: string;
  position: number;
  web_result_page: number;
}

const BlogPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedSearches, setRelatedSearches] = useState<RelatedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: blogData } = await supabase
        .from('blogs')
        .select('*, categories(name, slug)')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      
      if (blogData) {
        setBlog(blogData as Blog);
        await trackEvent('page_view', { blogId: blogData.id, pageUrl: window.location.pathname });
        
        const { data: searchData } = await supabase
          .from('related_searches')
          .select('*')
          .eq('blog_id', blogData.id)
          .order('position');
        
        if (searchData) setRelatedSearches(searchData);
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Blog Not Found</h1>
          <p className="text-muted-foreground">The article you're looking for doesn't exist.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-24">
              <div className="bg-card rounded-xl p-6 border border-border mb-6">
                <img 
                  src={blog.author_image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200'} 
                  alt={blog.author}
                  className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
                />
                <h3 className="font-semibold text-foreground text-center text-lg">{blog.author}</h3>
                {blog.author_bio && (
                  <p className="text-muted-foreground text-sm text-center mt-2">{blog.author_bio}</p>
                )}
              </div>
              <RecentPosts />
            </div>
          </div>
          
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="mb-6">
              <span className="inline-block bg-muted text-muted-foreground text-sm px-3 py-1 rounded-full">
                {blog.categories?.name}
              </span>
              <span className="text-muted-foreground text-sm ml-3">
                • {new Date(blog.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8 leading-tight">
              {blog.title}
            </h1>
            
            <img 
              src={blog.featured_image} 
              alt={blog.title}
              className="w-full rounded-xl mb-8 aspect-video object-cover"
            />
            
            <RelatedSearches searches={relatedSearches} blogId={blog.id} />
            
            <article className="prose prose-lg max-w-none">
              {blog.content.split('\n').map((paragraph, i) => (
                <p key={i} className="mb-4 text-foreground/90 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </article>
            
            <div className="mt-12 p-6 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground leading-relaxed">
                All content provided on this page is carefully researched, written, and reviewed to maintain a high level of accuracy and reliability. While every effort is made to ensure the information is current and useful, it is shared for general educational and informational purposes only. The material on this page should not be interpreted as professional advice, diagnosis, or treatment in any area, including financial, medical, or legal matters. Readers are strongly advised to verify information independently and consult qualified professionals before making any personal, financial, health, or legal decisions based on the content presented here.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogPage;
