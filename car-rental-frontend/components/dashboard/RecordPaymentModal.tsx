// src/components/dashboard/RecordPaymentModal.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import toast from "react-hot-toast"
import { paymentService } from "@/lib/payment.service"

interface Contract {
  id: string;
  contract_number: string;
  customer: {
    full_name: string;
  };
  total_amount: number;
  outstanding_amount?: number;
}

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preSelectedContract?: Contract;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  preSelectedContract,
}: RecordPaymentModalProps) {
  const [formData, setFormData] = useState({
    contract_id: "",
    amount: "",
    payment_method: "bank_transfer",
    payment_date: new Date().toISOString().split("T")[0],
    reference_number: "",
    notes: "",
    status: "completed",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [availableContracts, setAvailableContracts] = useState<Contract[]>([])
  const [loadingContracts, setLoadingContracts] = useState(true)

  // Fetch all outstanding contracts when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchOutstandingContracts()
    }
  }, [isOpen])

  // Set pre-selected contract when available
  useEffect(() => {
    if (preSelectedContract) {
      setFormData(prev => ({
        ...prev,
        contract_id: preSelectedContract.id,
        amount: preSelectedContract.outstanding_amount?.toString() || "",
      }))
      setSelectedContract(preSelectedContract)
    }
  }, [preSelectedContract])

  const fetchOutstandingContracts = async () => {
    setLoadingContracts(true)
    try {
      const response = await paymentService.getOutstandingPayments({
        limit: 1000, // Get all outstanding contracts
      })
      
      const contracts = response.data.outstanding_contracts.map((item: any) => ({
        id: item.contract_id,
        contract_number: item.contract_number,
        customer: item.customer,
        total_amount: item.total_amount,
        outstanding_amount: item.outstanding_amount,
      }))
      
      setAvailableContracts(contracts)
      
      // If pre-selected contract exists and is not in the list, add it
      if (preSelectedContract && !contracts.find((c: Contract) => c.id === preSelectedContract.id)) {
        setAvailableContracts([preSelectedContract, ...contracts])
      }
    } catch (error: any) {
      console.error("Failed to fetch contracts:", error)
      toast.error("Failed to load contracts")
      
      // If we have a pre-selected contract, use it anyway
      if (preSelectedContract) {
        setAvailableContracts([preSelectedContract])
      }
    } finally {
      setLoadingContracts(false)
    }
  }

  const handleContractChange = (contractId: string) => {
    const contract = availableContracts.find(c => c.id === contractId)
    setSelectedContract(contract || null)
    setFormData(prev => ({
      ...prev,
      contract_id: contractId,
      amount: contract?.outstanding_amount?.toString() || "",
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.contract_id) {
      toast.error("Please select a contract")
      return
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    
    // Check if amount exceeds outstanding
    if (selectedContract?.outstanding_amount && 
        parseFloat(formData.amount) > selectedContract.outstanding_amount) {
      toast.error(`Amount cannot exceed outstanding balance: ${formatCurrency(selectedContract.outstanding_amount)}`)
      return
    }
    
    setIsSubmitting(true)

    try {
      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
      }

      await paymentService.createPayment(paymentData)
      
      toast.success("Payment recorded successfully")
      onSuccess()
      handleClose()
    } catch (error: any) {
      toast.error(error.message || "Failed to record payment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    // Reset form
    setFormData({
      contract_id: "",
      amount: "",
      payment_method: "bank_transfer",
      payment_date: new Date().toISOString().split("T")[0],
      reference_number: "",
      notes: "",
      status: "completed",
    })
    setSelectedContract(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Record Payment</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Contract Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Contract *</label>
            {loadingContracts ? (
              <div className="w-full px-3 py-2 border border-border rounded-md bg-muted text-sm text-muted-foreground">
                Loading contracts...
              </div>
            ) : (
              <select
                value={formData.contract_id}
                onChange={(e) => handleContractChange(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                required
              >
                <option value="">Select a contract</option>
                {availableContracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.contract_number} - {contract.customer.full_name} 
                    {contract.outstanding_amount && 
                      ` (Outstanding: ${formatCurrency(contract.outstanding_amount)})`
                    }
                  </option>
                ))}
              </select>
            )}
            {selectedContract && (
              <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                <p className="font-medium">{selectedContract.contract_number}</p>
                <p className="text-muted-foreground">Customer: {selectedContract.customer.full_name}</p>
                <p className="text-muted-foreground">
                  Total: {formatCurrency(selectedContract.total_amount)}
                </p>
                {selectedContract.outstanding_amount && (
                  <p className="text-destructive font-medium">
                    Outstanding: {formatCurrency(selectedContract.outstanding_amount)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">Amount (DZD) *</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={selectedContract?.outstanding_amount || undefined}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Enter payment amount"
              required
            />
            {selectedContract?.outstanding_amount && formData.amount && 
             parseFloat(formData.amount) > selectedContract.outstanding_amount && (
              <p className="text-xs text-destructive mt-1">
                Amount exceeds outstanding balance
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium mb-2">Payment Method *</label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              required
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="check">Check</option>
              <option value="mobile_payment">Mobile Payment</option>
            </select>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium mb-2">Payment Date *</label>
            <Input
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium mb-2">Reference Number</label>
            <Input
              type="text"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              placeholder="e.g., TXN-20250104-001"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2">Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              required
            >
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-[100px]"
              placeholder="Add any additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || loadingContracts}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}