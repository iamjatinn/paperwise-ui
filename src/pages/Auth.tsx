// src/pages/Auth.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  FileText,
  Eye,
  EyeOff,
  Zap,
  Sparkles,
  Shield,
  Rocket,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [showPassword, setShowPassword] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signup-email") as string;
    const password = formData.get("signup-password") as string;

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const userData = { id: `user-${Date.now()}`, email };
    login(userData);

    toast({
      title: "🎉 Welcome aboard!",
      description: "Your account has been created successfully.",
    });
    setLoading(false);
    navigate("/dashboard");
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signin-email") as string;
    const password = formData.get("signin-password") as string;

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const userData = { id: `user-${Date.now()}`, email };
    login(userData);

    toast({
      title: "👋 Welcome back!",
      description: "You have successfully signed in.",
    });
    setLoading(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 dark:from-slate-950 dark:via-blue-950 dark:to-purple-900 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-border/50 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg glow-effect"
            >
              <FileText className="w-10 h-10 text-white" />
            </motion.div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants}>
                <CardTitle className="text-3xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Welcome to DocAI
                </CardTitle>
              </motion.div>
              <motion.div variants={itemVariants}>
                <CardDescription className="text-lg mt-2">
                  AI-powered document analysis at your fingertips
                </CardDescription>
              </motion.div>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-2xl">
                <TabsTrigger
                  value="signin"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-800 transition-all"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-800 transition-all"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="signin" key="signin">
                  <motion.form
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSignIn}
                    className="space-y-4"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="signin-email"
                          className="text-sm font-medium"
                        >
                          Email Address
                        </Label>
                        <div className="relative">
                          <Input
                            id="signin-email"
                            name="signin-email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            className="h-12 pl-4 pr-4 rounded-xl border-border/50 focus:border-primary/50 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="signin-password"
                          className="text-sm font-medium"
                        >
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="signin-password"
                            name="signin-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            required
                            className="h-12 pl-4 pr-12 rounded-xl border-border/50 focus:border-primary/50 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        className="w-full h-12 rounded-xl gradient-primary text-white font-semibold text-lg relative overflow-hidden group"
                        disabled={loading}
                      >
                        <motion.span
                          animate={loading ? { opacity: 0 } : { opacity: 1 }}
                          className="flex items-center justify-center gap-2"
                        >
                          <Zap className="w-5 h-5" />
                          {loading ? "Signing in..." : "Sign In"}
                        </motion.span>
                        {loading && (
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                            />
                          </motion.div>
                        )}
                        <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                      </Button>
                    </motion.div>
                  </motion.form>
                </TabsContent>

                <TabsContent value="signup" key="signup">
                  <motion.form
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSignUp}
                    className="space-y-4"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="signup-email"
                          className="text-sm font-medium"
                        >
                          Email Address
                        </Label>
                        <Input
                          id="signup-email"
                          name="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          required
                          className="h-12 rounded-xl border-border/50 focus:border-primary/50 transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="signup-password"
                          className="text-sm font-medium"
                        >
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            name="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className="h-12 pl-4 pr-12 rounded-xl border-border/50 focus:border-primary/50 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Must be at least 6 characters long
                        </p>
                      </div>
                    </div>

                    {/* Features List */}
                    <motion.div
                      className="grid grid-cols-2 gap-3 text-xs text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span>AI Summaries</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span>Secure Storage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Rocket className="w-4 h-4 text-purple-500" />
                        <span>Fast Processing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span>Multi-format</span>
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        className="w-full h-12 rounded-xl gradient-primary text-white font-semibold text-lg relative overflow-hidden group"
                        disabled={loading}
                      >
                        <motion.span
                          animate={loading ? { opacity: 0 } : { opacity: 1 }}
                          className="flex items-center justify-center gap-2"
                        >
                          <Rocket className="w-5 h-5" />
                          {loading ? "Creating account..." : "Create Account"}
                        </motion.span>
                        {loading && (
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                            />
                          </motion.div>
                        )}
                        <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                      </Button>
                    </motion.div>
                  </motion.form>
                </TabsContent>
              </AnimatePresence>
            </Tabs>

            {/* Demo Notice */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center"
            >
              <p className="text-xs text-muted-foreground">
                🔐 Demo: Use any email and password to sign in
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
