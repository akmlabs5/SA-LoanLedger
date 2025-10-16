import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModernDatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DollarSign } from "lucide-react";

interface PaymentRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string;
  loanAmount?: number;
}

export function PaymentRecordingModal({ isOpen, onClose, loanId, loanAmount = 0 }: PaymentRecordingModalProps) {
  const { toast } = useToast();
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [interestAmount, setInterestAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Auto-calculate interest when total amount and principal are set
  useEffect(() => {
    const total = parseFloat(amount) || 0;
    const principal = parseFloat(principalAmount) || 0;
    if (total > 0 && principal > 0 && total >= principal) {
      const interest = total - principal;
      setInterestAmount(interest.toFixed(2));
    }
  }, [amount, principalAmount]);

  const recordPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      await apiRequest("POST", "/api/payments", paymentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments", "loan", loanId] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans", loanId] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans", loanId, "balance"] });
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!amount || !principalAmount || !interestAmount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    recordPaymentMutation.mutate({
      loanId,
      paymentDate,
      amount: amount,
      principalAmount: principalAmount,
      interestAmount: interestAmount,
      paymentMethod,
      referenceNumber: referenceNumber || undefined,
      notes: notes || undefined,
    });
  };

  const handleClose = () => {
    // Reset form
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setAmount("");
    setPrincipalAmount("");
    setInterestAmount("");
    setPaymentMethod("bank_transfer");
    setReferenceNumber("");
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Record a payment made against this loan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="payment-date">Payment Date *</Label>
            <ModernDatePicker
              value={paymentDate}
              onChange={setPaymentDate}
              placeholder="Select payment date"
              dataTestId="input-payment-date"
            />
          </div>

          {/* Total Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Total Payment Amount (SAR) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter total payment amount"
              data-testid="input-payment-amount"
            />
          </div>

          {/* Principal Amount */}
          <div className="space-y-2">
            <Label htmlFor="principal-amount">Principal Amount (SAR) *</Label>
            <Input
              id="principal-amount"
              type="number"
              step="0.01"
              value={principalAmount}
              onChange={(e) => setPrincipalAmount(e.target.value)}
              placeholder="Amount applied to principal"
              data-testid="input-principal-amount"
            />
          </div>

          {/* Interest Amount */}
          <div className="space-y-2">
            <Label htmlFor="interest-amount">Interest Amount (SAR) *</Label>
            <Input
              id="interest-amount"
              type="number"
              step="0.01"
              value={interestAmount}
              onChange={(e) => setInterestAmount(e.target.value)}
              placeholder="Amount applied to interest"
              data-testid="input-interest-amount"
            />
            <p className="text-xs text-muted-foreground">
              Auto-calculated as: Total - Principal
            </p>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger data-testid="select-payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="wire">Wire Transfer</SelectItem>
                <SelectItem value="ach">ACH</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <Label htmlFor="reference-number">Reference Number</Label>
            <Input
              id="reference-number"
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Transaction reference number"
              data-testid="input-reference-number"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or comments"
              rows={3}
              data-testid="textarea-payment-notes"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={recordPaymentMutation.isPending}
            data-testid="button-cancel-payment"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={recordPaymentMutation.isPending}
            data-testid="button-record-payment"
          >
            {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
