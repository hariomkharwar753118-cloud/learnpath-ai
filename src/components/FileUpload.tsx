import { useRef, useState } from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileSelect: (file: File, content: string, type: string) => void;
}

const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (file: File) => {
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 20MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Process file based on type
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onFileSelect(file, base64, file.type);
      };
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf" || file.type.startsWith("text/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileSelect(file, content, file.type);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF, image, or text file",
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {selectedFile ? (
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-secondary rounded-xl sm:rounded-2xl border-2 border-primary/20 animate-fade-in">
          {selectedFile.type.startsWith("image/") ? (
            <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
          ) : (
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={removeFile}
            className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center transition-all ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-primary/5"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            accept="image/*,.pdf,.txt,.md"
            className="hidden"
          />
          <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs sm:text-sm text-foreground mb-1">Drop your file here or</p>
          <Button
            variant="link"
            onClick={() => fileInputRef.current?.click()}
            className="text-primary p-0 h-auto text-xs sm:text-sm"
          >
            browse files
          </Button>
          <p className="text-xs text-muted-foreground mt-2">PDF, images, or text files (max 20MB)</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
