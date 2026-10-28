import React, { useState } from "react";
import { X, ClipboardCheck, ShieldCheck, Printer, CheckCircle2, UserCheck, BookOpen, Download } from "lucide-react";
import { type Application, labelDate } from "@shared/bcatsCore";
import { KenyaCoatOfArms, OfficialPurpleSeal, SecurityQrCode } from "./BirthCertificatePreview";

export interface ConfirmCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  onConfirm: (data: {
    collectorName: string;
    collectorNationalId: string;
    collectorRelationship: string;
    collectorIdVerified: boolean;
    ledgerSignatureConfirmed: boolean;
    ledger: {
      volume: string;
      page: string;
      entry: string;
      issuingDesk: string;
    };
  }) => Promise<void>;
  busy?: boolean;
}

export function ConfirmCollectionModal({
  isOpen,
  onClose,
  application,
  onConfirm,
  busy = false,
}: ConfirmCollectionModalProps) {
  const [collectorName, setCollectorName] = useState(application.parentFullName || "");
  const [collectorNationalId, setCollectorNationalId] = useState(application.parentNationalId || "");
  const [relationship, setRelationship] = useState("Mother (Biological)");
  const [idVerified, setIdVerified] = useState(true);
  const [ledgerConfirmed, setLedgerConfirmed] = useState(true);
  const [vol, setVol] = useState("Vol. 42");
  const [page, setPage] = useState("Page 118");
  const [entry, setEntry] = useState("Entry 14");
  const desk = "Nakuru Central Desk 3";

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idVerified || !ledgerConfirmed) return;
    await onConfirm({
      collectorName,
      collectorNationalId,
      collectorRelationship: relationship,
      collectorIdVerified: idVerified,
      ledgerSignatureConfirmed: ledgerConfirmed,
      ledger: {
        volume: vol,
        page,
        entry,
        issuingDesk: desk,
      },
    });
    onClose();
  };

  const serialNo = application.certificate?.securitySerialNumber || "KCR-2026-041923";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon-badge">
              <ClipboardCheck size={18} />
            </span>
            <div>
              <h3>Confirm Collection</h3>
              <p>Physical Handover Verification under Kenya Civil Registration Act (Cap. 149)</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Reference info summary box */}
            <div className="collection-summary-box">
              <div className="summary-field">
                <span>Application Ref:</span>
                <strong>{application.trackingNumber}</strong>
              </div>
              <div className="summary-field">
                <span>Registered Child:</span>
                <strong>{application.childName}</strong>
              </div>
              <div className="summary-field">
                <span>Certificate Serial No:</span>
                <strong className="serial-accent">{serialNo}</strong>
              </div>
              <div className="summary-field">
                <span>Issuance Desk:</span>
                <strong>{desk}</strong>
              </div>
            </div>

            <div className="form-grid">
              <label>
                Collected by (Full Name)*
                <input
                  className="field"
                  required
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                  placeholder="e.g. Grace Akinyi Ochieng"
                />
              </label>

              <label>
                National ID Number*
                <input
                  className="field"
                  required
                  maxLength={8}
                  value={collectorNationalId}
                  onChange={(e) => setCollectorNationalId(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 28491029"
                />
              </label>
            </div>

            <label className="field-label-block">
              Relationship to Child*
              <select
                className="field"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              >
                <option>Mother (Biological)</option>
                <option>Father (Biological)</option>
                <option>Legal Guardian</option>
                <option>Authorized Agent (with Power of Attorney)</option>
              </select>
            </label>

            {/* Statutory Checklist */}
            <div className="statutory-check-block">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  required
                  checked={idVerified}
                  onChange={(e) => setIdVerified(e.target.checked)}
                />
                <div>
                  <strong>Physical National ID presented & verified</strong>
                  <span>Clerk verified original Kenyan ID photo matches the applicant in person.</span>
                </div>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  required
                  checked={ledgerConfirmed}
                  onChange={(e) => setLedgerConfirmed(e.target.checked)}
                />
                <div>
                  <strong>Physical parent signature captured in register ledger</strong>
                  <div className="ledger-inputs-row">
                    <input
                      className="field inline-field"
                      value={vol}
                      onChange={(e) => setVol(e.target.value)}
                      placeholder="Vol."
                    />
                    <input
                      className="field inline-field"
                      value={page}
                      onChange={(e) => setPage(e.target.value)}
                      placeholder="Page"
                    />
                    <input
                      className="field inline-field"
                      value={entry}
                      onChange={(e) => setEntry(e.target.value)}
                      placeholder="Entry"
                    />
                  </div>
                </div>
              </label>
            </div>

            <div className="handover-notice-callout">
              <ShieldCheck size={16} />
              <span>
                This action sends a collection confirmation SMS to the parent (<strong>{application.contactPhone}</strong>) 
                and permanently locks the certificate registry ledger.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn outline" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={busy || !idVerified || !ledgerConfirmed || !collectorName || !collectorNationalId}
            >
              {busy ? "Confirming Handover…" : "Confirm & Mark Collected"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export interface ViewReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
}

export function ViewReceiptModal({ isOpen, onClose, application }: ViewReceiptModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const receiptNo = `CRS-REC-2026-${String(application.applicationId).padStart(4, "0")}`;
  const collector = application.collection?.collectorName || application.parentFullName;
  const collectorId = application.collection?.collectorNationalId || application.parentNationalId;
  const handoverDate = application.collection?.collectedDate || labelDate(application.lastUpdated);
  const ledgerVol = application.ledger?.volume || "Vol. 42";
  const ledgerPage = application.ledger?.page || "Page 118";
  const ledgerEntry = application.ledger?.entry || "Entry 14";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header no-print">
          <div className="modal-title-wrap">
            <span className="modal-icon-badge green">
              <CheckCircle2 size={18} />
            </span>
            <div>
              <h3>Handover Voucher: Form CRS-REC-2026</h3>
              <p>Official Proof of Collection & Physical Custody Transfer</p>
            </div>
          </div>
          <div className="modal-header-actions">
            <button className="btn outline small" onClick={handlePrint}>
              <Printer size={14} /> Print Receipt
            </button>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* Printable Receipt Paper */}
          <div className="receipt-paper" id="printable-receipt">
            <div className="receipt-header">
              <KenyaCoatOfArms size={54} />
              <h4>REPUBLIC OF KENYA</h4>
              <h5>DEPARTMENT OF CIVIL REGISTRATION SERVICES</h5>
              <h6>OFFICIAL BIRTH CERTIFICATE COLLECTION VOUCHER</h6>
              <span className="receipt-voucher-no">Voucher No: {receiptNo}</span>
            </div>

            <div className="receipt-divider" />

            <div className="receipt-grid">
              <div className="receipt-cell">
                <span className="rk">Application Ref:</span>
                <strong className="rv">{application.trackingNumber}</strong>
              </div>
              <div className="receipt-cell">
                <span className="rk">Certificate Serial No:</span>
                <strong className="rv">{application.certificate?.securitySerialNumber || "KCR-2026-041923"}</strong>
              </div>
              <div className="receipt-cell">
                <span className="rk">Registered Child:</span>
                <strong className="rv highlight">{application.childName}</strong>
              </div>
              <div className="receipt-cell">
                <span className="rk">Date of Birth:</span>
                <strong className="rv">{labelDate(application.dateOfBirth)}</strong>
              </div>
              <div className="receipt-cell">
                <span className="rk">Collected By:</span>
                <strong className="rv">{collector}</strong>
              </div>
              <div className="receipt-cell">
                <span className="rk">Collector National ID:</span>
                <strong className="rv">{collectorId}</strong>
              </div>
              <div className="receipt-cell">
                <span className="rk">Relationship to Child:</span>
                <strong className="rv">{application.collectorRelationship || "Mother (Biological)"}</strong>
              </div>
              <div className="receipt-cell">
                <span className="rk">Collection Station:</span>
                <strong className="rv">Nakuru Civil Registration Office (CRS-NAK-05)</strong>
              </div>
              <div className="receipt-cell span-2">
                <span className="rk">Physical Register Ledger Coordinates:</span>
                <strong className="rv">{ledgerVol} / {ledgerPage} / {ledgerEntry} · Desk 3</strong>
              </div>
              <div className="receipt-cell">
                <span className="rk">Handover Timestamp:</span>
                <strong className="rv">{handoverDate} (EAT)</strong>
              </div>
              <div className="receipt-cell">
                <span className="rk">Issuing Officer:</span>
                <strong className="rv">Jane Kamau (Clerk Reg #8841)</strong>
              </div>
            </div>

            <div className="receipt-footer">
              <div className="receipt-qr">
                <SecurityQrCode value={`${receiptNo}:${application.trackingNumber}:${collector}`} />
              </div>

              <div className="receipt-seal">
                <OfficialPurpleSeal code="NKS-SEC-99214" />
              </div>

              <div className="receipt-sign-block">
                <div className="sign-line">
                  <span className="sim-sig">J. Kamau</span>
                </div>
                <span>Issuing Officer Signature</span>
                <small>Nakuru Civil Registry Counter 01</small>
              </div>
            </div>

            <div className="receipt-footnote">
              Retain this voucher as sovereign proof of certificate issuance under Cap. 149, Laws of Kenya.
            </div>
          </div>
        </div>

        <div className="modal-footer no-print">
          <button className="btn outline" onClick={onClose}>
            Close
          </button>
          <button className="btn primary" onClick={handlePrint}>
            <Printer size={15} /> Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
