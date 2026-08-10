import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Image, Upload } from "lucide-react";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "../components/Button";
import FileThumbnail from "../components/FileThumbnail";
import { ocrCategoriesApi, ocrUploadApi, invoiceDocumentApi, siteAssignmentApi, subContractorWorkerApi, subContractorApi, siteSubContractorApi } from "../api/Api";
import axiosApi from "../api/Axios";
import ConfirmationModal from "../components/Modals/ConfirmationModal";
import { useAttendanceContext } from "../context/AttendanceContext";
import { useLocationContext, MOCK_SITE } from "../context/LocationContext";
import { parseImagePaths } from "../utils/parseImagePaths";
import environment from "../environment";
import { toast } from "react-toastify";

const STATUS_ORDER = ["NEEDS_REVIEW", "CONFIRMED", "REJECTED", "ERROR"];

const DOCUMENT_TYPE_LABELS = {
  INVOICE: "請求書",
  MONTHLY_STATEMENT: "月締め合計請求書",
  QUOTATION: "見積書",
  OTHER: "その他",
};

const formatYen = (amount) => (amount == null ? "" : `¥${Math.round(amount).toLocaleString()}`);

const sortUploadedItems = (items) =>
  [...items].sort((a, b) => {
    const rankA = STATUS_ORDER.indexOf(a.status);
    const rankB = STATUS_ORDER.indexOf(b.status);
    const orderA = rankA === -1 ? STATUS_ORDER.length : rankA;
    const orderB = rankB === -1 ? STATUS_ORDER.length : rankB;
    if (orderA !== orderB) return orderA - orderB;

    return new Date(b.uploaded_at) - new Date(a.uploaded_at);
  });

