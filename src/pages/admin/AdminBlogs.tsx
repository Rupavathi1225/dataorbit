import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";

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
  category_id: number | null;
  status: string;
  published_at: string;
  categories: { name: string } | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

const AdminBlogs = () => {
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    featured_image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
    author: '',
    author_bio: '',
    author_image: '',
    category_id: '',
    status: 'draft',
  });

  const fetchData = async () => {
    const [blogsRes, catsRes] = await Promise.all([
      supabase.from('blogs').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('id'),
    ]);
    
    if (blogsRes.data) setBlogs(blogsRes.data as Blog[]);
    if (catsRes.data) setCategories(catsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title, slug: generateSlug(title) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const blogData = {
      title: formData.title,
      slug: formData.slug,
      content: formData.content,
      featured_image: formData.featured_image,
      author: formData.author,
      author_bio: formData.author_bio || null,
      author_image: formData.author_image || null,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      status: formData.status,
      published_at: formData.status === 'published' ? new Date().toISOString() : null,
    };
    
    if (editingBlog) {
      const { error } = await supabase
        .from('blogs')
        .update(blogData)
        .eq('id', editingBlog.id);
      
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Blog updated successfully' });
        setIsDialogOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from('blogs').insert(blogData);
      
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Blog created successfully' });
        setIsDialogOpen(false);
        fetchData();
      }
    }
    
    resetForm();
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      featured_image: blog.featured_image,
      author: blog.author,
      author_bio: blog.author_bio || '',
      author_image: blog.author_image || '',
      category_id: blog.category_id?.toString() || '',
      status: blog.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;
    
    const { error } = await supabase.from('blogs').delete().eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Blog deleted successfully' });
      fetchData();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      featured_image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
      author: '',
      author_bio: '',
      author_image: '',
      category_id: '',
      status: 'draft',
    });
    setEditingBlog(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">Blogs</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Blog</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBlog ? 'Edit Blog' : 'Create New Blog'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Title</label>
                <Input value={formData.title} onChange={(e) => handleTitleChange(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Slug</label>
                <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Category</label>
                <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Content</label>
                <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={8} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Featured Image URL</label>
                <Input value={formData.featured_image} onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Author Name</label>
                  <Input value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Author Image URL</label>
                  <Input value={formData.author_image} onChange={(e) => setFormData({ ...formData, author_image: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Author Bio</label>
                <Textarea value={formData.author_bio} onChange={(e) => setFormData({ ...formData, author_bio: e.target.value })} rows={2} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">{editingBlog ? 'Update Blog' : 'Create Blog'}</Button>
            </form>
          </DialogContent>
        </Dialog>
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
                <th className="text-left p-4 text-sm font-medium text-foreground">#</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Title</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Category</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Author</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog.id} className="border-t border-border">
                  <td className="p-4 text-sm text-muted-foreground">{blog.serial_number}</td>
                  <td className="p-4 text-sm text-foreground">{blog.title}</td>
                  <td className="p-4 text-sm text-muted-foreground">{blog.categories?.name || '-'}</td>
                  <td className="p-4 text-sm text-muted-foreground">{blog.author}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded ${blog.status === 'published' ? 'bg-green-500/20 text-green-600' : 'bg-yellow-500/20 text-yellow-600'}`}>
                      {blog.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(blog)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(blog.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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

export default AdminBlogs;
