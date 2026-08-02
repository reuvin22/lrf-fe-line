import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Image, Upload } from "lucide-react";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "../components/Button";
import FileThumbnail from "../components/FileThumbnail";
import { ocrCategoriesApi, ocrUploadApi, siteAssignmentApi, subContractorWorkerApi } from "../api/Api";
import axiosApi from "../api/Axios";
import ConfirmationModal from "../components/Modals/ConfirmationModal";
import { useAttendanceContext } from "../context/AttendanceContext";
import { useLocationContext } from "../context/LocationContext";
import { parseImagePaths } from "../utils/parseImagePaths";
import { toast } from "react-toastify";

const STATUS_ORDER = ["PENDING", "PROCESSING", "COMPLETED", "CONFIRMED", "REJECTED", "ERROR"];

const sortUploadedItems = (items) =>
  [...items].sort((a, b) => {
    const rankA = STATUS_ORDER.indexOf(a.status);
    const rankB = STATUS_ORDER.indexOf(b.status);
    const orderA = rankA === -1 ? STATUS_ORDER.length : rankA;
    const orderB = rankB === -1 ? STATUS_ORDER.length : rankB;
    if (orderA !== orderB) return orderA - orderB;

    const dateA = a.status === "PENDING" ? (a.created_at ?? a.uploaded_at) : (a.updated_at ?? a.uploaded_at);
    const dateB = b.status === "PENDING" ? (b.created_at ?? b.uploaded_at) : (b.updated_at ?? b.uploaded_at);
    return new Date(dateB) - new Date(dateA);
  });

function OcrUpload() {
  const navigate = useNavigate();
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImagePaths, setExistingImagePaths] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [site, setSite] = useState("");
  const [allSites, setAllSites] = useState([]);
  const { sites, setSites } = useLocationContext();
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
  const fetchUploads = async () => {
    try {
      const res = await ocrUploadApi.getAll();
      setUploadedItems(res.data.data || []);
    } catch (err) {
      console.error("Error fetching OCR uploads:", err);
    }
  };

  // Load categories and uploads immediately on mount — no employee needed
  useEffect(() => {
    const load = async () => {
      setPageLoading(true);
      try {
        const [catRes, uploadsRes] = await Promise.all([
          ocrCategoriesApi.getAll(),
          ocrUploadApi.getAll(),
        ]);
        const catInner = catRes.data?.data;
        setCategories(Array.isArray(catInner) ? catInner : Array.isArray(catInner?.data) ? catInner.data : []);
        setUploadedItems(uploadsRes.data?.data || []);
      } catch (err) {
        console.error("[OcrUpload] Failed to load categories/uploads:", err);
        toast.error("Failed to load data");
      } finally {
        setPageLoading(false);
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
        setSites(matchedSites);
        setAllSites(matchedSites);

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
      const selectedSite = sites.find(s => String(s.site_id) === String(site));

      const payload = {
        uploaded_by: attendance.employee_id,
        category_id: selectedCategory?.category_id ?? null,
        site_id: selectedSite?.site_id ?? null,
        site_name: selectedSite?.site_name ?? null,
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
    setExistingImagePaths(parseImagePaths(item.image_paths ?? item.image_path));
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
              {sites.map((s) => (
                <option key={s.site_id} value={s.site_id}>
                  {s.site_name}
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
            const matchedSite =
              item.site ??
              allSites.find(
                (s) => String(s.site_id) === String(item.site_id)
              );

            return (
            <div key={item.upload_id} className="bg-white rounded-xl p-4 shadow-sm flex flex-col gap-1">
              <div className="flex justify-between items-start gap-2 flex-wrap">
                <p className="font-medium text-gray-700 min-w-0 break-words flex-1">
                  {matchedCategory?.category_name || "No Category"} - {matchedSite?.site_name || "No Site"}{" "}
                  {item.uploaded_at
                    ? new Date(item.uploaded_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : ""}
                </p>
                <div className="flex gap-2 shrink-0">
                  {item.status !== "CONFIRMED" && (
                    <button
                      className="text-green-600 text-xs font-medium cursor-pointer"
                      onClick={() => {
                        if (!item.invoice_document_id) {
                          toast.error("This document isn't ready for review yet");
                          return;
                        }
                        const url = `${axiosApi.defaults.baseURL}invoice-documents/${item.invoice_document_id}`;
                        console.log("[OcrUpload] Review will call:", url);
                        navigate(`/ocr/${item.invoice_document_id}/review`);
                      }}
                    >
                      Review
                    </button>
                  )}
                  {item.status !== "COMPLETED" && (
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
              {item.note && <p className="text-sm text-gray-500">{item.note}</p>}
              <p
                className={`text-sm ${
                  item.status === "COMPLETED" || item.status === "CONFIRMED"
                    ? "text-green-600"
                    : item.status === "REJECTED" || item.status === "ERROR"
                      ? "text-red-600"
                      : item.status === "PROCESSING"
                        ? "text-blue-600"
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