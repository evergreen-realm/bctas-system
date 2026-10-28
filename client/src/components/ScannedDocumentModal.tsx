import React, { useState } from "react";
import { X, FileText, Fingerprint, Landmark, CheckCircle2, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { type Application, labelDate } from "@shared/bcatsCore";
import { KenyaCoatOfArms } from "./BirthCertificatePreview";

export interface ScannedDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  onVerifyAttachments?: () => void;
}

export default function ScannedDocumentModal({
  isOpen,
  onClose,
  application,
  onVerifyAttachments,
}: ScannedDocumentModalProps) {
  const [activeTab, setActiveTab] = useState<"form1" | "nationalId">("form1");
  const [zoom, setZoom] = useState(1);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="scanned-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="scanned-modal-header">
          <div className="header-info">
            <span className="file-pill">
              <FileText size={16} /> Scanned Attachments
            </span>
            <h3>
              {application.childName} · <code>{application.trackingNumber}</code>
            </h3>
            <p>Digitized statutory intake documentation audited under Civil Registration Act (Cap. 149)</p>
          </div>

          <div className="header-tools">
            <div className="tab-buttons">
              <button
                className={`tab-btn ${activeTab === "form1" ? "active" : ""}`}
                onClick={() => setActiveTab("form1")}
              >
                <Landmark size={14} /> Form 1 (B1 Pink Slip)
              </button>
              <button
                className={`tab-btn ${activeTab === "nationalId" ? "active" : ""}`}
                onClick={() => setActiveTab("nationalId")}
              >
                <Fingerprint size={14} /> National ID (IPRS Card)
              </button>
            </div>

            <div className="zoom-controls">
              <button
                className="tool-btn"
                onClick={() => setZoom((z) => Math.max(0.8, z - 0.1))}
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="zoom-label">{Math.round(zoom * 100)}%</span>
              <button
                className="tool-btn"
                onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            <button className="modal-close-btn" onClick={onClose} aria-label="Close Modal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Document Viewer Body */}
        <div className="scanned-document-viewer">
          {activeTab === "form1" ? (
            /* Form 1 B1 Pink Slip */
            <div className="document-sheet pink-slip" style={{ transform: `scale(${zoom})` }}>
              <div className="pink-slip-header">
                <div className="slip-meta-left">
                  <span className="slip-code">FORM B1</span>
                  <small>Statutory Notice of Birth</small>
                </div>
                <div className="slip-crest-center">
                  <KenyaCoatOfArms size={48} />
                  <h4>REPUBLIC OF KENYA</h4>
                  <h5>MINISTRY OF HEALTH & CIVIL REGISTRATION</h5>
                  <h6>HOSPITAL NOTIFICATION OF BIRTH</h6>
                </div>
                <div className="slip-meta-right">
                  <span className="slip-ref-label">Notification No:</span>
                  <strong className="slip-ref-val">{application.birthNotificationNo}</strong>
                </div>
              </div>

              <div className="pink-slip-body">
                <div className="slip-row">
                  <span className="slip-field-label">1. Health Facility / Hospital:</span>
                  <strong className="slip-field-val">{application.placeOfBirth}</strong>
                </div>
                <div className="slip-grid-3">
                  <div>
                    <span className="slip-field-label">2. Date of Birth:</span>
                    <strong className="slip-field-val">{labelDate(application.dateOfBirth)}</strong>
                  </div>
                  <div>
                    <span className="slip-field-label">3. Time of Birth:</span>
                    <strong className="slip-field-val">04:15 AM (EAT)</strong>
                  </div>
                  <div>
                    <span className="slip-field-label">4. Sex:</span>
                    <strong className="slip-field-val">{application.gender}</strong>
                  </div>
                </div>

                <div className="slip-grid-3">
                  <div>
                    <span className="slip-field-label">5. Birth Weight:</span>
                    <strong className="slip-field-val">3,420 grams (Normal)</strong>
                  </div>
                  <div>
                    <span className="slip-field-label">6. Gestation:</span>
                    <strong className="slip-field-val">39 Weeks (Term)</strong>
                  </div>
                  <div>
                    <span className="slip-field-label">7. Type of Delivery:</span>
                    <strong className="slip-field-val">Spontaneous Vertex (SVD)</strong>
                  </div>
                </div>

                <div className="slip-row">
                  <span className="slip-field-label">8. Full Name of Child (Provisional):</span>
                  <strong className="slip-field-val highlight">{application.childName}</strong>
                </div>

                <div className="slip-grid-2">
                  <div>
                    <span className="slip-field-label">9. Mother's Full Name:</span>
                    <strong className="slip-field-val">{application.parentFullName}</strong>
                  </div>
                  <div>
                    <span className="slip-field-label">10. Mother's National ID:</span>
                    <strong className="slip-field-val">{application.parentNationalId}</strong>
                  </div>
                </div>

                <div className="slip-footer-signatures">
                  <div className="midwife-block">
                    <span className="slip-field-label">Attending Midwife / Medical Officer:</span>
                    <div className="sig-line">Dr. Florence Nduta, MBChB (Reg #44910)</div>
                    <small>Nakuru Level 5 Maternity Ward Staff</small>
                  </div>

                  <div className="hospital-stamp-box">
                    <div className="hospital-stamp-inner">
                      <span>NAKURU LEVEL 5 HOSPITAL</span>
                      <strong>OFFICIAL MATERNITY STAMP</strong>
                      <small>VERIFIED & DISPATCHED</small>
                      <span className="stamp-date">{labelDate(application.submittedDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Kenyan National ID Card */
            <div className="document-sheet national-id-sheet" style={{ transform: `scale(${zoom})` }}>
              <div className="id-card-frame">
                <div className="id-header">
                  <div className="id-crest">
                    <KenyaCoatOfArms size={38} />
                  </div>
                  <div className="id-title-text">
                    <strong>JAMHURI YA KENYA</strong>
                    <span>REPUBLIC OF KENYA</span>
                    <small>NATIONAL IDENTITY CARD</small>
                  </div>
                  <div className="id-chip-box">
                    <div className="chip-gold" />
                  </div>
                </div>

                <div className="id-body-content">
                  <div className="id-photo-col">
                    <div className="photo-placeholder">
                      <span className="photo-silhouette">👤</span>
                      <small>VERIFIED IPRS PHOTO</small>
                    </div>
                    <div className="id-serial-bottom">
                      <span>ID NUMBER</span>
                      <strong>{application.parentNationalId}</strong>
                    </div>
                  </div>

                  <div className="id-data-col">
                    <div className="id-field">
                      <span className="id-k">FULL NAMES / MAJINA:</span>
                      <strong className="id-v">{application.parentFullName.toUpperCase()}</strong>
                    </div>
                    <div className="id-data-row">
                      <div className="id-field">
                        <span className="id-k">DATE OF BIRTH:</span>
                        <strong className="id-v">14/05/1992</strong>
                      </div>
                      <div className="id-field">
                        <span className="id-k">SEX:</span>
                        <strong className="id-v">
                          {application.parentRelationship === "Mother" ? "FEMALE" : "MALE"}
                        </strong>
                      </div>
                    </div>

                    <div className="id-data-row">
                      <div className="id-field">
                        <span className="id-k">DISTRICT OF BIRTH:</span>
                        <strong className="id-v">{application.subCounty.toUpperCase()}</strong>
                      </div>
                      <div className="id-field">
                        <span className="id-k">PLACE OF ISSUE:</span>
                        <strong className="id-v">NAKURU</strong>
                      </div>
                    </div>

                    <div className="id-data-row">
                      <div className="id-field">
                        <span className="id-k">DATE OF ISSUE:</span>
                        <strong className="id-v">20/08/2012</strong>
                      </div>
                      <div className="id-field">
                        <span className="id-k">SERIAL NUMBER:</span>
                        <strong className="id-v">239481029</strong>
                      </div>
                    </div>

                    <div className="id-biometric-fingerprint">
                      <Fingerprint size={28} className="fp-svg" />
                      <span className="fp-text">IPRS BIOMETRIC MATCH VERIFIED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="scanned-modal-footer">
          <div className="footer-status-tag">
            <CheckCircle2 size={15} className="check-green" />
            <span>Digital OCR & IPRS mTLS hash signature verified against national master register</span>
          </div>

          <div className="footer-actions">
            <button className="btn outline" onClick={onClose}>
              Close Preview
            </button>
            {onVerifyAttachments && (
              <button
                className="btn primary"
                onClick={() => {
                  onVerifyAttachments();
                  onClose();
                }}
              >
                <CheckCircle2 size={14} /> Confirm Documents Legitimate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

