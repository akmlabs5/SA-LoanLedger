import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

interface BankContactsSectionProps {
  bankId: string;
  bankName: string;
  isAuthenticated: boolean;
}

export default function BankContactsSection({ bankId, bankName, isAuthenticated }: BankContactsSectionProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Query for bank contacts - include user ID in key for cache isolation
  const { data: bankContacts, isLoading: contactsLoading } = useQuery({
    queryKey: [`/api/banks/${bankId}/contacts`, (user as any)?.id],
    enabled: isAuthenticated && !!bankId,
  });

  const contacts = (bankContacts as BankContact[]) || [];

  // Mutations
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      return apiRequest('DELETE', `/api/bank-contacts/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/banks/${bankId}/contacts`, (user as any)?.id] });
      toast({ title: "Contact deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete contact", 
        description: error.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const setPrimaryContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      return apiRequest('PUT', `/api/bank-contacts/${contactId}/set-primary`, { bankId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/banks/${bankId}/contacts`, (user as any)?.id] });
      toast({ title: "Primary contact updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update primary contact", 
        description: error.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const handleDeleteContact = (contactId: string) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      deleteContactMutation.mutate(contactId);
    }
  };

  const handleSetPrimary = (contactId: string) => {
    setPrimaryContactMutation.mutate(contactId);
  };

  const handleEditContact = (contact: BankContact) => {
    // TODO: Navigate to edit contact page when implemented
    toast({ title: "Edit functionality coming soon!" });
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
          <Button 
            size="default" 
            onClick={() => setLocation(`/banks/${bankId}/contacts/new`)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 lg:hover:from-blue-700 lg:hover:to-indigo-700 text-white shadow-lg min-h-[44px] min-w-[120px] touch-manipulation"
            data-testid="button-add-contact"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
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
                  {contact.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span 
                        className="text-sm text-gray-600 dark:text-gray-400"
                        data-testid={`text-contact-phone-${contact.id}`}
                      >
                        {contact.phone}
                      </span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span 
                        className="text-sm text-gray-600 dark:text-gray-400"
                        data-testid={`text-contact-email-${contact.id}`}
                      >
                        {contact.email}
                      </span>
                    </div>
                  )}
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