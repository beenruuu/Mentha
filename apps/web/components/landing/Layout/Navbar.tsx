import React from 'react';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { Theme } from '@/components/types';

interface NavbarProps {
  theme: Theme;
  toggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ theme, toggleTheme }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const navLinks = [
    { label: 'Services', href: '#services' },
    { label: 'Methodology', href: '#shift' },
    { label: 'Cases', href: '#cases' },
    { label: 'Insights', href: '#footer' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-40 border-b border-mentha-forest dark:border-mentha-beige transition-colors duration-500 bg-opacity-90 backdrop-blur-sm mix-blend-hard-light">
      <div className="max-w-[1920px] mx-auto px-8 md:px-16 lg:px-24 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex-shrink-0">
          <a href="#" className="font-serif text-3xl tracking-tight">Mentha<span className="text-mentha-mint text-4xl">.</span></a>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-12">
          {navLinks.map((link) => (
            <a 
              key={link.label} 
              href={link.href} 
              className="font-mono text-xs uppercase tracking-widest hover:text-mentha-mint transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center space-x-6">
          <button 
            onClick={toggleTheme}
            className={`
              p-2 rounded-full border border-mentha-forest dark:border-mentha-beige transition-all
              hover:opacity-60
            `}
            aria-label="Toggle Theme"
          >
            {theme === Theme.LIGHT ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          
          <a 
            href="#audit"
            className={`
              px-6 py-3 font-sans text-sm font-bold tracking-wide transition-all duration-300
              ${theme === Theme.LIGHT 
                  ? 'bg-mentha-forest text-mentha-beige border border-transparent hover:bg-transparent hover:text-mentha-forest hover:border-mentha-forest' 
                  : 'bg-mentha-beige text-mentha-forest border border-transparent hover:bg-transparent hover:text-mentha-beige hover:border-mentha-beige'}
            `}
          >
            AUDIT YOUR BRAND
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full h-screen bg-mentha-beige dark:bg-mentha-dark bg-opacity-95 dark:bg-opacity-95 border-t border-mentha-forest dark:border-mentha-beige flex flex-col p-8 space-y-8 animate-in slide-in-from-top-10 duration-300 z-50 backdrop-blur-sm">
           {navLinks.map((link) => (
            <a 
              key={link.label} 
              href={link.href} 
              onClick={() => setIsOpen(false)}
              className="font-serif text-4xl hover:text-mentha-mint transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-8 border-t border-mentha-forest dark:border-mentha-beige w-full flex justify-between items-center">
             <button onClick={toggleTheme} className="flex items-center space-x-2 font-mono text-sm uppercase tracking-widest">
                {theme === Theme.LIGHT ? <Moon size={16} /> : <Sun size={16} />}
                <span>{theme === Theme.LIGHT ? 'Switch to Dark' : 'Switch to Light'}</span>
             </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
