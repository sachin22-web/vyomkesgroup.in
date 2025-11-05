import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Img } from "@/components/Img";
import { Seo } from "@/components/Seo";
import { ShieldCheck, Lock, FileText, Headset, Users, TrendingUp } from "lucide-react";

export default function About() {
  return (
    <>
      <Seo
        title="About Us"
        description="Learn about Vyomkesh Industries' mission, values, and commitment to secure and transparent financial products."
        ogImage="/images/about_us_banner.jpg"
      />
      <section className="container py-12 md:py-20">
        {/* Hero Section for About Us */}
        <div className="relative rounded-xl overflow-hidden shadow-lg mb-12 md:mb-16">
          <Img
            src="/images/about_us_banner.jpg"
            alt="Vyomkesh Industries Team"
            className="w-full h-64 md:h-96 object-cover brightness-75"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/40">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 animate-fade-in-up">
              Innovating for Your Financial Future
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl animate-fade-in-up delay-200">
              At Vyomkesh Industries, we are dedicated to building secure, compliant, and transparent financial products that empower our investors.
            </p>
          </div>
        </div>

        {/* Our Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16 md:mb-24">
          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-black mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              To provide cutting-edge financial solutions that blend disciplined operations with advanced technology, ensuring predictable and rewarding investment experiences for all our clients. We strive to be a trusted partner in wealth creation.
            </p>
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-black mb-6">
              Our Vision
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              To be the leading innovator in the financial technology sector, recognized for our unwavering commitment to security, transparency, and client success. We envision a future where sophisticated investment is accessible to everyone.
            </p>
          </div>
        </div>

        {/* Core Values Section */}
        <div className="mb-16 md:mb-24">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-center text-black mb-12">
            Our Core Values
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
              <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-xl font-bold mb-2">Integrity</CardTitle>
              <CardContent className="text-muted-foreground text-sm">
                Upholding the highest ethical standards in all our operations and interactions.
              </CardContent>
            </Card>
            <Card className="text-center p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
              <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-xl font-bold mb-2">Security</CardTitle>
              <CardContent className="text-muted-foreground text-sm">
                Ensuring the utmost protection of client assets and personal data.
              </CardContent>
            </Card>
            <Card className="text-center p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
              <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-xl font-bold mb-2">Transparency</CardTitle>
              <CardContent className="text-muted-foreground text-sm">
                Providing clear and honest information about our products and processes.
              </CardContent>
            </Card>
            <Card className="text-center p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
              <Headset className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-xl font-bold mb-2">Client Focus</CardTitle>
              <CardContent className="text-muted-foreground text-sm">
                Prioritizing the needs and success of our investors above all else.
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Our Operations Section */}
        <div className="mb-16 md:mb-24">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-center text-black mb-12">
            How We Operate
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <Img
                src="/images/our_operations_1.jpg"
                alt="Operational Discipline"
                className="w-full h-64 object-cover rounded-xl shadow-md"
              />
              <h3 className="text-xl font-semibold text-black">Operational Discipline</h3>
              <p className="text-muted-foreground text-sm">
                Risk‑aware product design, maker‑checker approvals, and comprehensive audit trails ensure every operation adheres to the highest standards of discipline and compliance.
              </p>
            </div>
            <div className="space-y-4">
              <Img
                src="/images/our_operations_2.jpg"
                alt="Advanced Technology"
                className="w-full h-64 object-cover rounded-xl shadow-md"
              />
              <h3 className="text-xl font-semibold text-black">Advanced Technology</h3>
              <p className="text-muted-foreground text-sm">
                Leveraging cutting-edge technology for encrypted PII, device binding, IP throttling, and quarterly access reviews to keep your data safe and secure.
              </p>
            </div>
            <div className="space-y-4">
              <Img
                src="/images/our_operations_3.jpg"
                alt="Transparent Reporting"
                className="w-full h-64 object-cover rounded-xl shadow-md"
              />
              <h3 className="text-xl font-semibold text-black">Transparent Reporting</h3>
              <p className="text-muted-foreground text-sm">
                Our double‑entry ledger system provides transparent, verifiable records, with downloadable statements and CSV exports for complete financial clarity.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center py-16 bg-primary/5 rounded-xl shadow-inner">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-black mb-6">
            Ready to Grow Your Wealth?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of satisfied investors who trust Vyomkesh Industries for their financial growth.
          </p>
          <Button asChild size="lg" className="py-3 px-8 text-lg">
            <Link to="/signup">Get Started Today</Link>
          </Button>
        </div>
      </section>
    </>
  );
}