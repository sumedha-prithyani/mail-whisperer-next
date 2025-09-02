import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Plus, X, Send, Paperclip, Trash2 } from "lucide-react";
import { RecipientsManager } from "./RecipientsManager";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export const ContactForm = () => {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const handleAddRecipient = (email: string) => {
    if (email && !recipients.includes(email)) {
      setRecipients([...recipients, email]);
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  const handleClearAll = () => {
    setRecipients([]);
  };

  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB per file
    const maxFiles = 5;

    if (attachedFiles.length + files.length > maxFiles) {
      toast({
        title: "Too Many Files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      });
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    setAttachedFiles(prev => [...prev, ...validFiles]);
    event.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ContactFormData) => {
    if (recipients.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please add at least one recipient email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate email sending (this is where Supabase integration would be used)
    try {
      console.log("Email data:", {
        ...data,
        recipients,
        attachments: attachedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
        timestamp: new Date().toISOString(),
      });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Email Prepared",
        description: `Ready to send to ${recipients.length} recipient(s) with ${attachedFiles.length} attachment(s). Connect Supabase to enable actual email sending.`,
      });
      
      // Reset form
      form.reset();
      setRecipients([]);
      setAttachedFiles([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to prepare email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Contact Form */}
      <Card className="bg-card shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            Compose Message
          </CardTitle>
          <CardDescription>
            Fill in the details for your email message
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Doe" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="john@example.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter email subject" 
                        {...field} 
                      />
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
                        placeholder="Enter your message here..." 
                        {...field} 
                        rows={6}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Attachments */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Attachments</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-input')?.click()}
                    className="h-8"
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attach Files
                  </Button>
                </div>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileAttach}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                />
                
                {attachedFiles.length > 0 && (
                  <div className="space-y-2">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-md border">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      {attachedFiles.length}/5 files • Max 10MB per file
                    </p>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || recipients.length === 0}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Preparing Email...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Send to {recipients.length} Recipient{recipients.length !== 1 ? 's' : ''}
                  </div>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Recipients Manager */}
      <div className="space-y-6">
        <RecipientsManager
          recipients={recipients}
          onAddRecipient={handleAddRecipient}
          onRemoveRecipient={handleRemoveRecipient}
          onClearAll={handleClearAll}
        />
        
        {/* Email Preview */}
        <Card className="bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Email Preview</CardTitle>
            <CardDescription>Preview of your email configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">From:</span>
                <p className="font-medium">{form.watch("name") || "Your Name"} ({form.watch("email") || "your@email.com"})</p>
              </div>
              <div>
                <span className="text-muted-foreground">Recipients:</span>
                <p className="font-medium">{recipients.length} recipient{recipients.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Subject:</span>
              <p className="font-medium">{form.watch("subject") || "Email subject will appear here"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Message Preview:</span>
              <div className="bg-muted/50 rounded-md p-3 text-sm max-h-32 overflow-y-auto">
                {form.watch("message") || "Your message content will appear here..."}
              </div>
            </div>
            {attachedFiles.length > 0 && (
              <div>
                <span className="text-muted-foreground">Attachments ({attachedFiles.length}):</span>
                <div className="space-y-2 mt-2">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm bg-muted/30 rounded px-2 py-1">
                      <Paperclip className="w-3 h-3 text-muted-foreground" />
                      <span className="font-medium truncate">{file.name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({(file.size / 1024 / 1024).toFixed(1)}MB)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};