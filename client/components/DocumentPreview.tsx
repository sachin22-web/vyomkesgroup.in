import React from "react";
import { Button } from "./ui/button";
import { Img } from "./Img";
import { Eye, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export function isPdf(url?: string) {
  return !!url && /\.pdf($|\?)/i.test(url);
}

export function DocumentPreview({ url, className, alt }: { url?: string; className?: string; alt?: string }) {
  if (!url) return null;

  if (isPdf(url)) {
    return (
      <div className={cn("flex items-center justify-center h-24 w-24 rounded border bg-muted text-xs font-medium", className)}>
        <div className="flex gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="secondary" className="h-7 px-2">
              <Eye className="h-3.5 w-3.5 mr-1" /> View
            </Button>
          </a>
          <a href={url} download>
            <Button size="sm" variant="outline" className="h-7 px-2">
              <Download className="h-3.5 w-3.5 mr-1" /> Download
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative group h-24 w-24 rounded border overflow-hidden", className)}>
      <a href={url} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
        <Img src={url} alt={alt || "Document preview"} className="h-full w-full object-cover" />
      </a>
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="secondary" className="h-7 px-2">
            <Eye className="h-3.5 w-3.5 mr-1" /> View
          </Button>
        </a>
        <a href={url} download>
          <Button size="sm" variant="outline" className="h-7 px-2">
            <Download className="h-3.5 w-3.5 mr-1" /> Download
          </Button>
        </a>
      </div>
    </div>
  );
}
