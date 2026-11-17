import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Clock,
  GitCompare,
  Globe,
  Layers,
  PlayCircle,
  SearchCode,
  Sparkles,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import ProductPreview from './components/ProductPreview';

const SAMPLE_TARGETS = [
  'https://linear.app',
  'https://github.com',
  'https://stripe.com',
  'https://vercel.com',
];

const FEATURES = [
  {
    title: 'Interactive Waterfall',
    description:
      'Zoom, scroll, filter, and search every network request with TTFB/download bars, milestone markers, and an inline resource inspector.',
    icon: Layers,
    iconColor: 'text-resource-js',
    badge: 'Timeline',
  },
  {
    title: 'Loading Replay',
    description:
      'Watch measured resources load in real relative time with play, pause, restart, 0.5x–5x speed controls, and milestone scrubbing.',
    icon: PlayCircle,
    iconColor: 'text-status-success',
    badge: 'Replay',
  },
  {
    title: 'Performance Detective',
    description:
      'Automatically flags large JS bundles, heavy images, slow requests, and high request counts using tunable heuristic thresholds.',
    icon: SearchCode,
    iconColor: 'text-status-warning',
    badge: 'Heuristics',
  },
  {
    title: 'AI Insights',
    description:
      'Turns real metrics, waterfalls, and findings into prioritized action plans, plus on-demand explanations for any finding or resource.',
    icon: Sparkles,
    iconColor: 'text-status-info',
    badge: 'Gemini AI',
  },
  {
    title: 'Local History',
    description:
      'Saves every completed analysis locally in IndexedDB with its full waterfall so you can reopen snapshots instantly without re-fetching.',
    icon: Clock,
    iconColor: 'text-resource-font',
    badge: 'Snapshots',
  },
  {
    title: 'Before vs After Compare',
    description:
      'Compare any two saved runs across TTFB, FCP, LCP, JS weight, requests, and synchronized side-by-side waterfalls.',
    icon: GitCompare,
    iconColor: 'text-resource-image',
    badge: 'Diff',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Enter any URL',
    description:
      'Paste a public URL and pick Desktop or Mobile. RenderScope fetches live performance data via PageSpeed Insights.',
  },
  {
    num: '02',
    title: 'Inspect & Replay',
    description:
      'Review Core Web Vitals, zoom through the interactive waterfall, replay the load sequence, and spot heuristic bottlenecks.',
  },
  {
    num: '03',
    title: 'Explain & Compare',
    description:
      'Use AI to explain bottlenecks or individual assets, then compare locally saved runs to verify Before vs After gains.',
  },
];

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

    const formattedUrl =
      cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')
        ? cleanUrl
        : `https://${cleanUrl}`;

    navigate(`/analyze?url=${encodeURIComponent(formattedUrl)}`);
  };

  return (
    <div className="flex-1 flex flex-col w-full bg-tech-grid">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-18 pb-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-center space-y-7">
        {/* Concise Product Tag */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-[11px] font-mono text-text-secondary select-none"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
          <span>Web Performance Inspector</span>
          <span className="text-border">·</span>
          <span className="text-status-info">Waterfall · Replay · AI</span>
        </motion.div>

        {/* Headline & Subhead */}
        <div className="space-y-3 max-w-2xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="text-3xl sm:text-5xl font-semibold tracking-tight text-text-primary font-sans leading-tight"
          >
            See exactly how any website loads.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.05 }}
            className="text-sm sm:text-base text-text-secondary leading-relaxed"
          >
            Analyze real page metrics, replay the network waterfall, catch bottlenecks, and compare runs side by side.
          </motion.p>
        </div>

        {/* Interactive URL Input Bar */}
        <motion.form
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.08 }}
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
              Analyze
            </Button>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs font-mono text-text-muted">
            <span className="text-[11px]">Try:</span>
            {SAMPLE_TARGETS.map((target) => (
              <button
                key={target}
                type="button"
                onClick={() => {
                  setUrlInput(target);
                  navigate(`/analyze?url=${encodeURIComponent(target)}`);
                }}
                className="text-[11px] text-text-secondary hover:text-text-primary bg-surface px-2 py-0.5 rounded border border-border hover:border-border-focus transition-colors"
              >
                {target.replace('https://', '')}
              </button>
            ))}
          </div>
        </motion.form>

        {/* Interactive Waterfall Preview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12 }}
          className="pt-4"
        >
          <ProductPreview />
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full border-t border-border space-y-8">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase text-status-info tracking-wider">
            Capabilities
          </span>
          <h2 className="text-xl sm:text-2xl font-semibold text-text-primary">
            Everything in one workflow
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary max-w-xl">
            From raw network timings to automated bottleneck detection, AI explanations, and local Before vs After diffs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="bg-surface border-border hover:border-border-focus transition-colors"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-md bg-surface-elevated border border-border">
                      <Icon className={`w-4 h-4 ${feature.iconColor}`} />
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
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full border-t border-border space-y-8">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase text-status-info tracking-wider">
            How It Works
          </span>
          <h2 className="text-xl sm:text-2xl font-semibold text-text-primary">
            Three steps from URL to actionable fixes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="p-5 rounded-lg border border-border bg-surface space-y-2.5"
            >
              <span className="text-xs font-mono font-bold text-status-info">
                STEP {step.num}
              </span>
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

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-border bg-surface py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary">RenderScope</span>
            <span className="text-border">·</span>
            <span>Powered by PageSpeed Insights & Gemini AI</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/analyze" className="hover:text-text-primary transition-colors">
              Analyze
            </Link>
            <Link to="/history" className="hover:text-text-primary transition-colors">
              History
            </Link>
            <Link to="/compare" className="hover:text-text-primary transition-colors">
              Compare
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
