import { useState } from "react";
import { Camera, Image, Upload, FileText } from "lucide-react";

function OcrUpload() {
  const [imagePreview, setImagePreview] = useState(null);

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

      <div className="max-w-md mx-auto p-4 space-y-4">
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
                <label className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-200">
                  <Camera size={16} />
                  Take Photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImage}
                    className="hidden"
                  />
                </label>
                <label className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-200">
                  <Image size={16} />
                  Library
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImage}
                    className="hidden"
                  />
                </label>

              </div>
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-semibold">
            Category *
          </label>

          <select className="w-full border rounded-lg p-3 bg-white focus:outline-none focus:border-green-400 cursor-pointer">
            <option>Select category</option>
            <option>Transportation</option>
            <option>Meals</option>
            <option>Supplies</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold">
            Site *
          </label>

          <select className="w-full border rounded-lg p-3 bg-white focus:outline-none focus:border-green-400 cursor-pointer">
            <option>Select site</option>
            <option>Site A</option>
            <option>Site B</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold">
            Memo (Optional)
          </label>

          <textarea
            placeholder="Enter memo..."
            className="w-full border rounded-lg p-3 focus:outline-none focus:border-green-400 cursor-pointer"
          />
        </div>

        <button className="w-full flex items-center justify-center gap-2 bg-green-400 text-white py-3 rounded-xl font-semibold hover:bg-green-500">
          <Upload size={18} />
          Upload
        </button>

        <div className="pt-4">
          <h3 className="text-sm font-semibold mb-2">
            Today's Upload
          </h3>

          <div className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-lg">
                <FileText size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  Transportation (Actual)
                </p>
                <p className="text-xs text-gray-500">
                  Site A · 16:20
                </p>
              </div>
            </div>

            <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">
              Processing
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default OcrUpload;