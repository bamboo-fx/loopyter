import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Brain,
  BarChart3,
  ArrowRight,
  Code2,
  LineChart,
  Layers,
  Wand2,
} from "lucide-react";
import AnimatedShaderBackground from "@/components/ui/animated-shader-background";
import DisplayCards from "@/components/ui/display-cards";
import { GlowingEffect } from "@/components/ui/glowing-effect";

// Feature card with glowing effect
function FeatureCard({
  icon: Icon,
  title,
  description,
  delay
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <div
      className="animate-fade-in-up opacity-0"
      style={{ animationDelay: `${delay}s`, animationFillMode: 'forwards' }}
    >
      <div className="relative h-full rounded-xl border border-border/50 p-1">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={2}
        />
        <div className="relative h-full rounded-lg bg-card/80 backdrop-blur-sm p-6">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-syne text-lg font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  const featureCards = [
    {
      icon: <Wand2 className="size-4 text-primary" />,
      title: "AI Data Cleaning",
      description: "Auto-fix missing values & outliers",
      date: "Instant",
      titleClassName: "text-primary",
      className:
        "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      icon: <Brain className="size-4 text-accent" />,
      title: "Smart Analysis",
      description: "Neural network-powered insights",
      date: "Real-time",
      titleClassName: "text-accent",
      className:
        "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      icon: <BarChart3 className="size-4 text-primary" />,
      title: "Model Builder",
      description: "Build ML models with AI assistance",
      date: "No code",
      titleClassName: "text-primary",
      className:
        "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated shader background */}
      <AnimatedShaderBackground />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-border/30 backdrop-blur-md bg-background/30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden">
              <img src="/loopyter-logo.png" alt="Loopyter" className="w-full h-full object-contain" />
            </div>
            <span className="font-syne text-lg font-semibold text-foreground">Loopyter</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/login")}
              className="text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/signup")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text */}
            <div className="text-center lg:text-left">
              <h1
                className="font-syne text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-fade-in-up opacity-0"
                style={{ animationDelay: '0.1s', animationFillMode: 'forwards', lineHeight: '1.3' }}
              >
                <span className="block pb-4">Build better models.</span>
                <span className="text-primary block pb-2">Automatically.</span>
              </h1>

              <p
                className="text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed animate-fade-in-up opacity-0"
                style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
              >
                Upload data, run once, and let AI improve the result.
              </p>

              <div
                className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 animate-fade-in-up opacity-0"
                style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
              >
                <Button
                  size="lg"
                  onClick={() => navigate("/signup")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base group"
                >
                  Start Building Free
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/app")}
                  className="h-12 px-8 text-base border-border hover:bg-secondary"
                >
                  Try Demo
                </Button>
              </div>
            </div>

            {/* Right side - Display Cards */}
            <div
              className="hidden lg:flex justify-center items-center animate-fade-in-up opacity-0"
              style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}
            >
              <DisplayCards cards={featureCards} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div
            className="text-center mb-16 animate-fade-in-up opacity-0"
            style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
          >
            <h2 className="font-syne text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need for Data Science
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From data cleaning to model deployment, our AI handles the complexity so you can focus on insights.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Wand2}
              title="AI Data Cleaning"
              description="Automatically detect and fix missing values, outliers, and data quality issues with visual feedback."
              delay={0.4}
            />
            <FeatureCard
              icon={Brain}
              title="Smart Analysis"
              description="Neural network-powered analysis identifies patterns, correlations, and optimal model recommendations."
              delay={0.5}
            />
            <FeatureCard
              icon={BarChart3}
              title="Professional Visualizations"
              description="Generate publication-ready charts with proper axis labels, formatting, and interactive tooltips."
              delay={0.6}
            />
            <FeatureCard
              icon={Layers}
              title="Model Builder"
              description="Chat with AI to configure and train ML models. Get recommendations based on your data characteristics."
              delay={0.7}
            />
            <FeatureCard
              icon={Code2}
              title="Interactive Notebook"
              description="Write and run Python code directly in the browser with real-time output and error handling."
              delay={0.8}
            />
            <FeatureCard
              icon={LineChart}
              title="Performance Tracking"
              description="Compare model runs, track accuracy improvements, and visualize training progress over time."
              delay={0.9}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div
            className="relative rounded-2xl p-1 animate-fade-in-up opacity-0"
            style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}
          >
            <GlowingEffect
              spread={60}
              glow={true}
              disabled={false}
              proximity={100}
              inactiveZone={0.01}
              borderWidth={2}
            />
            <div className="relative rounded-xl bg-gradient-to-br from-primary/10 via-card to-accent/5 p-12 text-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.1),transparent_50%)]" />
              <div className="relative">
                <h2 className="font-syne text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Ready to Transform Your Data?
                </h2>
                <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                  Join thousands of data scientists and analysts who are building smarter with AI.
                </p>
                <Button
                  size="lg"
                  onClick={() => navigate("/signup")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base"
                >
                  Get Started Free
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 py-8 px-6 bg-background/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img src="/loopyter-logo.png" alt="Loopyter" className="w-full h-full object-contain" />
            </div>
<span className="font-syne text-sm font-medium text-muted-foreground">
              Loopyter
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with AI, for AI enthusiasts
          </p>
        </div>
      </footer>
    </div>
  );
}
