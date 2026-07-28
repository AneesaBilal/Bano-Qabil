import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Compass,
  Facebook,
  GraduationCap,
  Instagram,
  LayoutDashboard,
  Linkedin,
  Mail,
  MapPin,
  Menu,
  Phone,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Twitter,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "Contact", href: "#contact" },
];

const ABOUT_ITEMS = [
  { icon: Target, title: "Our Mission", text: "Making quality education management accessible, organized, and stress-free for every institute." },
  { icon: Compass, title: "Our Vision", text: "To be the platform every school and academy relies on to run their academic operations end-to-end." },
  { icon: Sparkles, title: "Quality Education", text: "Tools that help teachers spend less time on paperwork and more time actually teaching." },
  { icon: Rocket, title: "Student Growth", text: "Clear visibility into assignments, grades, and attendance so students stay on track." },
  { icon: BarChart3, title: "Career Development", text: "Structured records and reports that support students long after they graduate." },
  { icon: LayoutDashboard, title: "Digital Learning", text: "A single dashboard that brings students, teachers, and administrators onto one page." },
];

const FEATURE_ITEMS = [
  { icon: Users, title: "Student Management", text: "Centralized student profiles, enrollment, and batch records." },
  { icon: GraduationCap, title: "Teacher Portal", text: "Dedicated workspace for teachers to manage their own classes." },
  { icon: BookOpen, title: "Course Management", text: "Organize courses and batches with flexible timing and scheduling." },
  { icon: CalendarCheck, title: "Attendance", text: "Fast daily attendance marking with instant reports." },
  { icon: ClipboardList, title: "Assignments", text: "Create, distribute, submit, and grade assignments online." },
  { icon: ShieldCheck, title: "Admin Approvals", text: "Every new Student and Teacher account is reviewed before activation." },
  { icon: BarChart3, title: "Reports", text: "Exportable, real-time reports across attendance and performance." },
  { icon: LayoutDashboard, title: "Role Dashboards", text: "Purpose-built dashboards for Admins, Teachers, and Students." },
  { icon: BellRing, title: "Notifications", text: "Stay informed the moment something needs your attention." },
  { icon: Sparkles, title: "Analytics", text: "Institute-wide insight into enrollment, submissions, and attendance trends." },
];

