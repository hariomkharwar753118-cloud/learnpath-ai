const Footer = () => {
  return (
    <footer className="w-full bg-background px-8 md:px-16 lg:px-24 py-12">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a 
              href="#privacy" 
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </a>
            <span className="text-border">•</span>
            <a 
              href="#terms" 
              className="hover:text-foreground transition-colors"
            >
              Terms
            </a>
            <span className="text-border">•</span>
            <a 
              href="#contact" 
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
