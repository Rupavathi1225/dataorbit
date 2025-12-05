import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Blog {
  id: string;
  title: string;
  slug: string;
  featured_image: string;
  published_at: string;
  categories: { slug: string } | null;
}

const RecentPosts = () => {
  const [posts, setPosts] = useState<Blog[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('blogs')
        .select('id, title, slug, featured_image, published_at, categories(slug)')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(5);
      if (data) setPosts(data as Blog[]);
    };
    fetchPosts();
  }, []);

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <h3 className="font-semibold text-foreground text-lg mb-4">Recent Posts</h3>
      <div className="space-y-4">
        {posts.map((post) => (
          <Link 
            key={post.id}
            to={`/blog/${post.categories?.slug || 'uncategorized'}/${post.slug}`}
            className="flex gap-3 group"
          >
            <img 
              src={post.featured_image} 
              alt={post.title}
              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </h4>
              <span className="text-xs text-muted-foreground">
                {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentPosts;
