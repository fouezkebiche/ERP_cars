// src/components/dashboard/RecordPaymentModal.tsx
"use client"

import { useState, useEffect } from "react"
import { X, CreditCard, AlertCircle, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { paymentService } from "@/lib/payment.service"

/* ─── tokens ─────────────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const G_DIM   = "rgba(34,197,94,0.10)"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"

interface Contract {
  id: string
  contract_number: string
  customer: { full_name: string }
  total_amount: number
  outstanding_amount?: number
}

interface RecordPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  preSelectedContract?: Contract
}

/* ─── field wrapper ──────────────────────────────────────────── */
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.03em", textTransform: "uppercase" }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11 }}>{hint}</div>}
    </div>
  )
}

/* ─── dark input ─────────────────────────────────────────────── */
function DarkInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focus, setFocus] = useState(false)
  return (
    <input
      {...props}
      onFocus={e => { setFocus(true); props.onFocus?.(e) }}
      onBlur={e => { setFocus(false); props.onBlur?.(e) }}
      style={{
        width: "100%", padding: "11px 14px",
        background: focus ? "rgba(255,255,255,0.07)" : SURFACE,
        border: `1px solid ${focus ? "rgba(34,197,94,0.45)" : BORDER}`,
        borderRadius: 10, color: "#fff", fontFamily: FONT, fontSize: 14,
        outline: "none", transition: "all 0.2s", boxSizing: "border-box",
        ...props.style,
      }}
    />
  )
}

/* ─── dark select ─────────────────────────────────────────────── */
function DarkSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [focus, setFocus] = useState(false)
  return (
    <select
      {...props}
      onFocus={e => { setFocus(true); props.onFocus?.(e) }}
      onBlur={e => { setFocus(false); props.onBlur?.(e) }}
      style={{
        width: "100%", padding: "11px 14px",
        background: focus ? "#0E1117" : "#0A0E14",
        border: `1px solid ${focus ? "rgba(34,197,94,0.45)" : BORDER}`,
        borderRadius: 10, color: "#fff", fontFamily: FONT, fontSize: 14,
        outline: "none", transition: "all 0.2s", cursor: "pointer",
        appearance: "none", WebkitAppearance: "none",
        ...props.style,
      }}
    />
  )
}

/* ─── dark textarea ───────────────────────────────────────────── */
function DarkTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focus, setFocus] = useState(false)
  return (
    <textarea
      {...props}
      onFocus={e => { setFocus(true); props.onFocus?.(e) }}
      onBlur={e => { setFocus(false); props.onBlur?.(e) }}
      style={{
        width: "100%", padding: "11px 14px", minHeight: 90, resize: "vertical",
        background: focus ? "rgba(255,255,255,0.07)" : SURFACE,
        border: `1px solid ${focus ? "rgba(34,197,94,0.45)" : BORDER}`,
        borderRadius: 10, color: "#fff", fontFamily: FONT, fontSize: 14,
        outline: "none", transition: "all 0.2s", boxSizing: "border-box",
        ...props.style,
      }}
    />
  )
}