const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  message: z.string().min(10, "Message should be at least 10 characters"),
});
type ContactFormValues = z.infer<typeof contactSchema>;

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("#home");

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.querySelector(l.href)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const contactForm = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  function onContactSubmit(values: ContactFormValues) {
    // No backend contact endpoint exists yet — this simulates a submission
    // so the form is fully usable; wire it up to an API route/table when ready.
    void values;
    toast.success("Thanks for reaching out! We'll get back to you soon.");
    contactForm.reset();
  }

  if (!isLoading && isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-300",
          scrolled ? "border-border bg-background/90 backdrop-blur-md shadow-sm" : "border-transparent bg-transparent"
        )}
      >
        <div className="container flex h-16 items-center justify-between">
          <a href="#home" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-premium">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                  activeSection === link.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.label}
                {activeSection === link.href && (
                  <span className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-primary" />
                )}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost">
              <Link to={ROUTES.login}>Login</Link>
            </Button>
            <Button asChild>
              <Link to={ROUTES.signup}>
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <button className="p-2 md:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t bg-background px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2">
              <Button asChild variant="outline">
                <Link to={ROUTES.login}>Login</Link>
              </Button>
              <Button asChild>
                <Link to={ROUTES.signup}>Get Started</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden bg-grid-slate">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 animate-float rounded-full bg-primary/20 blur-3xl" />
        <div
          className="pointer-events-none absolute -right-24 top-40 h-72 w-72 animate-float rounded-full bg-[hsl(var(--brand-teal))]/20 blur-3xl"
          style={{ animationDelay: "2s" }}
        />

        <div className="container relative flex flex-col items-center gap-8 py-24 text-center sm:py-32">
          <span className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--brand-amber))]" />
            Empowering institutes with modern academic management
          </span>

          <h1
            className="animate-fade-in-up max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="bg-gradient-to-r from-primary via-primary to-[hsl(var(--brand-teal))] bg-clip-text text-transparent">
              {APP_NAME}
            </span>
            <br />
            Learning Management System
          </h1>

          <p className="animate-fade-in-up max-w-xl text-balance text-muted-foreground sm:text-lg" style={{ animationDelay: "0.2s" }}>
            One platform for students, teachers, and administrators to manage courses, assignments, attendance, and
            reporting — all in one clean, connected workspace.
          </p>

          <div className="animate-fade-in-up flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "0.3s" }}>
            <Button asChild size="lg" className="group">
              <Link to={ROUTES.signup}>
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={ROUTES.login}>Login</Link>
            </Button>
          </div>

          {/* Simple product preview mockup (no external image assets required) */}
          <div className="animate-fade-in-up mt-6 w-full max-w-3xl" style={{ animationDelay: "0.4s" }}>
            <div className="rounded-2xl border bg-card p-3 shadow-premium-lg">
              <div className="flex items-center gap-1.5 border-b px-2 pb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--brand-amber))]/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              </div>
              <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4">
                {[
                  { icon: Users, label: "Students", color: "#059669" },
                  { icon: GraduationCap, label: "Teachers", color: "#7c3aed" },
                  { icon: ClipboardList, label: "Assignments", color: "#db2777" },
                  { icon: CalendarCheck, label: "Attendance", color: "#0ea5e9" },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center gap-2 rounded-xl border bg-background/60 p-4">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${stat.color}1a`, color: stat.color }}
                    >
                      <stat.icon className="h-[18px] w-[18px]" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="container py-24">
        <div className="mx-auto mb-14 max-w-xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">About Us</span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Built around real academic needs</h2>
          <p className="mt-3 text-muted-foreground">
            {APP_NAME} brings structure to everyday institute operations — from enrollment to graduation.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ABOUT_ITEMS.map((item) => (
            <Card key={item.title} className="border-none bg-muted/40">
              <CardContent className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-muted/30 py-24">
        <div className="container">
          <div className="mx-auto mb-14 max-w-xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-primary">Features</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Everything your institute needs</h2>
            <p className="mt-3 text-muted-foreground">A complete toolkit for administrators, teachers, and students alike.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_ITEMS.map((feature, i) => {
              const hue = (i * 37) % 360;
              return (
                <Card key={feature.title} className="group">
                  <CardContent className="p-6">
                    <div
                      className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                      style={{ backgroundColor: `hsl(${hue} 85% 96%)`, color: `hsl(${hue} 70% 40%)` }}
                    >
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{feature.text}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="container py-24">
        <div className="mx-auto mb-14 max-w-xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">Contact</span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Get in touch</h2>
          <p className="mt-3 text-muted-foreground">Questions about onboarding your institute? Send us a message.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <Card className="border-none bg-muted/40">
              <CardContent className="flex items-start gap-3 p-5">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Address</p>
                  <p className="text-sm text-muted-foreground">123 Education Avenue, Islamabad, Pakistan</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none bg-muted/40">
              <CardContent className="flex items-start gap-3 p-5">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Phone</p>
                  <p className="text-sm text-muted-foreground">+92 300 1234567</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none bg-muted/40">
              <CardContent className="flex items-start gap-3 p-5">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Email</p>
                  <p className="text-sm text-muted-foreground">hello@banoqabil.example</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="lg:col-span-3">
            <CardContent className="p-6">
              <Form {...contactForm}>
                <form onSubmit={contactForm.handleSubmit(onContactSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={contactForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={contactForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={contactForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea rows={5} placeholder="How can we help?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="lg" disabled={contactForm.formState.isSubmitting}>
                    Send Message
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="font-bold">{APP_NAME}</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              A complete learning management platform for modern educational institutes.
            </p>
            <div className="mt-4 flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">Quick Links</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} className="hover:text-primary">
                  {link.label}
                </a>
              ))}
              <Link to={ROUTES.login} className="hover:text-primary">
                Login
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">Contact</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Islamabad, Pakistan
              </span>
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> +92 300 1234567
              </span>
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> hello@banoqabil.example
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">Legal</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-primary">
                Terms &amp; Conditions
              </a>
            </div>
          </div>
        </div>
        <div className="border-t py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
