import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Users, Mail, Upload } from "lucide-react";
import * as XLSX from 'xlsx';

interface RecipientsManagerProps {
  recipients: string[];
  onAddRecipient: (email: string) => void;
  onRemoveRecipient: (email: string) => void;
}

export const RecipientsManager = ({ recipients, onAddRecipient, onRemoveRecipient }: RecipientsManagerProps) => {
  const [newRecipient, setNewRecipient] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddRecipient = () => {
    if (!newRecipient.trim()) {
      toast({
        title: "Invalid Email",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(newRecipient)) {
      toast({
        title: "Invalid Email Format",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (recipients.includes(newRecipient)) {
      toast({
        title: "Duplicate Email",
        description: "This email is already in the recipients list.",
        variant: "destructive",
      });
      return;
    }

    onAddRecipient(newRecipient);
    setNewRecipient("");
    toast({
      title: "Recipient Added",
      description: `${newRecipient} has been added to the recipients list.`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddRecipient();
    }
  };

  const handleRemoveRecipient = (email: string) => {
    onRemoveRecipient(email);
    toast({
      title: "Recipient Removed",
      description: `${email} has been removed from the recipients list.`,
    });
  };

  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const emails: string[] = [];
        const duplicates: string[] = [];
        const invalid: string[] = [];

        // Process all sheets in the workbook
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          
          // Try different parsing methods
          // Method 1: Parse as JSON with headers
          try {
            const jsonDataWithHeaders = XLSX.utils.sheet_to_json(worksheet);
            jsonDataWithHeaders.forEach((row: any) => {
              Object.values(row).forEach((cell: any) => {
                if (cell && typeof cell === 'string') {
                  const potentialEmails = cell.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
                  if (potentialEmails) {
                    potentialEmails.forEach(emailMatch => {
                      const email = emailMatch.trim().toLowerCase();
                      if (validateEmail(email)) {
                        if (recipients.includes(email)) {
                          if (!duplicates.includes(email)) duplicates.push(email);
                        } else if (!emails.includes(email)) {
                          emails.push(email);
                        }
                      } else {
                        if (!invalid.includes(emailMatch)) invalid.push(emailMatch);
                      }
                    });
                  }
                }
              });
            });
          } catch (headerError) {
            console.warn('Failed to parse with headers, trying raw data');
          }

          // Method 2: Parse as raw array data
          try {
            const jsonDataRaw = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            jsonDataRaw.forEach((row: any) => {
              if (Array.isArray(row)) {
                row.forEach((cell: any) => {
                  if (cell && typeof cell === 'string') {
                    const potentialEmails = cell.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
                    if (potentialEmails) {
                      potentialEmails.forEach(emailMatch => {
                        const email = emailMatch.trim().toLowerCase();
                        if (validateEmail(email)) {
                          if (recipients.includes(email)) {
                            if (!duplicates.includes(email)) duplicates.push(email);
                          } else if (!emails.includes(email)) {
                            emails.push(email);
                          }
                        } else {
                          if (!invalid.includes(emailMatch)) invalid.push(emailMatch);
                        }
                      });
                    }
                  }
                });
              }
            });
          } catch (rawError) {
            console.warn('Failed to parse raw data');
          }
        });

        // Add valid emails
        emails.forEach(email => onAddRecipient(email));

        // Show results
        const messages = [];
        if (emails.length > 0) {
          messages.push(`${emails.length} email${emails.length !== 1 ? 's' : ''} imported successfully`);
        }
        if (duplicates.length > 0) {
          messages.push(`${duplicates.length} duplicate${duplicates.length !== 1 ? 's' : ''} skipped`);
        }
        if (invalid.length > 0) {
          messages.push(`${invalid.length} invalid email${invalid.length !== 1 ? 's' : ''} skipped`);
        }

        if (emails.length === 0 && duplicates.length === 0) {
          toast({
            title: "No Emails Found",
            description: "No valid email addresses were found in the file. Please check the file format and content.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Excel Import Complete",
            description: messages.join(', '),
          });
        }

      } catch (error) {
        console.error('Excel import error:', error);
        toast({
          title: "Import Failed",
          description: "Unable to read the Excel file. Please check the file format.",
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="bg-card shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Recipients ({recipients.length})
        </CardTitle>
        <CardDescription>
          Add email addresses to send your message to multiple recipients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Recipient Input */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter recipient email address"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-background/50 border-border/50 flex-1"
            />
            <Button
              onClick={handleAddRecipient}
              size="icon"
              className="bg-primary hover:bg-primary/90 shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Excel Import */}
          <div className="flex items-center gap-2">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-xs text-muted-foreground px-2">OR</span>
            <div className="h-px bg-border flex-1"></div>
          </div>
          
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelImport}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex-1 bg-background/50 border-border/50 hover:bg-background/80"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import from Excel
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Upload an Excel file (.xlsx, .xls) or CSV with email addresses
          </p>
        </div>

        {/* Recipients List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Email Recipients
            </h3>
            {recipients.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {recipients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No recipients added yet</p>
              <p className="text-xs mt-1">Add email addresses above to get started</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recipients.map((email, index) => (
                <div
                  key={email}
                  className="flex items-center justify-between bg-background/30 rounded-lg p-3 group hover:bg-background/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium">{email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveRecipient(email)}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {recipients.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Quick Actions:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  recipients.forEach(email => onRemoveRecipient(email));
                  toast({
                    title: "All Recipients Cleared",
                    description: "All recipients have been removed from the list.",
                  });
                }}
                className="text-xs hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
              >
                Clear All
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};