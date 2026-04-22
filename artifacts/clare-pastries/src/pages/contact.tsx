import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MessageCircle, MapPin, Send, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useSubmitContact } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  phone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contact() {
  const submitContact = useSubmitContact();
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    }
  });

  const onSubmit = (data: ContactFormValues) => {
    submitContact.mutate({ data }, {
      onSuccess: () => {
        toast({
          title: "Message Sent",
          description: "Thank you! We'll get back to you shortly.",
        });
        form.reset();
      },
      onError: () => {
        toast({
          title: "Failed to send message",
          description: "Please try calling us directly.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Layout>
      <div className="pt-20 pb-32 bg-muted/20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground mb-4">Let's Talk Pastries.</h1>
            <p className="text-lg text-muted-foreground font-light">Have a question, feedback, or just want to say hi? We're all ears.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <Card className="bg-card border-none shadow-sm h-full">
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                    <Phone className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold mb-2">Call or WhatsApp</h3>
                  <p className="text-muted-foreground mb-8">The fastest way to reach us for immediate orders or questions.</p>
                  
                  <div className="mt-auto space-y-4">
                    <a href="tel:+254724848228" className="flex items-center gap-3 text-foreground hover:text-primary transition-colors font-medium text-lg">
                      <Phone className="h-5 w-5 text-primary" /> +254 724 848228
                    </a>
                    <a href="https://wa.me/254724848228" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-foreground hover:text-primary transition-colors font-medium text-lg">
                      <MessageCircle className="h-5 w-5 text-primary" /> Chat on WhatsApp
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary text-primary-foreground border-none shadow-sm">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground mb-6">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold mb-2">Busia Town</h3>
                  <p className="text-primary-foreground/80 mb-8">We deliver fresh across Busia Town. Pickup available upon request.</p>
                  <Link href="/menu">
                    <Button variant="secondary" className="w-full rounded-full">Browse Menu</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="bg-background border border-border shadow-sm h-full">
                <CardContent className="p-8 md:p-10">
                  <h3 className="text-2xl font-serif font-bold mb-6">Send a Message</h3>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
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
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="Your phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="your@email.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="How can we help you?" 
                                className="min-h-[150px] resize-y"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" size="lg" className="w-full sm:w-auto px-8 rounded-full" disabled={submitContact.isPending}>
                        {submitContact.isPending ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                        ) : (
                          <><Send className="mr-2 h-4 w-4" /> Send Message</>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