function OcrUpload() {
  const navigate = useNavigate();
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImagePaths, setExistingImagePaths] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [site, setSite] = useState("");
  const { sites, setSites } = useLocationContext();
  const siteOptions = !environment.VITE_LIFF_ENABLED
    ? [
        ...sites
          .filter((s) => String(s.site_id) !== String(MOCK_SITE.site_id))
          .map((s) => ({
            site_id: s.site_id,
            site_name: s.site_name,
          })),
        {
          site_id: MOCK_SITE.site_id,
          site_name: MOCK_SITE.site_name,
        },
      ]
    : sites;
  const [note, setNote] = useState("");
  const [uploadedItems, setUploadedItems] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const libraryInputRef = useRef(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { attendance, employee } = useAttendanceContext()
  const [subcontractorId, setSubcontractorId] = useState(null);
  const [subcontractorName, setSubcontractorName] = useState(null);
  const [allSubcontractors, setAllSubcontractors] = useState([]);
  const [siteSubMap, setSiteSubMap] = useState(new Map());

  const logErrorOrRejected = (items, res) => {
    (items || []).forEach((item) => {
      if (item.status === "ERROR" || item.status === "REJECTED") {
        console.log(`[OcrUpload] ${item.status} response:`, res);
      }
    });
  };

  const fetchUploads = async () => {
    try {
      const res = await invoiceDocumentApi.getAll();
      const inner = res.data?.data;
      const items = Array.isArray(inner) ? inner : Array.isArray(inner?.data) ? inner.data : [];
      logErrorOrRejected(items, res);
      setUploadedItems(items);
    } catch (err) {
      console.error("Error fetching invoice documents:", err);
    }
  };

  // Load categories and uploads immediately on mount — no employee needed
  useEffect(() => {
    const load = async () => {
      setPageLoading(true);
      try {
        const [catRes, uploadsRes] = await Promise.all([
          ocrCategoriesApi.getAll(),
          invoiceDocumentApi.getAll(),
        ]);
        const catInner = catRes.data?.data;
        setCategories(Array.isArray(catInner) ? catInner : Array.isArray(catInner?.data) ? catInner.data : []);
        const inner = uploadsRes.data?.data;
        const items = Array.isArray(inner) ? inner : Array.isArray(inner?.data) ? inner.data : [];
        logErrorOrRejected(items, uploadsRes);
        setUploadedItems(items);
      } catch (err) {
        console.error("[OcrUpload] Failed to load categories/uploads:", err);
        toast.error("Failed to load data");
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, []);

  // Load subcontractors and the site → subcontractor mapping — no employee needed
  useEffect(() => {
    const load = async () => {
      try {
        const [subRes, siteSubRes] = await Promise.all([
          subContractorApi.getAll({ approved: 1 }),
          siteSubContractorApi.getAll(),
        ]);
        const subInner = subRes.data?.data;
        setAllSubcontractors(Array.isArray(subInner) ? subInner : Array.isArray(subInner?.data) ? subInner.data : []);

        const siteSubInner = siteSubRes.data?.data;
        const siteSubList = Array.isArray(siteSubInner) ? siteSubInner : Array.isArray(siteSubInner?.data) ? siteSubInner.data : [];
        const map = new Map();
        siteSubList.forEach((entry) => {
          const siteId = String(entry.site_id);
          const subId = String(entry.subcontractor_id);
          if (!map.has(siteId)) map.set(siteId, new Set());
          map.get(siteId).add(subId);
        });
        setSiteSubMap(map);
      } catch (err) {
        console.error("[OcrUpload] Failed to load subcontractors:", err);
      }
    };
    load();
  }, []);

  // Load sites and subcontractor once employee is available
  useEffect(() => {
    const employeeId = employee?.employee_id ?? attendance?.employee_id;
    const employeeName = employee?.name;
    if (!employeeId || !employeeName) return;

    const load = async () => {
      try {
        const [assignRes, workersRes] = await Promise.all([
          siteAssignmentApi.getAll(),
          subContractorWorkerApi.getAll(),
        ]);

        // Sites — match worker_id to employeeId
        const assignInner = assignRes.data?.data;
        const allAssignments = Array.isArray(assignInner)
          ? assignInner
          : Array.isArray(assignInner?.data) ? assignInner.data : [];

        const matchedSites = allAssignments
          .filter((v) => v != null && String(v.worker_id ?? "") === String(employeeId))
          .map((v) => ({ site_id: v.site_id, site_name: v.site_name }))
          .filter((s) => s.site_id != null);

        console.log("[OcrUpload] employeeId:", employeeId, "matched sites:", matchedSites);
        if (matchedSites.length > 0 || environment.VITE_LIFF_ENABLED) {
          setSites(matchedSites);
        }

        // Subcontractor worker — match by name with fallbacks
        const workerInner = workersRes.data?.data;
        const workers = Array.isArray(workerInner)
          ? workerInner
          : Array.isArray(workerInner?.data) ? workerInner.data : [];

        const normalize = (str) =>
          (str ?? "").replace(/\[.*?\]\s*/g, "").trim().toLowerCase();

        const norm = normalize(employeeName);
        const matched =
          workers.find((w) => normalize(w.name) === norm) ??
          workers.find((w) => normalize(w.name).includes(norm)) ??
          workers.find((w) => norm.includes(normalize(w.name)));

        console.log("[OcrUpload] employeeName:", employeeName, "matched worker:", matched);
        setSubcontractorId(matched?.subcontractor_id ?? null);
        setSubcontractorName(matched?.subcontractor_name ?? null);
      } catch (err) {
        console.error("[OcrUpload] Failed to load sites/subcontractor:", err);
      }
    };

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee?.employee_id, employee?.name]);

  const allowedSubcontractorIds = site ? siteSubMap.get(String(site)) : null;
  const subcontractorOptions =
    allowedSubcontractorIds && allowedSubcontractorIds.size > 0
      ? allSubcontractors.filter((s) => allowedSubcontractorIds.has(String(s.subcontractor_id ?? s.id)))
      : allSubcontractors;

  const handleImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImageFiles((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeExistingImage = (path) => {
    setExistingImagePaths((prev) => prev.filter((p) => p !== path));
  };

  const removeNewImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };
  console.log(categories)
  const handleUpload = async () => {
    if (!site) {
      toast.error("Please select a site");
      return;
    }

    setLoading(true);
    console.log(categories)
    try {
      const imagesBase64Payload = await Promise.all(imageFiles.map(convertToBase64));

      const selectedCategory = categories.find(c => String(c.category_id) === String(category));
      const selectedSite = siteOptions.find(s => String(s.site_id) === String(site));

      const payload = {
        uploaded_by: attendance.employee_id,
        category_id: selectedCategory?.category_id ?? null,
        site_id: selectedSite?.site_id ?? null,
        site_name:
          selectedSite?.site_name ||
          (String(site) === String(MOCK_SITE.site_id) ? MOCK_SITE.site_name : null),
        subcontractor_id: subcontractorId,
        subcontractor_name: subcontractorName,
        attendance_id: attendance.attendance_id,
        upload_source: "LINE",
        status: "PENDING",
        images_base64: imagesBase64Payload,
        previous_image_paths: existingImagePaths,
        ocr_result_amount: null,
        ocr_result_date: null,
        ocr_result_raw: null,
        confirmed: false,
        confirmed_by: null,
        confirmed_at: null,
        note: note || null,
        uploaded_at: new Date().toISOString(),
        processed_at: null,
      };

      console.log(payload)
      if (editItem) {
        await ocrUploadApi.update(editItem.upload_id, payload);
        toast.success("Document updated successfully");
      } else {
        await ocrUploadApi.create(payload);
        toast.success("Document uploaded successfully");
      }

      await fetchUploads();

      setImageFiles([]);
      setImagePreviews([]);
      setExistingImagePaths([]);
      setSite("");
      setNote("");
      setCategory("");
      setEditItem(null);

    } catch (err) {
      console.error("Error saving upload:", err);
      toast.error("Failed to save document ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setExistingImagePaths(parseImagePaths(item.file_path ?? item.image_paths ?? item.image_path));
    setImageFiles([]);
    setImagePreviews([]);

    setCategory(
      item.category?.category_id != null
        ? String(item.category.category_id)
        : item.category_id != null
          ? String(item.category_id)
          : ""
    );
    setSite(
      item.site?.site_id != null
        ? String(item.site.site_id)
        : item.site_id != null
          ? String(item.site_id)
          : ""
    );
    setNote(item.note ?? "");
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleteLoading(true);

    try {
      await ocrUploadApi.delete(deleteId);

      setUploadedItems((prev) =>
        prev.filter((i) => i.upload_id !== deleteId)
      );

      if (editItem?.upload_id === deleteId) {
        setEditItem(null);
        setImageFiles([]);
        setImagePreviews([]);
        setExistingImagePaths([]);
        setSite("");
        setNote("");
        setCategory("");
      }

      toast.success("Document deleted successfully");

      setShowConfirm(false);
      setDeleteId(null);

    } catch (err) {
      console.error("Error deleting upload:", err);
      toast.error("Failed to delete document");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-100">
      <div className="bg-white px-5 py-4 border-b">
        <span className="font-semibold text-lg">Document Upload</span>
      </div>

      {pageLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <CircularProgress size={32} sx={{ color: "#16a34a" }} />
          <p className="text-sm text-gray-500">Loading data...</p>
        </div>
      ) : (
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          {(existingImagePaths.length > 0 || imagePreviews.length > 0) ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-2">
                {existingImagePaths.map((path) => (
                  <div key={path} className="relative w-full h-24 bg-gray-100 rounded-xl overflow-hidden">
                    <FileThumbnail src={path} name={path} />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(path)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {imagePreviews.map((url, idx) => (
                  <div key={url} className="relative w-full h-24 bg-gray-100 rounded-xl overflow-hidden">
                    <FileThumbnail src={url} name={imageFiles[idx]?.name} mimeType={imageFiles[idx]?.type} />
                    <button
                      type="button"
                      onClick={() => removeNewImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => libraryInputRef.current.click()}
                  className="w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 cursor-pointer transition-colors hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50"
                >
                  <Image size={22} />
                </button>
              </div>
              <Button
                buttonStyle="secondary"
                text="Remove All"
                onClick={() => {
                  setImageFiles([]);
                  setImagePreviews([]);
                  setExistingImagePaths([]);
                }}
                customButton="w-full"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <div className="bg-green-100 p-5 rounded-2xl">
                <Camera className="text-green-600" size={28} />
              </div>
              <Button
                buttonStyle="secondary"
                onClick={() => libraryInputRef.current.click()}
                customButton="flex items-center justify-center gap-2 w-full"
                text={
                  <span className="flex items-center gap-2 justify-center">
                    <Image size={18} />
                    Upload Files
                  </span>
                }
              />
            </div>
          )}
          <input
            ref={libraryInputRef}
            type="file"
            accept="image/*,application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            multiple
            onChange={handleImages}
            className="hidden"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div>
            <label className="text-sm text-gray-600 font-medium">Category *</label>
            <select
              className="w-full mt-1 border border-gray-200 rounded-xl p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 font-medium">Site *</label>
            <select
              className="w-full mt-1 border border-gray-200 rounded-xl p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={site}
              onChange={(e) => setSite(e.target.value)}
            >
              <option value="">Select Site</option>
              {siteOptions.map((s) => (
                <option key={s.site_id} value={s.site_id}>
                  {s.site_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 font-medium">Subcontractor</label>
            <select
              className="w-full mt-1 border border-gray-200 rounded-xl p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={subcontractorId != null ? String(subcontractorId) : ""}
              onChange={(e) => {
                const val = e.target.value;
                setSubcontractorId(val || null);
                const matched = subcontractorOptions.find(
                  (s) => String(s.subcontractor_id ?? s.id) === val
                );
                setSubcontractorName(matched?.company_name ?? matched?.name ?? null);
              }}
            >
              <option value="">Select Subcontractor</option>
              {subcontractorOptions.map((s) => (
                <option key={s.subcontractor_id ?? s.id} value={s.subcontractor_id ?? s.id}>
                  {s.company_name ?? s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 font-medium">Note</label>
            <textarea
              placeholder="Optional"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-xl p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {editItem && (
            <Button
              buttonStyle="secondary"
              text="Cancel Edit"
              onClick={() => {
                setEditItem(null);
                setImageFiles([]);
                setImagePreviews([]);
                setExistingImagePaths([]);
                setSite("");
                setNote("");
                setCategory("");
              }}
            />
          )}

          <Button
            buttonStyle="primary"
            customButton="flex items-center justify-center gap-2"
            onClick={handleUpload}
            loading={loading}
            text={
              <span className="flex items-center gap-2 justify-center">
                <Upload size={18} />
                {editItem ? "Update" : "Upload"}
              </span>
            }
          />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase">Uploaded (Today)</p>
          {uploadedItems.length === 0 && (
            <div className="text-sm text-gray-400">No documents uploaded yet</div>
          )}

          {sortUploadedItems(uploadedItems).map((item) => {
            const matchedCategory =
              item.category ??
              categories.find(
                (c) => String(c.category_id) === String(item.category_id)
              );
            const vendorLabel = item.subcontractor_name || item.vendor_name_raw || "Unknown vendor";

            return (
            <div key={item.document_id ?? item.upload_id} className="bg-white rounded-xl p-4 shadow-sm flex flex-col gap-1">
              <div className="flex justify-between items-start gap-2 flex-wrap">
                <p className="font-medium text-gray-700 min-w-0 break-words flex-1">
                  {vendorLabel} - {DOCUMENT_TYPE_LABELS[item.document_type] ?? item.document_type ?? matchedCategory?.category_name ?? "No Category"}{" "}
                  {item.uploaded_at
                    ? new Date(item.uploaded_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : ""}
                </p>
                <div className="flex gap-2 shrink-0">
                  <button
                    className="text-green-600 text-xs font-medium cursor-pointer"
                    onClick={() => {
                      const url = `${axiosApi.defaults.baseURL}invoice-documents/${item.document_id}`;
                      console.log("[OcrUpload] Review will call:", url);
                      navigate(`/ocr/${item.document_id}/review`);
                    }}
                  >
                    Review
                  </button>
                  {item.status !== "CONFIRMED" && (
                    <>
                      <button
                        className="text-blue-600 text-xs cursor-pointer"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 text-xs cursor-pointer"
                        onClick={() => {
                          setDeleteId(item.upload_id);
                          setShowConfirm(true);
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
              {formatYen(item.total_with_tax) && (
                <p className="text-sm text-gray-600">{formatYen(item.total_with_tax)}</p>
              )}
              {item.note && <p className="text-sm text-gray-500">{item.note}</p>}
              <p
                className={`text-sm ${
                  item.status === "CONFIRMED"
                    ? "text-green-600"
                    : item.status === "REJECTED" || item.status === "ERROR"
                      ? "text-red-600"
                      : "text-orange-500"
                }`}
              >
                Status: {item.status}
              </p>
            </div>
            );
          })}
        </div>
      </div>
      )}
      {showConfirm && (
        <ConfirmationModal
          message="Are you sure you want to delete this document?"
          onConfirm={handleDelete}
          onCancel={() => {
            if (!deleteLoading) {
              setShowConfirm(false);
              setDeleteId(null);
            }
          }}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}

export default OcrUpload;