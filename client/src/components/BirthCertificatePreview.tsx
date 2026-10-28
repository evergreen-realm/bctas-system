import React from "react";
import { Printer, Download, RotateCw, CheckCircle2, ShieldCheck, QrCode } from "lucide-react";
import { type Application, labelDate } from "@shared/bcatsCore";

export interface BirthCertificatePreviewProps {
  application: Application;
  onPrint?: () => void;
  onMarkPrinted?: () => void;
  isPrinting?: boolean;
}

export function KenyaCoatOfArms({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="coat-of-arms-svg"
      aria-label="Republic of Kenya Coat of Arms"
    >
      {/* Outer decorative ring */}
      <circle cx="60" cy="60" r="56" stroke="#93291E" strokeWidth="2.5" strokeDasharray="3 3" />
      <circle cx="60" cy="60" r="52" stroke="#B8860B" strokeWidth="1.5" />
      
      {/* Central Maasai Shield */}
      <path
        d="M60 22 C48 34, 44 56, 44 76 C44 92, 54 100, 60 104 C66 100, 76 92, 76 76 C76 56, 72 34, 60 22 Z"
        fill="#8B0000"
        stroke="#111"
        strokeWidth="2"
      />
      {/* Shield Black/White/Green central vertical stripes */}
      <path d="M60 22 C55 34, 53 56, 53 76 C53 88, 57 97, 60 102 C63 97, 67 88, 67 76 C67 56, 65 34, 60 22 Z" fill="#fff" />
      <path d="M60 24 C58 35, 57 56, 57 76 C57 86, 59 95, 60 99 C61 95, 63 86, 63 76 C63 56, 62 35, 60 24 Z" fill="#006600" />
      
      {/* Cockerel holding Axe */}
      <circle cx="60" cy="64" r="5" fill="#D4AF37" />
      <path d="M58 64 L62 60 L62 68 Z" fill="#fff" />
      <path d="M62 62 L66 61 L65 65 Z" fill="#B8860B" />

      {/* Crossed Traditional Spears */}
      <line x1="28" y1="102" x2="92" y2="20" stroke="#4a3b32" strokeWidth="3" strokeLinecap="round" />
      <polygon points="92,16 97,22 89,24" fill="#888" stroke="#333" strokeWidth="0.8" />
      <line x1="92" y1="102" x2="28" y2="20" stroke="#4a3b32" strokeWidth="3" strokeLinecap="round" />
      <polygon points="28,16 23,22 31,24" fill="#888" stroke="#333" strokeWidth="0.8" />

      {/* Left Lion Supporter */}
      <path
        d="M26 62 C26 50, 34 46, 38 52 C38 58, 35 70, 36 82 C33 84, 28 85, 26 80 C24 74, 26 68, 26 62 Z"
        fill="#C68642"
        stroke="#6B4423"
        strokeWidth="1.2"
      />
      {/* Right Lion Supporter */}
      <path
        d="M94 62 C94 50, 86 46, 82 52 C82 58, 85 70, 84 82 C87 84, 92 85, 94 80 C96 74, 94 68, 94 62 Z"
        fill="#C68642"
        stroke="#6B4423"
        strokeWidth="1.2"
      />

      {/* Harambee Banner */}
      <rect x="30" y="98" width="60" height="12" rx="3" fill="#FAF0E6" stroke="#8B0000" strokeWidth="1.2" />
      <text x="60" y="107" textAnchor="middle" fill="#8B0000" fontSize="7" fontWeight="bold" fontFamily="Georgia, serif" letterSpacing="0.8">
        HARAMBEE
      </text>
    </svg>
  );
}

export function OfficialPurpleSeal({ code = "NKS-SEC-99214" }: { code?: string }) {
  return (
    <div className="official-purple-seal" title="Official Purple Ink Registry Seal">
      <svg width="112" height="112" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="56" fill="none" stroke="#683ab7" strokeWidth="2.5" strokeDasharray="4 2" />
        <circle cx="60" cy="60" r="48" fill="none" stroke="#683ab7" strokeWidth="1.5" />
        <circle cx="60" cy="60" r="32" fill="none" stroke="#683ab7" strokeWidth="1" strokeDasharray="2 2" />

        <path id="seal-text-path-top" d="M 20 60 A 40 40 0 0 1 100 60" fill="none" />
        <text fill="#683ab7" fontSize="7" fontWeight="bold" letterSpacing="1.2" textAnchor="middle">
          <textPath href="#seal-text-path-top" startOffset="50%">
            CIVIL REGISTRATION SERVICES
          </textPath>
        </text>

        <path id="seal-text-path-bottom" d="M 100 60 A 40 40 0 0 1 20 60" fill="none" />
        <text fill="#683ab7" fontSize="7" fontWeight="bold" letterSpacing="1.2" textAnchor="middle">
          <textPath href="#seal-text-path-bottom" startOffset="50%">
            NAKURU REGISTRATION OFFICE
          </textPath>
        </text>

        {/* Center seal symbol & serial */}
        <text x="60" y="55" textAnchor="middle" fill="#683ab7" fontSize="8" fontWeight="bold" fontFamily="serif">
          OFFICIAL
        </text>
        <text x="60" y="66" textAnchor="middle" fill="#683ab7" fontSize="11" fontWeight="bold" fontFamily="serif">
          SEAL
        </text>
        <text x="60" y="76" textAnchor="middle" fill="#683ab7" fontSize="6.5" fontWeight="bold" fontFamily="monospace">
          {code}
        </text>
      </svg>
    </div>
  );
}

