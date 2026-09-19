import { FileText, FileSpreadsheet, File as FileIcon } from "lucide-react";
import { getFileKind } from "../utils/getFileKind";

const KIND_CONFIG = {
  pdf: { icon: FileText, label: "PDF", color: "text-red-500" },
  word: { icon: FileText, label: "DOC", color: "text-blue-500" },
  excel: { icon: FileSpreadsheet, label: "XLSX", color: "text-green-600" },
  csv: { icon: FileSpreadsheet, label: "CSV", color: "text-green-600" },
  other: { icon: FileIcon, label: "FILE", color: "text-gray-400" },
};

function FileThumbnail({ src, name, mimeType, imgClassName = "" }) {
  const kind = getFileKind(name, mimeType);

  if (kind === "image") {
    return <img src={src} alt={name || "file"} className={`w-full h-full object-cover ${imgClassName}`} />;
  }

  const { icon: Icon, label, color } = KIND_CONFIG[kind];
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gray-100">
      <Icon size={28} className={color} />
      <span className="text-[10px] font-medium text-gray-500">{label}</span>
    </div>
  );
}

export default FileThumbnail;
