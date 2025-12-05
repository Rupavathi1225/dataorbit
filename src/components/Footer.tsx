import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">DO</span>
              </div>
              <span className="font-bold text-xl text-foreground">DataOrbit</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-md">
              Discover insightful articles across various topics including lifestyle, education, wellness, deals, job seeking, and alternative learning.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Categories</h4>
            <ul className="space-y-2">
              <li><Link to="/category/lifestyle" className="text-sm text-muted-foreground hover:text-primary transition-colors">Lifestyle</Link></li>
              <li><Link to="/category/education" className="text-sm text-muted-foreground hover:text-primary transition-colors">Education</Link></li>
              <li><Link to="/category/wellness" className="text-sm text-muted-foreground hover:text-primary transition-colors">Wellness</Link></li>
              <li><Link to="/category/deals" className="text-sm text-muted-foreground hover:text-primary transition-colors">Deals</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">More</h4>
            <ul className="space-y-2">
              <li><Link to="/category/job-seeking" className="text-sm text-muted-foreground hover:text-primary transition-colors">Job Seeking</Link></li>
              <li><Link to="/category/alternative-learning" className="text-sm text-muted-foreground hover:text-primary transition-colors">Alternative Learning</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8">
          <p className="text-xs text-muted-foreground leading-relaxed">
            All content provided on this page is carefully researched, written, and reviewed to maintain a high level of accuracy and reliability. While every effort is made to ensure the information is current and useful, it is shared for general educational and informational purposes only. The material on this page should not be interpreted as professional advice, diagnosis, or treatment in any area, including financial, medical, or legal matters. Readers are strongly advised to verify information independently and consult qualified professionals before making any personal, financial, health, or legal decisions based on the content presented here.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            © {new Date().getFullYear()} DataOrbit. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
