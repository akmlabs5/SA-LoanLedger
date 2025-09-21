import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertBankContactSchema } from "@shared/schema";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import { 
  User, 
  Phone, 
  Mail, 
  Plus,
  Edit,
  Trash2,
  Star,
  MapPin
} from "lucide-react";

type BankContact = {
  id: string;
  bankId: string;
  userId: string;
  name: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  extension?: string;
  isPrimary: boolean;
  notes?: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

const bankContactFormSchema = insertBankContactSchema.omit({ userId: true, bankId: true });

interface BankContactsSectionProps {
  bankId: string;
  bankName: string;
  isAuthenticated: boolean;
}

export default function BankContactsSection({ bankId, bankName, isAuthenticated }: BankContactsSectionProps) {
  const { toast } = useToast();
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<BankContact | null>(null);

  const contactForm = useForm<z.infer<typeof bankContactFormSchema>>({
    resolver: zodResolver(bankContactFormSchema),
    defaultValues: {
      name: "",
      title: "",
      department: "",
      email: "",
      phone: "",
      mobile: "",
      extension: "",
      isPrimary: false,
      notes: "",
    },
  });

  // Query for bank contacts
  const { data: bankContacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["/api/banks", bankId, "contacts"],
    enabled: isAuthenticated && !!bankId,
  });

  const contacts = (bankContacts as BankContact[]) || [];

  // Mutations
  const createContactMutation = useMutation({
    mutationFn: async (data: z.infer<typeof bankContactFormSchema>) => {
      return apiRequest('POST', `/api/banks/${bankId}/contacts`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banks", bankId, "contacts"] });
      setIsContactDialogOpen(false);
      contactForm.reset();
      toast({ title: "Contact added successfully" });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BankContact> }) => {
      return apiRequest('PUT', `/api/bank-contacts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banks", bankId, "contacts"] });
      setEditingContact(null);
      setIsContactDialogOpen(false);
      contactForm.reset();
      toast({ title: "Contact updated successfully" });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      return apiRequest('DELETE', `/api/bank-contacts/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banks", bankId, "contacts"] });
      toast({ title: "Contact deleted successfully" });
    },
  });

  const setPrimaryContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      return apiRequest('PUT', `/api/bank-contacts/${contactId}/set-primary`, { bankId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banks", bankId, "contacts"] });
      toast({ title: "Primary contact updated successfully" });
    },
  });

  const handleEditContact = (contact: BankContact) => {
    setEditingContact(contact);
    contactForm.reset({
      name: contact.name,
      title: contact.title || "",
      department: contact.department || "",
      email: contact.email || "",
      phone: contact.phone || "",
      mobile: contact.mobile || "",
      extension: contact.extension || "",
      isPrimary: contact.isPrimary,
      notes: contact.notes || "",
    });
    setIsContactDialogOpen(true);
  };

  const handleSubmitContact = (data: z.infer<typeof bankContactFormSchema>) => {
    if (editingContact) {
      updateContactMutation.mutate({ id: editingContact.id, data });
    } else {
      createContactMutation.mutate(data);
    }
  };

  const handleDeleteContact = (contactId: string) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      deleteContactMutation.mutate(contactId);
    }
  };

  const handleSetPrimary = (contactId: string) => {
    setPrimaryContactMutation.mutate(contactId);
  };

  const handleCloseDialog = () => {
    setIsContactDialogOpen(false);
    setEditingContact(null);
    contactForm.reset({
      name: "",
      title: "",
      department: "",
      email: "",
      phone: "",
      mobile: "",
      extension: "",
      isPrimary: false,
      notes: "",
    });
  };

  if (contactsLoading) {
    return (
      <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span>Bank Contacts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span>Bank Contacts</span>
          </div>
          <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-contact">
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingContact ? "Edit Contact" : "Add New Contact"}
                </DialogTitle>
                <DialogDescription>
                  {editingContact 
                    ? "Update the contact information below."
                    : `Add a new contact for ${bankName}.`
                  }
                </DialogDescription>
              </DialogHeader>
              <Form {...contactForm}>
                <form onSubmit={contactForm.handleSubmit(handleSubmitContact)} className="space-y-4">
                  <FormField
                    control={contactForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input data-testid="input-contact-name" placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={contactForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input data-testid="input-contact-title" placeholder="e.g., Account Manager" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={contactForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input data-testid="input-contact-email" type="email" placeholder="name@bank.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={contactForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input data-testid="input-contact-phone" placeholder="+966 11 123 4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={contactForm.control}
                    name="isPrimary"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Primary Contact</FormLabel>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Set as the main contact for this bank
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            data-testid="switch-primary-contact"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={contactForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            data-testid="textarea-contact-notes"
                            placeholder="Any additional notes about this contact..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCloseDialog}
                      data-testid="button-cancel-contact"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createContactMutation.isPending || updateContactMutation.isPending}
                      data-testid="button-save-contact"
                    >
                      {createContactMutation.isPending || updateContactMutation.isPending
                        ? "Saving..." 
                        : editingContact ? "Update Contact" : "Add Contact"
                      }
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {contacts.length === 0 ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">No contacts found for this bank</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Add contacts to manage your relationship with {bankName}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact: BankContact) => (
              <div 
                key={contact.id} 
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl"
                data-testid={`contact-card-${contact.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 
                        className="font-semibold text-gray-900 dark:text-gray-100"
                        data-testid={`text-contact-name-${contact.id}`}
                      >
                        {contact.name}
                      </h4>
                      {contact.isPrimary && (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          <Star className="mr-1 h-3 w-3" />
                          Primary
                        </Badge>
                      )}
                    </div>
                    <p 
                      className="text-sm text-gray-600 dark:text-gray-400 mb-2"
                      data-testid={`text-contact-title-${contact.id}`}
                    >
                      {contact.title}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!contact.isPrimary && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSetPrimary(contact.id)}
                        disabled={setPrimaryContactMutation.isPending}
                        data-testid={`button-set-primary-${contact.id}`}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditContact(contact)}
                      data-testid={`button-edit-contact-${contact.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteContact(contact.id)}
                      disabled={deleteContactMutation.isPending}
                      data-testid={`button-delete-contact-${contact.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span 
                      className="text-sm text-gray-600 dark:text-gray-400"
                      data-testid={`text-contact-phone-${contact.id}`}
                    >
                      {contact.phone}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span 
                      className="text-sm text-gray-600 dark:text-gray-400"
                      data-testid={`text-contact-email-${contact.id}`}
                    >
                      {contact.email}
                    </span>
                  </div>
                  {contact.notes && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                      <p 
                        className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg"
                        data-testid={`text-contact-notes-${contact.id}`}
                      >
                        {contact.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}