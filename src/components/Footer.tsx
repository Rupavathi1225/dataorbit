import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">DO</span>
            </div>
            <span className="font-bold text-xl text-foreground">DataOrbit</span>
          </Link>
          
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} DataOrbit. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;