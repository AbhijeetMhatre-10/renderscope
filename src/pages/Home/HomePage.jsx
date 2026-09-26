import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Globe,
  Gauge,
  Layers,
  History,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Activity,
  Cpu,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import ProductPreview from './components/ProductPreview';

export function HomePage() {
  const navigate = useNavigate();
  const [urlInput, setUrlInput] = useState('');
  const [inputError, setInputError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanUrl = urlInput.trim();

    if (!cleanUrl) {
      setInputError(true);
      return;
    }

    let formattedUrl = cleanUrl;

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      formattedUrl = `https://${cleanUrl}`;
    }

    navigate(`/analyze?url=${encodeURIComponent(formattedUrl)}`);
  };

  const sampleTargets = [
    'https://linear.app',
    'https://github.com',
    'https://stripe.com',
    'https://vercel.com',
  ];

  const features = [
    /**
     * title: String,
     * description: String,
     * icon: ReactIcon,
     * badge: String,
     */
    {
      title: 'Core Web Vitals Engine',
      description:
        'Quantify Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative Layout Shift (CLS) under calibrated network conditions.',
      icon: <Gauge className="w-5 h-5 text-status-info" />,
      badge: 'Metrics',
    },
    {
      title: 'Sub-Millisecond Waterfall',
      description:
        'Deconstruct request lifecycles from DNS resolution and TLS negotiation through Time to First Byte (TTFB) and content streaming.',
      icon: <Layers className="w-5 h-5 text-resource-js" />,
      badge: 'Timeline',
    },
    {
      title: 'Sequence Replay',
      description:
        'Inspect the DOM rendering sequence step-by-step. Identify exact moments of critical CSS blockages and hero asset reveals.',
      icon: <History className="w-5 h-5 text-resource-image" />,
      badge: 'Diagnostics',
    },
    {
      title: 'Automated Detective',
      description:
        'Heuristic audits scan for uncompressed assets, synchronous scripts, missing CDN cache headers, and late-discovered fonts.',
      icon: <ShieldCheck className="w-5 h-5 text-status-warning" />,
      badge: 'Audit',
    },
  ];

  const steps = [
    /**
     * num: String,
     * title: String,
     * description: String,
     */
    {
      num: '01',
      title: 'Target Specification',
      description: 'Enter any public URL or staging host. RenderScope initializes a headless chromium instance with clean cache.',
    },
    {
      num: '02',
      title: 'Instrumentation Probe',
      description: 'The engine records PerformanceObserver entries, Resource Timing APIs, and layout shift attribution coordinates.',
    },
    {
      num: '03',
      title: 'Timeline & Bottleneck Analysis',
      description: 'Explore the horizontal waterfall, drill into resource headers, and inspect automated remediation advisories.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col w-full bg-tech-grid pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-center space-y-8">
        {/* Release Tag */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-[11px] font-mono text-text-secondary select-none"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-status-info" />
          <span>PHASE 1 ARCHITECTURE READY</span>
          <span className="text-border">·</span>
          <span className="text-status-info font-medium">v0.1.0-alpha</span>
        </motion.div>

        {/* Headline & Subhead */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-3xl sm:text-5xl font-semibold tracking-tight text-text-primary font-sans leading-tight"
          >
            Understand how websites load.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            Analyze the performance of any website through an interactive visual timeline.
          </motion.p>
        </div>

        {/* Interactive URL Input Bar */}
        <motion.form
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto w-full"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-surface border border-border rounded-lg shadow-xl focus-within:border-border-focus transition-colors">
            <div className="relative flex-1 flex items-center">
              <Input
                type="text"
                placeholder="https://example.com"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (inputError) setInputError(false);
                }}
                error={inputError}
                mono
                size="md"
                prefixIcon={<Globe className="w-4 h-4 text-text-muted" />}
                className="border-none bg-transparent focus:ring-0 focus:border-none shadow-none text-xs sm:text-sm h-11"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="h-10 sm:h-11 px-6 font-mono text-xs uppercase tracking-wider shrink-0"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Run
            </Button>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs font-mono text-text-muted">
            <span className="text-[11px]">Quick runs:</span>
            {sampleTargets.map((target) => (
              <button
                key={target}
                type="button"
                onClick={() => {
                  setUrlInput(target);
                  navigate(`/analyze?url=${encodeURIComponent(target)}`);
                }}
                className="text-[11px] text-text-secondary hover:text-text-primary hover:underline bg-surface px-2 py-0.5 rounded border border-border/80 transition-colors"
              >
                {target.replace('https://', '')}
              </button>
            ))}
          </div>
        </motion.form>

        {/* Code-rendered Product Preview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="pt-6"
        >
          <ProductPreview />
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full border-t border-border/80 space-y-10">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase text-status-info tracking-wider">Features</span>
          <h2 className="text-xl sm:text-2xl font-semibold text-text-primary">
            Built for precision performance engineering
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary max-w-xl">
            Everything needed to identify, isolate, and eliminate network latency and main thread bottlenecks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, idx) => (
            <Card key={idx} className="bg-surface/80 border-border hover:border-border-focus/60 transition-all">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-md bg-surface-elevated border border-border">
                    {feature.icon}
                  </div>
                  <Badge variant="default" size="xs">
                    {feature.badge}
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {feature.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full border-t border-border/80 space-y-10">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase text-status-info tracking-wider">Technical Workflow</span>
          <h2 className="text-xl sm:text-2xl font-semibold text-text-primary">
            How RenderScope analyzes loading sequence
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="p-5 rounded-md border border-border bg-surface/60 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-status-info">
                  STEP {step.num}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-border" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">
                {step.title}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Minimal Developer-Tool Footer */}
      <footer className="mt-auto border-t border-border bg-surface/40 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-text-muted">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-status-success" />
            <span className="text-text-secondary">Probing Engine: v2.4.1</span>
            <span className="text-border">·</span>
            <span className="text-status-success font-medium">Operational</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>RenderScope</span>
            <Badge variant="outline" size="xs">v0.1.0-alpha</Badge>
            <span>Chromium headless 128.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
