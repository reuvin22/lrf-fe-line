import { useState, useRef } from "react";
import { Camera, Image } from "lucide-react";

function OcrUpload() {
  const [imagePreview, setImagePreview] = useState(null);

  const cameraRef = useRef(null);
  const libraryRef = useRef(null);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">

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
              <button
                onClick={() => cameraRef.current.click()}
                className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                <Camera size={16} />
                Take Photo
              </button>

              <button
                onClick={() => libraryRef.current.click()}
                className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                <Image size={16} />
                Library
              </button>

            </div>
          </div>
        )}

        <input
          ref={cameraRef}
          type="file"
          accept="image/*;capture=camera"
          capture="environment"
          onChange={handleImage}
          className="hidden"
        />

        <input
          ref={libraryRef}
          type="file"
          accept="image/*"
          onChange={handleImage}
          className="hidden"
        />

      </div>
    </div>
  );
}

export default OcrUpload;