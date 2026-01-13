import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Code2,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Secure Sandbox',
    description: 'Run code safely in isolated Docker containers with resource limits',
  },
  {
    icon: Zap,
    title: 'Real-Time Feedback',
    description: 'Get instant results with WebSocket-powered live updates',
  },
  {
    icon: Globe,
    title: '4 Languages',
    description: 'Python, JavaScript, Java, and C++ support out of the box',
  },
  {
    icon: Code2,
    title: '20+ Problems',
    description: 'Practice with curated problems across all difficulty levels',
  },
];

const stats = [
  { value: '20+', label: 'Coding Problems' },
  { value: '4', label: 'Languages' },
  { value: '<3s', label: 'Execution Time' },
  { value: '99%', label: 'Uptime' },
];

const techStack = [
  'React', 'TypeScript', 'Node.js', 'Python', 'Docker',
  'Redis', 'PostgreSQL', 'Socket.io', 'TailwindCSS',
];

const HomePage = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Master Coding with{' '}
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  CodeArena
                </span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                A distributed code execution platform for practicing algorithms
                and data structures. Safe, fast, and real-time.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="gap-2">
                <Link to="/problems">
                  Browse Problems
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              Built for Developers
            </h2>
            <p className="mt-4 text-muted-foreground md:text-lg">
              Everything you need to practice coding problems effectively
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-none shadow-lg">
                <CardContent className="p-6">
                  <feature.icon className="h-12 w-12 mb-4 text-primary" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-4 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              How It Works
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Choose a Problem', desc: 'Browse our library of coding challenges' },
              { step: '2', title: 'Write Your Solution', desc: 'Code in your preferred language' },
              { step: '3', title: 'Get Instant Results', desc: 'See real-time test case results' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              Technology Stack
            </h2>
            <p className="mt-4 text-muted-foreground md:text-lg">
              Built with modern, production-grade technologies
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {techStack.map((tech) => (
              <div
                key={tech}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium">{tech}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl mb-4">
            Ready to Start Coding?
          </h2>
          <p className="mx-auto max-w-[600px] mb-8 opacity-90">
            Jump in and start solving problems. No sign-up required.
          </p>
          <Button asChild size="lg" variant="secondary" className="gap-2">
            <Link to="/problems">
              Start Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
