
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, 
  Users, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  Clock, 
  FileText, 
  Target,
  ArrowRight,
  Star
} from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: "Task Management",
      description: "Create, assign, and track tasks with deadlines. Never miss important deliverables."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Team Collaboration",
      description: "Real-time chat, file sharing, and seamless team coordination in one place."
    },
    {
      icon: <Calendar className="h-8 w-8 text-primary" />,
      title: "Project Planning",
      description: "Organize work into projects with visual timelines and milestone tracking."
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Time Tracking",
      description: "Monitor productivity and project hours with detailed analytics."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      title: "Reports & Analytics",
      description: "Track team performance and project progress with insightful reports."
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      title: "Team Chat",
      description: "Built-in messaging system to keep your team connected and informed."
    }
  ];

  const benefits = [
    "Increase team productivity by 40%",
    "Reduce project delays and missed deadlines",
    "Improve team communication and collaboration",
    "Get real-time insights into project progress",
    "Streamline workflow management",
    "Centralize all team activities in one platform"
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Project Manager",
      company: "TechCorp",
      content: "TeamTegrate transformed how our team collaborates. We've never been more organized and productive.",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Team Lead",
      company: "StartupXYZ",
      content: "The integrated chat and task management features are game-changers for remote teams.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Operations Director",
      company: "GrowthCo",
      content: "Finally, a tool that brings everything together. Our team efficiency has improved dramatically.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold text-primary">TeamTegrate</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/login?signup=true">
              <Button>Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Transform Your Team's
            <span className="text-primary block">Productivity</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline tasks, enhance collaboration, and track progress with the all-in-one team management platform that grows with your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login?signup=true">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Watch Demo
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • Free 14-day trial • Setup in minutes
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything Your Team Needs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to simplify team management and boost productivity
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Teams Choose TeamTegrate
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of teams already transforming their productivity
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Loved by Teams Worldwide
            </h2>
            <p className="text-lg text-muted-foreground">
              See what our customers have to say about TeamTegrate
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Team?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8">
            Join thousands of teams already using TeamTegrate to boost productivity and streamline collaboration.
          </p>
          <Link to="/login?signup=true">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Start Your Free Trial Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-primary-foreground/70 mt-4">
            14-day free trial • No setup fees • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-background border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-6 w-6 bg-primary rounded flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs">T</span>
                </div>
                <span className="font-bold text-primary">TeamTegrate</span>
              </div>
              <p className="text-muted-foreground text-sm">
                The all-in-one team management platform that transforms how teams collaborate and achieve their goals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/login" className="hover:text-foreground">Features</Link></li>
                <li><Link to="/login" className="hover:text-foreground">Pricing</Link></li>
                <li><Link to="/login" className="hover:text-foreground">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/login" className="hover:text-foreground">About</Link></li>
                <li><Link to="/login" className="hover:text-foreground">Contact</Link></li>
                <li><Link to="/login" className="hover:text-foreground">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/login" className="hover:text-foreground">Privacy</Link></li>
                <li><Link to="/login" className="hover:text-foreground">Terms</Link></li>
                <li><Link to="/login" className="hover:text-foreground">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 TeamTegrate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
