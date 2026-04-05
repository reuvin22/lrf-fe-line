import { useState, useRef, useEffect } from "react";
import { Camera, Image, Upload } from "lucide-react";
import Button from "../components/Button";
import { ocrCategoriesApi, ocrUploadApi, siteAssignmentApi } from "../api/Api";
import { loggedInUser } from "../utils/loggedInUser";

function OcrUpload() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [site, setSite] = useState("");
  const [sites, setSites] = useState([]);
  const [note, setNote] = useState("");
  const [uploadedItems, setUploadedItems] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const libraryInputRef = useRef(null);

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

  // Fetch sites assigned to logged-in user
  const fetchSites = async () => {
    try {
      const res = await siteAssignmentApi.getAll();
      const allAssignments = res.data.data;

      const userSites = allAssignments
        .filter((assignment) => assignment.employee.id === loggedInUser.employee_id)
        .map((assignment) => assignment.site);

      setSites(userSites);
      console.log("User's assigned sites:", userSites);
    } catch (err) {
      console.error("Error fetching site assignments:", err);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchUploads = async () => {
    try {
      const res = await ocrUploadApi.getAll();
      setUploadedItems(res.data.data || []);
    } catch (err) {
      console.error("Error fetching OCR uploads:", err);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  // Handle image selection
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
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

  const handleUpload = async () => {
    setLoading(true);

    try {
      let base64Image = null;

      if (imageFile) {
        base64Image = await convertToBase64(imageFile);
      }

      const payload = {
        uploaded_by: loggedInUser.employee_id,
        category_id: category ? parseInt(category) : null,
        site_id: site ? parseInt(site) : null,
        subcontractor_id: null,
        attendance_id: 6,
        upload_source: "LINE",
        status: "PENDING",
        image_path: null,
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

      if (editItem) {
        // Use the correct ID field
        await ocrUploadApi.update(editItem.upload_id, payload);
      } else {
        await ocrUploadApi.create(payload);
      }

      fetchUploads();

      // Reset form
      setImageFile(null);
      setImagePreview(null);
      setSite("");
      setNote("");
      setCategory("");
      setEditItem(null);

      console.log("Upload successful!");
    } catch (err) {
      console.error("Error saving upload:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setImagePreview(item.image_path);
    setCategory(item.category.category_id);
    setSite(item.site.site_id);
    setNote(item.note);
    setImageFile(null);
  };

  const handleDelete = async (upload_id) => {
    try {
      await ocrUploadApi.delete(upload_id);
      setUploadedItems((prev) => prev.filter((i) => i.upload_id !== upload_id));
    } catch (err) {
      console.error("Error deleting upload:", err);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white px-5 py-4 border-b">
        <span className="font-semibold text-lg">Document Upload</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          {imagePreview ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                <img
                  src={imagePreview}
                  alt="preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <Button
                buttonStyle="secondary"
                text="Remove"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
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

        {/* Form */}
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

          {uploadedItems.map((item) => (
            <div key={item.upload_id} className="bg-white rounded-xl p-4 shadow-sm flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <p className="font-medium text-gray-700">
                  {item.category.category_name} {item.site.site_name}{" "}
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
                    onClick={() => handleDelete(item.upload_id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              {item.note && <p className="text-sm text-gray-500">{item.note}</p>}
              <p className="text-sm text-orange-500">Status: {item.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OcrUpload;