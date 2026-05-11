import { useState, useRef, useEffect } from "react";
import { Camera, Image, Upload } from "lucide-react";
import Button from "../components/Button";
import { attendanceApi, constructionSiteApi, ocrCategoriesApi, ocrUploadApi, siteAssignmentApi } from "../api/Api";
import ConfirmationModal from "../components/Modals/ConfirmationModal";
import { useAttendanceContext } from "../context/AttendanceContext";
import { useLocationContext } from "../context/LocationContext";
import { toast } from "react-toastify";

function OcrUpload() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [site, setSite] = useState("");
  const [allSites, setAllSites] = useState([]);
  const { sites, setSites } = useLocationContext();
  const [note, setNote] = useState("");
  const [uploadedItems, setUploadedItems] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const libraryInputRef = useRef(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { attendance, employee } = useAttendanceContext()
  const [removeImage, setRemoveImage] = useState(false);
  const [previousImagePath, setPreviousImagePath] = useState(null);
  const fetchCategories = async () => {
    try {
      const res = await ocrCategoriesApi.getAll();
      const data = res.data.data;
      setCategories(data);
    } catch (err) {
      console.error("Error fetching OCR categories:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchSites = async () => {
    try {
      const employeeId = employee?.employee_id ?? attendance?.employee_id;
      if (!employeeId) return;

      const [assignRes, sitesRes] = await Promise.all([
        siteAssignmentApi.getAll(),
        constructionSiteApi.getAll(),
      ]);

      const assignInner = assignRes.data?.data;
      const allAssignments = Array.isArray(assignInner)
        ? assignInner
        : Array.isArray(assignInner?.data)
          ? assignInner.data
          : [];

      const sitesInner = sitesRes.data?.data;
      const allSites = Array.isArray(sitesInner)
        ? sitesInner
        : Array.isArray(sitesInner?.data)
          ? sitesInner.data
          : [];

      const assignedSiteIds = allAssignments
        .filter(
          (v) =>
            v != null &&
            String(
              v.employee_id ?? v.employee?.employee_id ?? v.employee?.id
            ) === String(employeeId),
        )
        .map((v) => v.site_id ?? v.site?.site_id)
        .filter((id) => id != null);

      const matchedSites = allSites.filter((s) =>
        assignedSiteIds.some((id) => String(id) === String(s.site_id))
      );

      console.log("[OcrUpload] assigned site_ids", assignedSiteIds);
      console.log("[OcrUpload] matched construction sites", matchedSites);

      setAllSites(allSites);
      setSites(matchedSites);
    } catch (err) {
      console.error("Error fetching site assignments:", err);
    }
  };

  useEffect(() => {
    if (employee?.employee_id) {
      fetchSites();
    }
  }, [employee?.employee_id]);

  const fetchUploads = async () => {
    try {
      const res = await ocrUploadApi.getAll();
      setUploadedItems(res.data.data || []);
    } catch (err) {
      console.error("Error fetching OCR uploads:", err);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchUploads();
    };

    load();
  }, []);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveImage(false);
    }
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
      let imageBase64Payload;

      if (removeImage) {
        imageBase64Payload = "";
      } else if (imageFile) {
        imageBase64Payload = await convertToBase64(imageFile);
      } else {
        imageBase64Payload = undefined;
      }

      const fileName = previousImagePath
        ? previousImagePath.split('/').pop()
        : null;
      const selectedCategory = categories.find(c => String(c.category_id) === String(category));
      const selectedSite = sites.find(s => String(s.site_id) === String(site));

      const payload = {
        uploaded_by: attendance.employee_id,
        category_id: selectedCategory?.category_id ?? null,
        site_id: selectedSite?.site_id ?? null,
        subcontractor_id: null,
        attendance_id: attendance.attendance_id,
        upload_source: "LINE",
        status: "PENDING",
        image_path: imagePreview ? imagePreview : "",
        ocr_result_amount: null,
        ocr_result_date: null,
        ocr_result_raw: null,
        confirmed: false,
        confirmed_by: null,
        confirmed_at: null,
        note: note || null,
        uploaded_at: new Date().toISOString(),
        processed_at: null,
        previous_image_path: fileName
      };

      if (imageBase64Payload !== undefined) {
        payload.image_base64 = imageBase64Payload;
      }

      console.log(payload)
      if (editItem) {
        await ocrUploadApi.update(editItem.upload_id, payload);
        toast.success("Document updated successfully");
        setPreviousImagePath(null);
      } else {
        await ocrUploadApi.create(payload);
        toast.success("Document uploaded successfully");
      }

      await fetchUploads();

      setImageFile(null);
      setImagePreview(null);
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
    setRemoveImage(false);
    console.log(item.image_path)
    const fixedUrl = item.image_path?.replace(/\\\//g, "/");
    setImagePreview(fixedUrl);

    setPreviousImagePath(item.image_path);
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
    setImageFile(null);
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
        setImageFile(null);
        setImagePreview(null);
        setSite("");
        setNote("");
        setCategory("");
        setRemoveImage(false);
        setPreviousImagePath(null);
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

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          {imagePreview ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                <img
                  src={imagePreview}
                  alt="preview"
                  onError={(e) => {
                    e.target.src = "";
                  }}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <Button
                buttonStyle="secondary"
                text="Remove"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                  setRemoveImage(true);
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
                    Upload Image
                  </span>
                }
              />
            </div>
          )}
          <input
            ref={libraryInputRef}
            type="file"
            accept="image/*"
            onChange={handleImage}
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
                setImageFile(null);
                setImagePreview(null);
                setSite("");
                setNote("");
                setCategory("");
                setRemoveImage(false);
                setPreviousImagePath(null);
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

          {uploadedItems.map((item) => {
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
              <div className="flex justify-between items-center">
                <p className="font-medium text-gray-700">
                  {matchedCategory?.category_name || "No Category"} - {matchedSite?.site_name || "No Site"}{" "}
                  {item.uploaded_at
                    ? new Date(item.uploaded_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : ""}
                </p>
                <div className="flex gap-2">
                  <button
                    className="text-blue-600 text-xs"
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 text-xs"
                    onClick={() => {
                      setDeleteId(item.upload_id);
                      setShowConfirm(true);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              {item.note && <p className="text-sm text-gray-500">{item.note}</p>}
              <p
                className={`text-sm ${
                  item.status === "COMPLETED"
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