export function SecurityQrCode({ value }: { value: string }) {
  return (
    <div className="security-qr-block" title={`Cryptographic Verification Hash: ${value}`}>
      <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#1f2933" strokeWidth="1.5">
        <rect x="2" y="2" width="7" height="7" rx="1" fill="#1f2933" />
        <rect x="15" y="2" width="7" height="7" rx="1" fill="#1f2933" />
        <rect x="2" y="15" width="7" height="7" rx="1" fill="#1f2933" />
        <rect x="4" y="4" width="3" height="3" fill="#fff" />
        <rect x="17" y="4" width="3" height="3" fill="#fff" />
        <rect x="4" y="17" width="3" height="3" fill="#fff" />
        <path d="M12 2v4M12 8v2M12 14v4M16 12h4M16 16h2M18 20h2M12 20v2M14 16h-2" stroke="#1f2933" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="qr-caption">SCAN TO VERIFY</span>
    </div>
  );
}

export default function BirthCertificatePreview({
  application,
  onPrint,
  onMarkPrinted,
  isPrinting = false,
}: BirthCertificatePreviewProps) {
  const regNumber = application.certificate?.certificateNumber || `NKR/B/2026/${String(application.applicationId).padStart(5, "0")}`;
  const serialNo = application.certificate?.securitySerialNumber || `KCR-2026-041923`;
  const paperStock = "#SEC-88412";
  const sealCode = "NKS-SEC-99214";
  const issueDate = application.certificate?.issuedDate || labelDate(application.lastUpdated);

  const handlePrint = () => {
    const prevTitle = document.title;
    document.title = `Republic_of_Kenya_Form5_Birth_Certificate_${application.trackingNumber}`;
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
    setTimeout(() => {
      document.title = prevTitle;
    }, 1200);
  };

  const handleDownloadPdf = () => {
    const prevTitle = document.title;
    document.title = `Republic_of_Kenya_Form5_Birth_Certificate_${application.trackingNumber}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1200);
  };

  return (
    <div className="certificate-preview-container">
      {/* Print Control Toolbar */}
      <div className="certificate-toolbar no-print">
        <div className="toolbar-info">
          <div className="badge-high-dpi">
            <span className="dpi-dot" /> High DPI Security Stock Ready
          </div>
          <span className="stock-label">
            Paper Stock: <strong>{paperStock}</strong> · Seal: <strong>{sealCode}</strong>
          </span>
        </div>

        <div className="toolbar-actions">
          <button className="btn outline" onClick={handleDownloadPdf} title="Export Certificate as PDF">
            <Download size={14} /> Download PDF
          </button>
          <button className="btn outline" onClick={handlePrint} title="Re-print Form 5">
            <RotateCw size={14} /> Re-print
          </button>
          <button className="btn primary" onClick={handlePrint} disabled={isPrinting}>
            <Printer size={15} /> {isPrinting ? "Printing…" : "Print Certificate"}
          </button>
          {onMarkPrinted && application.currentStatus !== "Printed" && application.currentStatus !== "Collected" && (
            <button className="btn outline" onClick={onMarkPrinted} title="Record Form 5 Printed State">
              <CheckCircle2 size={14} /> Mark as Printed
            </button>
          )}
        </div>
      </div>

      {/* The Printable Form 5 Certificate Document */}
      <div className="form5-paper-root" id="printable-form5-certificate">
        {/* Security Border Watermark & Guilloche Pattern */}
        <div className="security-frame">
          <div className="security-frame-inner">
            {/* Header with Coat of Arms */}
            <div className="cert-header">
              <KenyaCoatOfArms size={78} />
              <div className="cert-header-titles">
                <h4 className="republic-text">REPUBLIC OF KENYA</h4>
                <h5 className="ministry-text">MINISTRY OF INTERIOR AND NATIONAL ADMINISTRATION</h5>
                <h6 className="department-text">DEPARTMENT OF CIVIL REGISTRATION SERVICES</h6>
                <div className="form-designation">
                  <span>FORM 5</span>
                  <div className="title-seal-wrap">
                    <h1 className="cert-main-title">CERTIFICATE OF BIRTH</h1>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Metadata Bar */}
            <div className="cert-meta-bar">
              <div className="meta-col">
                <span className="meta-label">Registration No:</span>
                <strong className="meta-val tracking-code">{regNumber}</strong>
              </div>
              <div className="meta-col center">
                <span className="meta-label">Sub-County Registry:</span>
                <strong className="meta-val">{application.subCounty || "Nakuru Town East"}</strong>
              </div>
              <div className="meta-col right">
                <span className="meta-label">Security Serial:</span>
                <strong className="meta-val serial-code">{serialNo}</strong>
              </div>
            </div>

            {/* Child Name Callout - Embossed Red Serif Typography per Wireframe */}
            <div className="child-name-banner">
              <span className="field-caption">Name of Child</span>
              <h2 className="child-full-name-embossed">
                {application.childName.toUpperCase()}
              </h2>
            </div>

            {/* Main Certificate Data Grid */}
            <div className="cert-data-grid">
              <div className="grid-cell">
                <span className="cell-label">Date of Birth</span>
                <span className="cell-value">{labelDate(application.dateOfBirth)}</span>
              </div>
              <div className="grid-cell">
                <span className="cell-label">Sex / Gender</span>
                <span className="cell-value">{application.gender}</span>
              </div>
              <div className="grid-cell span-2">
                <span className="cell-label">Place of Birth</span>
                <span className="cell-value">{application.placeOfBirth}</span>
              </div>

              <div className="grid-cell span-2">
                <span className="cell-label">Name of Mother</span>
                <span className="cell-value">
                  {application.parentRelationship === "Mother"
                    ? `${application.parentFullName} (ID: ${application.parentNationalId})`
                    : "Not Recorded"}
                </span>
              </div>
              <div className="grid-cell span-2">
                <span className="cell-label">Name of Father</span>
                <span className="cell-value">
                  {application.parentRelationship === "Father"
                    ? `${application.parentFullName} (ID: ${application.parentNationalId})`
                    : "Not Recorded"}
                </span>
              </div>

              <div className="grid-cell span-2">
                <span className="cell-label">Name and Qualification of Informant</span>
                <span className="cell-value">
                  {application.parentFullName} ({application.parentRelationship})
                </span>
              </div>
              <div className="grid-cell">
                <span className="cell-label">Birth Notification No.</span>
                <span className="cell-value">{application.birthNotificationNo}</span>
              </div>
              <div className="grid-cell">
                <span className="cell-label">Date of Registration</span>
                <span className="cell-value">{labelDate(application.submittedDate)}</span>
              </div>
            </div>

            {/* Certification Statutory Clause */}
            <div className="statutory-clause">
              <p>
                I, the Registrar of Births and Deaths for <strong>{application.subCounty || "Nakuru County"}</strong> District, 
                hereby certify that the above is a true copy of an entry in the Register of Births in this District.
              </p>
            </div>

            {/* Signatures, Purple Seal & QR Code Block */}
            <div className="cert-footer-grid">
              {/* QR Code */}
              <div className="footer-qr-side">
                <SecurityQrCode value={`${regNumber}:${serialNo}:${application.childName}`} />
                <span className="stock-footer-no">Stock #{paperStock}</span>
              </div>

              {/* Official Purple Stamp Seal */}
              <div className="footer-seal-center">
                <OfficialPurpleSeal code={sealCode} />
              </div>

              {/* Officer Signature & Date of Issue */}
              <div className="footer-sign-side">
                <div className="signature-line">
                  <span className="simulated-signature">D. Karanja</span>
                </div>
                <strong className="sign-title">District Civil Registrar</strong>
                <span className="sign-station">Nakuru Civil Registration Department</span>
                <div className="issue-date-tag">
                  Date of Issue: <strong>{issueDate}</strong>
                </div>
              </div>
            </div>

            {/* Microprint Footer */}
            <div className="cert-microprint">
              <span>REPUBLIC OF KENYA · CIVIL REGISTRATION ACT (CAP. 149) · SOVEREIGN SECURITY DOCUMENT · UNAUTHORIZED ALTERATION IS A CRIMINAL OFFENCE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

