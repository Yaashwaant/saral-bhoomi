import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

const ReactLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ok = await login(email.trim(), password);
      if (ok) {
        // Decide destination based on stored user role
        const stored = localStorage.getItem("user");
        const role = stored ? (JSON.parse(stored).role as string) : "officer";
        if (role === "field_officer") {
          navigate("/field-officer");
        } else if (role === "officer") {
          navigate("/officer-dashboard");
        } else if (role === "admin") {
          navigate("/saral/dashboard");
        } else {
          navigate("/saral/dashboard");
        }
      } else {
        toast.error("Invalid credentials. Please check your email and password.");
      }
    } catch (err) {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-agri-background to-white relative overflow-hidden">
      {/* Subtle animated background accent */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 1.2 }}
        className="absolute inset-0 pointer-events-none"
      >
        <motion.div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-agri-primary/10 blur-3xl"
          animate={{ y: [0, 10, 0], x: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 8 }}
        />
        <motion.div
          className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-accent/10 blur-3xl"
          animate={{ y: [0, -10, 0], x: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 10 }}
        />
      </motion.div>

      {/* Header */}
      <header className="container py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/emblem-of-india.png"
            alt="Emblem of India"
            className="h-10 w-auto object-contain"
          />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-orange-800">eSULABH-SYSTEM FOR UNIFIED LAND ACQUISITION through BLOCKCHAIN</h1>
            <p className="text-xs md:text-sm text-orange-600">System for Automated Resourceful Acquisition of Land</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-8 md:py-16">
        {/* Left: Hero content */}
        <div className="order-2 lg:order-1">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-orange-700">
              <Shield className="h-4 w-4" />
              <span className="text-xs font-medium">Government of Maharashtra</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-semibold text-foreground">
              Empowering Land Acquisition with Transparency and Efficiency
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Sign in to continue to the eSULABH-SYSTEM FOR UNIFIED LAND ACQUISITION through BLOCKCHAIN portal. Manage projects, land records, notices and work seamlessly across departments.
            </p>

            {/* Demo credentials helper (retain core basic access) */}
            <div className="mt-6 p-4 rounded-xl bg-white shadow-card border border-border/50">
              <p className="text-sm font-medium text-foreground mb-2">Demo Accounts</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li><span className="font-semibold">Admin:</span> admin@saral.gov.in / admin</li>
                <li><span className="font-semibold">Officer:</span> officer@saral.gov.in / officer</li>
                <li><span className="font-semibold">Field Officer:</span> agent@saral.gov.in / field123</li>
                <li><span className="font-semibold">Field Officer:</span> field.officer@saralbhoomi.gov.in / field123</li>
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Right: Login card */}
        <div className="order-1 lg:order-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="glass rounded-2xl shadow-glass p-6 md:p-8 border border-white/30"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-heading font-semibold text-foreground">Sign in</h3>
              <p className="text-sm text-muted-foreground">Use your official credentials to access the portal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@department.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By signing in, you agree to the usage policies of Government of Maharashtra.
              </p>
            </form>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/emblem-of-india.png"
              alt="Emblem of India"
              className="h-8 w-auto object-contain"
            />
            <p className="text-xs text-orange-600">Government of Maharashtra • Land Acquisition Department</p>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} eSULABH-SYSTEM FOR UNIFIED LAND ACQUISITION through BLOCKCHAIN</p>
        </div>
      </footer>
    </div>
  );
};

export default ReactLoginPage;