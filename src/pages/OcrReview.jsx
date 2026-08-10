import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { invoiceDocumentApi, confirmInvoiceDocument } from "../api/Api";
import axiosApi from "../api/Axios";
import { parseImagePaths } from "../utils/parseImagePaths";
import { getFileKind } from "../utils/getFileKind";
import Button from "../components/Button";
import FileThumbnail from "../components/FileThumbnail";
import CircularProgress from "@mui/material/CircularProgress";
import { useAttendanceContext } from "../context/AttendanceContext";

const DOCUMENT_TYPE_LABELS = {
  INVOICE: "請求書",
  MONTHLY_STATEMENT: "月締め合計請求書",
  QUOTATION: "見積書",
  OTHER: "その他",
};

const AGGREGATED_TYPES = ["INVOICE", "MONTHLY_STATEMENT"];

const STATUS_BADGE_STYLE = {
  CONFIRMED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  ERROR: "bg-red-100 text-red-700",
  NEEDS_REVIEW: "bg-orange-100 text-orange-700",
};

const formatYen = (amount) => (amount == null ? "—" : `¥${Math.round(amount).toLocaleString()}`);

const formatDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

const formatMonth = (value) => {
  if (!value) return null;
  const [year, month] = String(value).split("-").map(Number);
  if (!year || !month) return value;
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

function Field({ label, value }) {
  return (
    <div className="flex justify-between text-sm gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right break-words">{value ?? "—"}</span>
    </div>
  );
}

function OcrReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { employee } = useAttendanceContext();
  const cameFromDashboard = location.state?.from === "dashboard";

  const goBack = () => {
    if (cameFromDashboard) {
      navigate("/dashboard", { state: { activeTab: "invoices", filters: location.state.filters } });
    } else {
      navigate("/ocr");
    }
  };

  const [item, setItem] = useState(id ? null : {});
  const [loading, setLoading] = useState(!!id);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const galleryRef = useRef(null);
  const imageRefs = useRef([]);

  const imagePaths = parseImagePaths(
    item?.file_path ?? item?.image_paths ?? item?.image_path ?? item?.ocr_upload?.image_paths ?? item?.ocr_upload?.image_path
  );

  const handleGalleryScroll = () => {
    const container = galleryRef.current;
    if (!container) return;
    const center = container.scrollLeft + container.clientWidth / 2;
    let closest = 0;
    let closestDistance = Infinity;
    imageRefs.current.forEach((el, i) => {
      if (!el) return;
      const elCenter = el.offsetLeft + el.offsetWidth / 2;
      const distance = Math.abs(elCenter - center);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = i;
      }
    });
    setActiveImageIndex(closest);
  };

  const scrollToImage = (index) => {
    imageRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  useEffect(() => {
    if (item) return;
    const fetchItem = async () => {
      setLoading(true);
      try {
        const url = `${axiosApi.defaults.baseURL}invoice-documents/${id}`;
        console.log("[OcrReview] Fetching:", url);
        const res = await invoiceDocumentApi.getById(id);
        setItem(res.data?.data ?? res.data ?? null);
      } catch (err) {
        console.error("[OcrReview] Failed to load document:", err);
        toast.error("Failed to load document");
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const warnings = Array.isArray(item?.warnings) ? item.warnings : [];
  const lines = Array.isArray(item?.lines) ? item.lines : [];
  const linesTotal = lines.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
  const totalWithTax =
    item?.total_with_tax != null ? item.total_with_tax : (item?.subtotal ?? 0) + (item?.tax_amount ?? 0);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await confirmInvoiceDocument(id, {
        subcontractor_id: item.subcontractor_id ?? null,
        subcontractor_name: item.subcontractor_name ?? null,
        issue_date: item.issue_date ?? null,
        billing_month: item.billing_month ?? null,
        document_type: item.document_type ?? null,
        subtotal: item.subtotal ?? null,
        tax_amount: item.tax_amount ?? null,
        lines,
        confirmed_by: employee?.employee_id ?? null,
      });

      toast.success("Document approved");
      goBack();
    } catch (err) {
      console.error("[OcrReview] Failed to approve document:", err);
      toast.error("Failed to approve document");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await invoiceDocumentApi.update(id, { status: "REJECTED" });

      toast.success("Document rejected");
      goBack();
    } catch (err) {
      console.error("[OcrReview] Failed to reject document:", err);
      toast.error("Failed to reject document");
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-3">
        <CircularProgress size={32} />
        <p className="text-gray-400 text-sm">Loading Data</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-gray-500 text-sm">Document not found</p>
        <Button buttonStyle="secondary" text="Back" onClick={goBack} customButton="w-40" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-100">
      <div className="bg-white px-5 py-4 border-b flex items-center gap-3">
        <button onClick={goBack} className="text-gray-500 text-sm cursor-pointer">
          ← Back{cameFromDashboard ? " to Dashboard" : ""}
        </button>
        <span className="font-semibold text-lg">Invoice Details</span>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Original Document</p>
          {imagePaths.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div
                ref={galleryRef}
                onScroll={handleGalleryScroll}
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {imagePaths.map((path, idx) =>
                  getFileKind(path) === "image" ? (
                    <img
                      key={path}
                      ref={(el) => (imageRefs.current[idx] = el)}
                      src={path}
                      alt="document"
                      className="h-40 sm:h-56 w-[80vw] sm:w-auto sm:max-w-xs rounded-2xl object-contain bg-gray-100 flex-shrink-0 snap-center"
                    />
                  ) : (
                    <a
                      key={path}
                      ref={(el) => (imageRefs.current[idx] = el)}
                      href={path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-40 sm:h-56 w-[80vw] sm:w-48 rounded-2xl bg-gray-100 flex-shrink-0 snap-center overflow-hidden block"
                    >
                      <FileThumbnail src={path} name={path} />
                    </a>
                  )
                )}
              </div>
              {imagePaths.length > 1 && (
                <div className="flex justify-center gap-1.5">
                  {imagePaths.map((path, idx) => (
                    <button
                      key={path}
                      type="button"
                      onClick={() => scrollToImage(idx)}
                      aria-label={`Go to image ${idx + 1}`}
                      className={`rounded-full transition-all cursor-pointer ${
                        idx === activeImageIndex ? "w-5 h-2 bg-green-600" : "w-2 h-2 bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No image available</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase">Vendor</p>
          <Field label="Subcontractor" value={item.subcontractor_name} />
          <Field label="Vendor" value={item.vendor_name_raw} />

          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Document</p>
            <Field label="Issue Date" value={formatDate(item.issue_date)} />
            <Field label="Billing Month" value={formatMonth(item.billing_month)} />
            <Field
              label="Document Type"
              value={
                <>
                  {DOCUMENT_TYPE_LABELS[item.document_type] ?? item.document_type}
                  {!AGGREGATED_TYPES.includes(item.document_type) && (
                    <span className="block text-xs text-orange-500 font-normal">not aggregated</span>
                  )}
                </>
              }
            />
            <Field label="Category" value={item.category_id} />
            <Field
              label="Status"
              value={
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    STATUS_BADGE_STYLE[item.status] ?? "bg-gray-100 text-gray-500"
                  }`}
                >
                  {item.status}
                </span>
              }
            />
          </div>

          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Amounts</p>
            <Field label="Subtotal" value={formatYen(item.subtotal)} />
            <Field label="Tax" value={formatYen(item.tax_amount)} />
            <Field label="Total (incl. tax)" value={<span className="font-semibold">{formatYen(totalWithTax)}</span>} />
          </div>

          {warnings.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-1">
              {warnings.map((w, idx) => (
                <p key={idx} className="text-xs text-orange-600">⚠ {w}</p>
              ))}
            </div>
          )}

          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">Lines</p>
            {lines.length > 0 ? (
              lines.map((line, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{line.site_name ?? (line.site_id != null ? `Site #${line.site_id}` : "—")}</span>
                  <span className="font-medium">{formatYen(line.amount)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No lines</p>
            )}
            <div className="flex justify-between text-sm pt-1 border-t">
              <span className="text-gray-500">Line total</span>
              <span className="font-medium">{formatYen(linesTotal)}</span>
            </div>
          </div>

          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Meta</p>
            <Field label="Uploaded At" value={formatDate(item.uploaded_at)} />
            <Field label="Processed At" value={formatDate(item.processed_at)} />
            <Field label="Confirmed By" value={item.confirmed_by} />
            <Field label="Confirmed At" value={formatDate(item.confirmed_at)} />
            <Field label="Note" value={item.note} />
          </div>

          {!cameFromDashboard && (
            item.status === "CONFIRMED" ? (
              <p className="text-center text-sm font-semibold text-green-700 border-t pt-4">
                Approved Document
              </p>
            ) : item.status === "REJECTED" ? (
              <p className="text-center text-sm font-semibold text-red-700 border-t pt-4">
                Rejected Document
              </p>
            ) : (
              <div className="flex gap-3 border-t pt-4">
                <Button
                  buttonStyle="danger"
                  text="Reject"
                  onClick={handleReject}
                  loading={rejecting}
                  customButton={`flex-1 ${approving ? "opacity-50 pointer-events-none" : ""}`}
                />
                <Button
                  buttonStyle="primary"
                  text="Approve"
                  onClick={handleApprove}
                  loading={approving}
                  customButton={`flex-1 ${rejecting ? "opacity-50 pointer-events-none" : ""}`}
                />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default OcrReview;
