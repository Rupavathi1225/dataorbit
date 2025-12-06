import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-muted-foreground leading-relaxed mb-6">
            All content provided on this page is carefully researched, written, and reviewed to maintain a high level of accuracy and reliability. While every effort is made to ensure the information is current and useful, it is shared for general educational and informational purposes only. The material on this page should not be interpreted as professional advice, diagnosis, or treatment in any area, including financial, medical, or legal matters. Readers are strongly advised to verify information independently and consult qualified professionals before making any personal, financial, health, or legal decisions based on the content presented here.
          </p>
          
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} DataOrbit. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