/* ═══════════════════════════════════════════════════════════════ */
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
  const [isSubmitting, setIsSubmitting]           = useState(false)
  const [selectedContract, setSelectedContract]   = useState<Contract | null>(null)
  const [availableContracts, setAvailableContracts] = useState<Contract[]>([])
  const [loadingContracts, setLoadingContracts]   = useState(true)

  // ── logic unchanged ──────────────────────────────────────────
  useEffect(() => {
    if (isOpen) fetchOutstandingContracts()
  }, [isOpen])

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
      const response = await paymentService.getOutstandingPayments({ limit: 1000 })
      const contracts = response.data.outstanding_contracts.map((item: any) => ({
        id: item.contract_id,
        contract_number: item.contract_number,
        customer: item.customer,
        total_amount: item.total_amount,
        outstanding_amount: item.outstanding_amount,
      }))
      setAvailableContracts(contracts)
      if (preSelectedContract && !contracts.find((c: Contract) => c.id === preSelectedContract.id)) {
        setAvailableContracts([preSelectedContract, ...contracts])
      }
    } catch (error: any) {
      console.error("Failed to fetch contracts:", error)
      toast.error("Failed to load contracts")
      if (preSelectedContract) setAvailableContracts([preSelectedContract])
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD", minimumFractionDigits: 0 }).format(amount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.contract_id) { toast.error("Please select a contract"); return }
    if (!formData.amount || parseFloat(formData.amount) <= 0) { toast.error("Please enter a valid amount"); return }
    if (selectedContract?.outstanding_amount && parseFloat(formData.amount) > selectedContract.outstanding_amount) {
      toast.error(`Amount cannot exceed outstanding balance: ${formatCurrency(selectedContract.outstanding_amount)}`)
      return
    }
    setIsSubmitting(true)
    try {
      await paymentService.createPayment({ ...formData, amount: parseFloat(formData.amount) })
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
    setFormData({
      contract_id: "", amount: "", payment_method: "bank_transfer",
      payment_date: new Date().toISOString().split("T")[0],
      reference_number: "", notes: "", status: "completed",
    })
    setSelectedContract(null)
    onClose()
  }
  // ────────────────────────────────────────────────────────────

  if (!isOpen) return null

  const amountExceeds = selectedContract?.outstanding_amount != null &&
    formData.amount !== "" &&
    parseFloat(formData.amount) > selectedContract.outstanding_amount

  return (
    <>
      <style>{`
        @keyframes rpm-fade { from { opacity:0 } to { opacity:1 } }
        @keyframes rpm-up   { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }
        ::placeholder { color: #4B5563 !important; }
      `}</style>

      {/* backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
          animation: "rpm-fade 0.2s ease",
        }}
      />

      {/* panel */}
      <div style={{
        position: "fixed", top: "50%", left: "50%", zIndex: 51,
        transform: "translate(-50%,-50%)",
        width: "100%", maxWidth: 600,
        maxHeight: "90vh", overflowY: "auto",
        background: "#0A0E14",
        border: `1px solid ${BORDER}`,
        borderRadius: 18,
        boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
        fontFamily: FONT, color: "#fff",
        animation: "rpm-up 0.25s ease",
      }}>

        {/* header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: `1px solid ${BORDER}`,
          position: "sticky", top: 0, background: "#0A0E14", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: G_DIM, border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CreditCard size={15} color={GREEN} />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.025em", margin: 0 }}>Record Payment</h2>
          </div>
          <button
            onClick={handleClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: "#9CA3AF", display: "flex", transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}
          >
            <X size={18} />
          </button>
        </div>

        {/* form body */}
        <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* contract */}
          <Field label="Contract *">
            {loadingContracts ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13, color: "#9CA3AF" }}>
                <Loader2 size={13} style={{ animation: "oc-spin 0.8s linear infinite" }} />
                <style>{`@keyframes oc-spin { to { transform:rotate(360deg); } }`}</style>
                Loading contracts…
              </div>
            ) : (
              <DarkSelect
                value={formData.contract_id}
                onChange={(e) => handleContractChange(e.target.value)}
                required
              >
                <option value="">Select a contract</option>
                {availableContracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.contract_number} – {contract.customer.full_name}
                    {contract.outstanding_amount ? ` (Outstanding: ${formatCurrency(contract.outstanding_amount)})` : ""}
                  </option>
                ))}
              </DarkSelect>
            )}

            {/* contract info card */}
            {selectedContract && (
              <div style={{ marginTop: 4, padding: "12px 14px", borderRadius: 10, background: SURFACE, border: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{selectedContract.contract_number}</p>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 2 }}>Customer: {selectedContract.customer.full_name}</p>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: selectedContract.outstanding_amount ? 2 : 0 }}>
                  Total: {formatCurrency(selectedContract.total_amount)}
                </p>
                {selectedContract.outstanding_amount && (
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#F87171" }}>
                    Outstanding: {formatCurrency(selectedContract.outstanding_amount)}
                  </p>
                )}
              </div>
            )}
          </Field>

          {/* amount */}
          <Field
            label="Amount (DZD) *"
            hint={amountExceeds && (
              <span style={{ color: "#F87171", display: "flex", alignItems: "center", gap: 5 }}>
                <AlertCircle size={11} /> Amount exceeds outstanding balance
              </span>
            )}
          >
            <DarkInput
              type="number" step="0.01" min="0.01"
              max={selectedContract?.outstanding_amount || undefined}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Enter payment amount"
              required
            />
          </Field>

          {/* 2-col row: method + date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Payment Method *">
              <DarkSelect
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                required
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="check">Check</option>
                <option value="mobile_payment">Mobile Payment</option>
              </DarkSelect>
            </Field>

            <Field label="Payment Date *">
              <DarkInput
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </Field>
          </div>

          {/* 2-col row: reference + status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Reference Number">
              <DarkInput
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="e.g. TXN-20250104-001"
              />
            </Field>

            <Field label="Status *">
              <DarkSelect
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              >
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </DarkSelect>
            </Field>
          </div>

          {/* notes */}
          <Field label="Notes">
            <DarkTextarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes…"
            />
          </Field>

          {/* divider */}
          <div style={{ height: 1, background: BORDER }} />

          {/* actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{
                flex: 1, padding: "12px", borderRadius: 10, fontFamily: FONT,
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                background: "transparent", border: `1px solid ${BORDER}`,
                color: "#9CA3AF", transition: "all 0.18s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = SURFACE; e.currentTarget.style.color = "#fff" }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9CA3AF" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingContracts}
              style={{
                flex: 1, padding: "12px", borderRadius: 10, fontFamily: FONT,
                fontSize: 14, fontWeight: 600, cursor: isSubmitting || loadingContracts ? "not-allowed" : "pointer",
                background: isSubmitting || loadingContracts ? "rgba(34,197,94,0.4)" : GREEN,
                border: "none", color: "#fff",
                boxShadow: isSubmitting ? "none" : "0 0 18px rgba(34,197,94,0.2)",
                transition: "all 0.18s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              }}
              onMouseEnter={e => { if (!isSubmitting && !loadingContracts) e.currentTarget.style.background = "#16A34A" }}
              onMouseLeave={e => { if (!isSubmitting && !loadingContracts) e.currentTarget.style.background = GREEN }}
            >
              {isSubmitting ? (
                <>
                  <span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "oc-spin 0.7s linear infinite" }} />
                  Recording…
                </>
              ) : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}