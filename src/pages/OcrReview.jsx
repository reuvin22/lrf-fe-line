import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ChevronDown } from "lucide-react";
import { invoiceDocumentApi, confirmInvoiceDocument, subContractorApi, sitesApi } from "../api/Api";
import axiosApi from "../api/Axios";
import { parseImagePaths } from "../utils/parseImagePaths";
import { getFileKind } from "../utils/getFileKind";
import Button from "../components/Button";
import FileThumbnail from "../components/FileThumbnail";

const DOCUMENT_TYPES = [
  { value: "INVOICE", label: "請求書" },
  { value: "MONTHLY_STATEMENT", label: "月締め合計請求書" },
  { value: "QUOTATION", label: "見積書" },
  { value: "OTHER", label: "その他" },
];

const AGGREGATED_TYPES = ["INVOICE", "MONTHLY_STATEMENT"];

function unwrapList(res) {
  const inner = res?.data?.data;
  return Array.isArray(inner) ? inner : Array.isArray(inner?.data) ? inner.data : [];
}

function OcrReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(id ? null : {});
  const [loading, setLoading] = useState(!!id);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const [vendors, setVendors] = useState([]);
  const [sites, setSites] = useState([]);

  const [vendorId, setVendorId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [isNewVendor, setIsNewVendor] = useState(false);

  const [billingDate, setBillingDate] = useState("");
  const [documentType, setDocumentType] = useState("INVOICE");
  const [documentTotal, setDocumentTotal] = useState("");
  const [lines, setLines] = useState([{ site_id: "", amount: "" }]);

  const imagePaths = parseImagePaths(
    item?.image_paths ?? item?.image_path ?? item?.ocr_upload?.image_paths ?? item?.ocr_upload?.image_path
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const galleryRef = useRef(null);
  const imageRefs = useRef([]);

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
    const load = async () => {
      try {
        const [vendorRes, siteRes] = await Promise.all([
          subContractorApi.getAll({ approved: 1 }),
          sitesApi.getAll(),
        ]);
        setVendors(unwrapList(vendorRes));
        setSites(unwrapList(siteRes));
      } catch (err) {
        console.error("[OcrReview] Failed to load vendors/sites:", err);
      }
    };
    load();
  }, []);

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

  useEffect(() => {
    if (!item) return;
    setVendorId(
      item.vendor_id != null
        ? String(item.vendor_id)
        : item.subcontractor_id != null
          ? String(item.subcontractor_id)
          : ""
    );
    setVendorName(item.vendor_name ?? item.subcontractor_name ?? "");
    setBillingDate(
      item.billing_date ?? (item.ocr_result_date ? String(item.ocr_result_date).slice(0, 10) : "")
    );
    setDocumentType(item.document_type ?? "INVOICE");
    setDocumentTotal(
      item.document_total != null
        ? String(item.document_total)
        : item.ocr_result_amount != null
          ? String(item.ocr_result_amount)
          : ""
    );

    const initialLines =
      Array.isArray(item.lines) && item.lines.length > 0
        ? item.lines.map((l) => ({
            site_id: l.site_id != null ? String(l.site_id) : "",
            amount: l.amount != null ? String(l.amount) : "",
          }))
        : [
            {
              site_id: item.site_id != null ? String(item.site_id) : "",
              amount: item.ocr_result_amount != null ? String(item.ocr_result_amount) : "",
            },
          ];
    setLines(initialLines);
  }, [item]);

  const vendorNameRaw = item?.vendor_name_raw ?? item?.subcontractor_name ?? null;

  const linesTotal = lines.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
  const documentTotalNumber = parseFloat(documentTotal) || 0;
  const hasMismatch = documentTotal !== "" && Math.abs(linesTotal - documentTotalNumber) > 0.01;

  const handleVendorSelect = (value) => {
    if (value === "__new__") {
      setIsNewVendor(true);
      setVendorId("");
      setVendorName("");
      return;
    }
    setIsNewVendor(false);
    setVendorId(value);
    const matched = vendors.find((v) => String(v.subcontractor_id) === String(value));
    setVendorName(matched?.company_name ?? matched?.name ?? "");
  };

  const addLine = () => setLines((prev) => [...prev, { site_id: "", amount: "" }]);
  const removeLine = (index) => setLines((prev) => prev.filter((_, i) => i !== index));
  const updateLine = (index, field, value) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const handleApprove = async () => {
    if (!vendorName.trim()) {
      toast.error("Please select or enter a vendor");
      return;
    }
    if (!billingDate) {
      toast.error("Please enter a date");
      return;
    }
    const validLines = lines.filter((l) => l.site_id && l.amount !== "");
    if (validLines.length === 0) {
      toast.error("Please add at least one line with a site and amount");
      return;
    }

    setApproving(true);
    try {
      const payloadLines = validLines.map((l) => {
        const matched = sites.find((s) => String(s.site_id) === String(l.site_id));
        return {
          site_id: matched?.site_id ?? l.site_id,
          site_name: matched?.site_name ?? "",
          amount: parseFloat(l.amount) || 0,
        };
      });

      await confirmInvoiceDocument(id, {
        vendor_id: isNewVendor ? null : vendorId || null,
        vendor_name: vendorName.trim(),
        billing_date: billingDate,
        document_type: documentType,
        document_total: documentTotalNumber,
        lines: payloadLines,
      });

      toast.success("Document approved");
      navigate("/ocr");
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
      await invoiceDocumentApi.update(id, {
        status: "REJECTED",
      });

      toast.success("Document rejected");
      navigate("/ocr");
    } catch (err) {
      console.error("[OcrReview] Failed to reject document:", err);
      toast.error("Failed to reject document");
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-gray-500 text-sm">Document not found</p>
        <Button buttonStyle="secondary" text="Back" onClick={() => navigate("/ocr")} customButton="w-40" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-100">
      <div className="bg-white px-5 py-4 border-b flex items-center gap-3">
        <button onClick={() => navigate("/ocr")} className="text-gray-500 text-sm cursor-pointer">
          ← Back
        </button>
        <span className="font-semibold text-lg">Review Document</span>
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

        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div>
            <label className="text-sm text-gray-600 font-medium">
              Vendor <span className="text-red-500">*</span>
            </label>
            {!isNewVendor ? (
              <div className="relative mt-1">
                <select
                  className="w-full appearance-none truncate border border-gray-200 rounded-xl p-3 pr-8 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={vendorId}
                  onChange={(e) => handleVendorSelect(e.target.value)}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((v) => (
                    <option key={v.subcontractor_id} value={v.subcontractor_id}>
                      {v.company_name ?? v.name}
                    </option>
                  ))}
                  <option value="__new__">+ Add new vendor</option>
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            ) : (
              <div className="flex gap-2 mt-1 items-center">
                <input
                  type="text"
                  placeholder="New vendor name"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="flex-1 min-w-0 border border-gray-200 rounded-xl p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <button
                  type="button"
                  className="shrink-0 text-xs text-gray-500 cursor-pointer px-2 py-3"
                  onClick={() => {
                    setIsNewVendor(false);
                    setVendorName("");
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
            {vendorNameRaw && (
              <p className="text-xs text-gray-400 mt-1">OCR candidate: {vendorNameRaw}</p>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-600 font-medium">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={billingDate}
              onChange={(e) => setBillingDate(e.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-xl p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-medium">
              Document Type <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <select
                className="w-full appearance-none truncate border border-gray-200 rounded-xl p-3 pr-8 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
            {!AGGREGATED_TYPES.includes(documentType) && (
              <p className="text-xs text-orange-500 mt-1">
                Only 請求書 / 月締め合計請求書 are included in aggregation
              </p>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-600 font-medium">Document Total (¥)</label>
            <input
              type="number"
              value={documentTotal}
              onChange={(e) => setDocumentTotal(e.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-xl p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-600 font-medium">
                Lines <span className="text-red-500">*</span>
              </label>
              <button type="button" onClick={addLine} className="text-xs text-green-600 font-medium cursor-pointer">
                + Add Row
              </button>
            </div>

            {lines.map((line, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <div className="relative flex-1 min-w-0">
                  <select
                    className="w-full appearance-none truncate border border-gray-200 rounded-xl p-2 pr-8 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={line.site_id}
                    onChange={(e) => updateLine(idx, "site_id", e.target.value)}
                  >
                    <option value="">Select Site</option>
                    {sites.map((s) => (
                      <option key={s.site_id} value={s.site_id}>
                        {s.site_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
                <input
                  type="number"
                  placeholder="Amount"
                  value={line.amount}
                  onChange={(e) => updateLine(idx, "amount", e.target.value)}
                  className="w-20 sm:w-28 shrink-0 min-w-0 border border-gray-200 rounded-xl p-2 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    className="shrink-0 text-red-500 text-lg leading-none w-8 h-8 flex items-center justify-center cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            <div className="flex justify-between text-sm pt-4">
              <span className="text-gray-500">Line total</span>
              <span className="font-medium">¥{linesTotal.toLocaleString()}</span>
            </div>

            {hasMismatch && (
              <p className="text-xs text-red-500">
                ⚠ Line total (¥{linesTotal.toLocaleString()}) does not match document total (¥
                {documentTotalNumber.toLocaleString()})
              </p>
            )}
          </div>

          <div className="flex gap-3">
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
        </div>
      </div>
    </div>
  );
}

export default OcrReview;
