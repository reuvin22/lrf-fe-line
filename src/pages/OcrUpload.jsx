import { useState, useRef } from "react";
import { Camera, Image, Upload, FileText } from "lucide-react";

function OcrUpload() {
  const [imagePreview, setImagePreview] = useState(null);

  const cameraInputRef = useRef(null);
  const libraryInputRef = useRef(null);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="max-w-md mx-auto">

      <div className="bg-green-600 text-white p-6">
        <h1 className="text-xl font-semibold">Document Upload</h1>
        <p className="text-sm opacity-90">
          Capture and upload receipts / invoices
        </p>
      </div>

      <div className="p-4 space-y-4">

        {/* CAMERA BOX */}
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">

          {imagePreview ? (
            <img
              src={imagePreview}
              alt="preview"
              className="mx-auto rounded-lg max-h-40"
            />
          ) : (
            <div className="flex flex-col items-center space-y-4">

              <div className="bg-gray-200 p-4 rounded-full">
                <Camera size={28} className="text-gray-600" />
              </div>

              <div className="flex gap-3">

                {/* TAKE PHOTO */}
                <button
                  onClick={() => cameraInputRef.current.click()}
                  className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
                >
                  <Camera size={16} />
                  Take Photo
                </button>

                {/* LIBRARY */}
                <button
                  onClick={() => libraryInputRef.current.click()}
                  className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
                >
                  <Image size={16} />
                  Library
                </button>

              </div>
            </div>
          )}

          {/* CAMERA INPUT */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImage}
            className="hidden"
          />

          <input
            ref={libraryInputRef}
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="hidden"
          />

        </div>

        <div>
          <label className="text-sm font-semibold">Category *</label>

          <select className="w-full border rounded-lg p-3 bg-white focus:outline-none focus:border-green-400">
            <option>Select category</option>
            <option>Transportation</option>
            <option>Meals</option>
            <option>Supplies</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold">Site *</label>

          <select className="w-full border rounded-lg p-3 bg-white focus:outline-none focus:border-green-400">
            <option>Select site</option>
            <option>Site A</option>
            <option>Site B</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold">Memo (Optional)</label>

          <textarea
            placeholder="Enter memo..."
            className="w-full border rounded-lg p-3 focus:outline-none focus:border-green-400"
          />
        </div>

        <button className="w-full flex items-center justify-center gap-2 bg-green-400 text-white py-3 rounded-xl font-semibold hover:bg-green-500">
          <Upload size={18} />
          Upload
        </button>

      </div>
    </div>
  );
}

export default OcrUpload;