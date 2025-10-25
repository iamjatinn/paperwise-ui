// src/components/Navbar.tsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import {
  FileText,
  LogOut,
  FileStack,
  Menu,
  X,
  Home,
  Upload,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    ...(user
      ? [
          { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
          { path: "/upload", label: "Upload", icon: Upload },
          { path: "/multi-qa", label: "Multi-Doc Q&A", icon: FileStack },
        ]
      : []),
  ];

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          {/* Logo */}
          {/* Animated Gradient Logo */}
          <motion.div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-3 group relative"
              onClick={() => setMobileMenuOpen(false)}
            >
              {/* Animated Gradient Container */}
              <div className="relative">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-600 to-cyan-500 rounded-xl blur-lg group-hover:blur-xl transition-all duration-1000 opacity-70 group-hover:opacity-100 animate-pulse" />

                {/* Main Logo */}
                <motion.div
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 flex items-center justify-center shadow-2xl relative z-10 border-2 border-white/20"
                  whileHover={{
                    scale: 1.1,
                    rotate: [0, -5, 5, 0],
                    transition: { duration: 0.5 },
                  }}
                  animate={{
                    background: [
                      "linear-gradient(45deg, #3B82F6, #8B5CF6, #06B6D4)",
                      "linear-gradient(45deg, #8B5CF6, #06B6D4, #3B82F6)",
                      "linear-gradient(45deg, #06B6D4, #3B82F6, #8B5CF6)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {/* Document Stack */}
                  <div className="relative transform group-hover:scale-110 transition-transform duration-300">
                    <div className="w-6 h-7 bg-white rounded-sm shadow-lg relative z-10">
                      {/* Document Lines */}
                      <div className="absolute top-1 left-1 right-1 h-0.5 bg-purple-400/80 rounded" />
                      <div className="absolute top-2 left-1 right-2 h-0.5 bg-cyan-400/80 rounded" />
                      <div className="absolute top-3 left-1 right-1 h-0.5 bg-blue-400/80 rounded" />
                    </div>
                    {/* Floating Spark */}
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full shadow-lg"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [1, 0.7, 1],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Animated Text */}
              <motion.span
                className="font-bold text-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent relative"
                whileHover={{ scale: 1.05 }}
              >
                Paperwise
                {/* Text Underline Animation */}
                <motion.div
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-500"
                  initial={false}
                />
              </motion.span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.path}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 group ${
                      isActive(item.path)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-primary hover:bg-accent"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {isActive(item.path) && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <div className="text-sm text-muted-foreground">
                  Welcome,{" "}
                  <span className="text-primary font-medium">
                    {user.email.split("@")[0]}
                  </span>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button
                  onClick={() => navigate("/auth")}
                  className="gradient-primary text-white border-0 hover:opacity-90 px-6 relative overflow-hidden group"
                >
                  <span className="relative z-10">Sign In</span>
                  <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                </Button>
              </motion.div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative z-50"
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm md:hidden z-40"
                onClick={() => setMobileMenuOpen(false)}
              />

              {/* Menu Panel */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30 }}
                className="fixed top-0 right-0 h-full w-80 bg-background/95 backdrop-blur-xl border-l border-border/50 shadow-2xl md:hidden z-40"
              >
                <div className="flex flex-col h-full pt-20 pb-8 px-6">
                  {/* User Info */}
                  {user && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="mb-8 p-4 rounded-xl bg-accent/50"
                    >
                      <p className="text-sm text-muted-foreground">
                        Signed in as
                      </p>
                      <p className="font-semibold text-primary">{user.email}</p>
                    </motion.div>
                  )}

                  {/* Navigation Items */}
                  <div className="space-y-2 flex-1">
                    {navItems.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={item.path}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.1 }}
                        >
                          <Link
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                              isActive(item.path)
                                ? "text-primary bg-primary/10 border border-primary/20"
                                : "text-muted-foreground hover:text-primary hover:bg-accent"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            {item.label}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Mobile Actions */}
                  <div className="space-y-4 pt-8 border-t border-border/50">
                    {user ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-3"
                      >
                        <Button
                          onClick={handleLogout}
                          variant="outline"
                          className="w-full justify-center text-destructive border-destructive/20 hover:bg-destructive/10"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            navigate("/auth");
                          }}
                          className="w-full gradient-primary text-white border-0"
                        >
                          Sign In
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer for fixed nav */}
      <div className="h-16" />
    </>
  );
}
