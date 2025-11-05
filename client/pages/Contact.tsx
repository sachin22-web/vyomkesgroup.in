import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Img } from "@/components/Img";
import { Seo } from "@/components/Seo";
import { api } from "@/lib/api"; // Import the api utility
import { Mail, Phone, MapPin, MessageSquareText } from "lucide-react"; // Import Lucide icons

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await api("/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined, // Send undefined if empty
          subject,
          message,
        }),
      });
      
      toast.success("Your enquiry has been submitted successfully! We'll get back to you soon.");
      
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (error: any) {
      console.error("Contact form submission error:", error);
      toast.error(error.message || "Failed to submit your enquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Seo 
        title="Contact Us" 
        description="Get in touch with Vyomkesh Industries for investment inquiries, support, or general questions." 
      />
      <section className="container py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Contact Us</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Have questions or need assistance? Reach out to our team and we'll get back to you as soon as possible.
          </p>
        </div>

        <Img
          src="/images/contact_banner.jpg"
          alt="Contact us"
          className="w-full h-48 md:h-64 object-cover rounded-xl border mb-12"
        />

        <div className="grid md:grid-cols-2 gap-12">
          <Card>
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your.email@example.com"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91-XXXXXXXXXX"
                      autoComplete="tel"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    placeholder="How can we help you?"
                    autoComplete="off"
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder="Please provide details about your inquiry..."
                    className="min-h-[140px]"
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Get in Touch</h3>
                  <p className="text-muted-foreground">
                    We're here to help with any questions about our investment opportunities, 
                    account management, or general inquiries.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium mb-1">Email</h4>
                      <a 
                        href="mailto:support@vyomkeshindustries.com" 
                        className="text-primary hover:underline"
                      >
                        support@vyomkeshindustries.com
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium mb-1">Phone & WhatsApp</h4>
                      <a 
                        href="tel:+91XXXXXXXXXX" 
                        className="text-primary hover:underline block"
                      >
                        +91-XXXXXXXXXX
                      </a>
                      <a 
                        href="https://wa.me/91XXXXXXXXXX" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline block"
                      >
                        (WhatsApp) +91-XXXXXXXXXX
                      </a>
                      <p className="text-sm text-muted-foreground mt-1">
                        Mon-Fri, 10:00 AM - 6:00 PM IST
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium mb-1">Office Address</h4>
                      <p className="text-muted-foreground">
                        Vyomkesh Industries<br />
                        123 Business District<br />
                        Mumbai, Maharashtra 400001<br />
                        India
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Response Time</h4>
                  <p className="text-sm text-muted-foreground">
                    We typically respond to all inquiries within 24 hours during business days. 
                    For urgent matters, please use our WhatsApp contact for immediate assistance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}