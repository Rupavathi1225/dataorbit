import { Link, useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: number;
  name: string;
  slug: string;
}

const Header = () => {
  const location = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').order('id');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">DO</span>
            </div>
            <span className="font-bold text-xl text-foreground">DataOrbit</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/' ? 'text-primary' : 'text-foreground'}`}
            >
              Home
            </Link>
            {categories.map((cat) => (
              <Link 
                key={cat.id}
                to={`/category/${cat.slug}`}
                className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === `/category/${cat.slug}` ? 'text-primary' : 'text-foreground'}`}
              >
                {cat.name}
              </Link>
            ))}
          </nav>
          
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Search className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
