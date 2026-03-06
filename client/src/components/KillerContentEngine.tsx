import { useState, useRef } from "react";
import { Upload, FileText, ImageIcon, Loader2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function KillerContentEngine() {
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [statusText, setStatusText] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (images.length + newFiles.length > 3) {
        toast({
          title: "Limit exceeded",
          description: "You can only upload up to 3 images.",
          variant: "destructive",
        });
        return;
      }
      setImages([...images, ...newFiles]);
    }
  };

  const handleTranscriptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setTranscriptFile(e.target.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!transcriptFile) {
      toast({
        title: "Missing input",
        description: "Please upload a transcript file.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setStatusText("Analyzing transcript...");
    setPdfBlob(null);

    try {
      const formData = new FormData();
      formData.append("transcriptFile", transcriptFile);
      images.forEach((img) => formData.append("images", img));

      if (images.length > 0) {
        setStatusText("Processing images...");
      }

      const response = await fetch("/api/generate-content", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Generation failed");
      }

      setStatusText("Building PDF...");
      const blob = await response.blob();
      setPdfBlob(blob);

      toast({
        title: "Content Generated",
        description: "Your Killer Content PDF is ready for download.",
      });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setStatusText("");
    }
  };

  const handleDownload = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "killer-content-proposition.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setPdfBlob(null);
    setTranscriptFile(null);
    setImages([]);
  };

  return (
    <div className="killer-engine-container relative">
      {pdfBlob && (
        <div className="engine-success-toast absolute -top-12 right-0 flex items-center gap-2 bg-green-500/20 border border-green-500/50 text-green-400 px-3 py-2 rounded text-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span>BRAND SYNTHESIS COMPLETE</span>
        </div>
      )}
      
      <div className="killer-engine-inline">
        <div className="engine-pre-header">Test drive it yourself</div>
        <div className="engine-header">
          <h3 className="engine-title">KILLER CONTENT ENGINE <span className="text-cyan-500">v1.0</span></h3>
          <p className="engine-subtitle">Upload a transcript of a spoken overview of your product or offering and three images to represent the brand and idea.</p>
        </div>

        <div className="engine-body">
          <div className="input-group">
            <label className="input-label">
              <FileText size={12} /> TRANSCRIPT FILE (.txt)
            </label>
            <div 
              className="engine-file-dropzone"
              onClick={() => !isProcessing && transcriptInputRef.current?.click()}
              data-testid="input-transcript-dropzone"
            >
              {transcriptFile ? (
                <div className="file-info">
                  <FileText size={16} className="text-cyan-500" />
                  <span className="truncate flex-1">{transcriptFile.name}</span>
                  <button 
                    className="file-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTranscriptFile(null);
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="file-placeholder">
                  <Upload size={14} />
                  <span>Upload .txt</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              className="hidden" 
              ref={transcriptInputRef} 
              accept=".txt"
              onChange={handleTranscriptUpload}
              disabled={isProcessing}
            />
          </div>

          <div className="input-group">
            <label className="input-label">
              <ImageIcon size={12} /> IMAGES (MAX 3)
            </label>
            <div className="image-grid-inline">
              {images.map((img, i) => (
                <div key={i} className="img-preview-box">
                  <img src={URL.createObjectURL(img)} alt="preview" />
                  <button 
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="img-remove-btn"
                    disabled={isProcessing}
                  >
                    ×
                  </button>
                </div>
              ))}
              {images.length < 3 && !isProcessing && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="img-add-btn"
                  data-testid="button-upload-image"
                >
                  <Upload size={14} />
                </button>
              )}
            </div>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept="image/*" 
              multiple 
              onChange={handleImageUpload}
            />
          </div>

          {isProcessing && statusText && (
            <div className="engine-status" data-testid="text-status">
              <span className="status-dot" />
              {statusText}
            </div>
          )}

          {!pdfBlob ? (
            <Button 
              onClick={handleProcess}
              disabled={isProcessing}
              className="engine-submit-btn"
              data-testid="button-generate-pdf"
            >
              {isProcessing ? (
                <><Loader2 className="animate-spin" size={16} /> GENERATING...</>
              ) : (
                "PRODUCE PDF"
              )}
            </Button>
          ) : (
            <div className="engine-result-btns">
              <Button 
                onClick={handleDownload}
                className="engine-download-btn"
                data-testid="button-download-pdf"
              >
                <FileDown size={16} /> DOWNLOAD PDF
              </Button>
              <button 
                onClick={handleReset}
                className="engine-reset-btn"
                data-testid="button-reset"
              >
                Generate another
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
