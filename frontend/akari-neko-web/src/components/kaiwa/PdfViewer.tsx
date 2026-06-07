"use client";

import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  PDFDocumentProxy,
  PDFPageProxy,
  RenderTask,
} from "pdfjs-dist/types/src/display/api";

type PdfViewerProps = {
  title: string;
  url: string;
  openUrl: string;
};

const MIN_SCALE = 0.45;
const MAX_SCALE = 2.25;
const SCALE_STEP = 0.25;
const VIEWER_PADDING = 24;

let pdfjsPromise: Promise<typeof import("pdfjs-dist/webpack.mjs")> | null = null;

function loadPdfJs() {
  pdfjsPromise ??= import("pdfjs-dist/webpack.mjs");
  return pdfjsPromise;
}

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function calculateFitScale(pageWidth: number, availableWidth: number) {
  if (!pageWidth || !availableWidth) {
    return 1;
  }

  return clampScale((availableWidth - VIEWER_PADDING) / pageWidth);
}

export function PdfViewer({ title, url, openUrl }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [hasManualScale, setHasManualScale] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const viewer = viewerRef.current;

    if (!viewer) {
      return;
    }

    const updateWidth = () => {
      const nextWidth = viewer.clientWidth;

      setAvailableWidth((currentWidth) =>
        Math.abs(currentWidth - nextWidth) < 2 ? currentWidth : nextWidth,
      );
    };
    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(viewer);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;

    queueMicrotask(() => {
      if (!isMounted) {
        return;
      }

      setPdf(null);
      setPage(1);
      setPageCount(0);
      setScale(1);
      setHasManualScale(false);
      setError("");
      setIsLoading(true);
    });

    loadPdfJs()
      .then((pdfjs) =>
        pdfjs.getDocument({
          url,
          verbosity: pdfjs.VerbosityLevel.ERRORS,
        }).promise,
      )
      .then((document) => {
        if (!isMounted) {
          return;
        }

        setPdf(document);
        setPageCount(document.numPages);
      })
      .catch(() => {
        if (isMounted) {
          setError("Không thể hiển thị PDF trong trang. Hãy mở PDF ở tab mới.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };
  }, [url]);

  useEffect(() => {
    if (!pdf) {
      return;
    }

    let isMounted = true;
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    setIsRendering(true);
    renderTaskRef.current?.cancel();
    renderTaskRef.current = null;

    pdf
      .getPage(page)
      .then((pdfPage: PDFPageProxy) => {
        if (!isMounted) {
          return;
        }

        const baseViewport = pdfPage.getViewport({ scale: 1 });
        const renderScale =
          hasManualScale || availableWidth <= 0
            ? scale
            : calculateFitScale(baseViewport.width, availableWidth);
        const viewport = pdfPage.getViewport({ scale: renderScale });
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Canvas context is unavailable.");
        }

        if (!hasManualScale && renderScale !== scale) {
          setScale(renderScale);
        }

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

        const renderTask = pdfPage.render({
          canvas,
          canvasContext: context,
          viewport,
        });

        renderTaskRef.current = renderTask;
        return renderTask.promise;
      })
      .catch((renderError: unknown) => {
        if (
          isMounted &&
          renderError instanceof Error &&
          renderError.name !== "RenderingCancelledException"
        ) {
          setError("Không thể render trang PDF này. Hãy thử mở ở tab mới.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsRendering(false);
        }
      });

    return () => {
      isMounted = false;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };
  }, [availableWidth, hasManualScale, page, pdf, scale]);

  const canGoPrevious = page > 1;
  const canGoNext = pageCount > 0 && page < pageCount;
  const goPrevious = () => setPage((current) => Math.max(1, current - 1));
  const goNext = () => setPage((current) => Math.min(pageCount, current + 1));
  const zoomOut = () => {
    setHasManualScale(true);
    setScale((current) => clampScale(current - SCALE_STEP));
  };
  const zoomIn = () => {
    setHasManualScale(true);
    setScale((current) => clampScale(current + SCALE_STEP));
  };
  const resetFit = () => setHasManualScale(false);

  return (
    <div className="overflow-hidden rounded-[18px] border border-pink-100 bg-slate-50">
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-pink-100 bg-white/95 px-3 py-2 backdrop-blur">
        <div className="flex min-h-10 items-center gap-2">
          <button
            type="button"
            onClick={goPrevious}
            disabled={!canGoPrevious || isLoading}
            className="grid h-10 w-10 place-items-center rounded-xl border border-pink-100 bg-white text-slate-600 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Trang trước"
            title="Trang trước"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-20 text-center text-sm font-black text-slate-700">
            {pageCount > 0 ? `${page}/${pageCount}` : "PDF"}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext || isLoading}
            className="grid h-10 w-10 place-items-center rounded-xl border border-pink-100 bg-white text-slate-600 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Trang sau"
            title="Trang sau"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex min-h-10 items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE || isLoading}
            className="grid h-10 w-10 place-items-center rounded-xl border border-pink-100 bg-white text-slate-600 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Thu nhỏ"
            title="Thu nhỏ"
          >
            <ZoomOut size={18} />
          </button>
          <span className="min-w-14 text-center text-sm font-black text-slate-700">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE || isLoading}
            className="grid h-10 w-10 place-items-center rounded-xl border border-pink-100 bg-white text-slate-600 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Phóng to"
            title="Phóng to"
          >
            <ZoomIn size={18} />
          </button>
          <button
            type="button"
            onClick={resetFit}
            disabled={!hasManualScale || isLoading}
            className="grid h-10 w-10 place-items-center rounded-xl border border-pink-100 bg-white text-slate-600 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Vá» cháº¿ Ä‘á»™ vá»«a khung"
            title="Vá» cháº¿ Ä‘á»™ vá»«a khung"
          >
            <RotateCcw size={18} />
          </button>
          <a
            href={openUrl}
            target="_blank"
            rel="noreferrer"
            className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500 text-white shadow-[0_12px_24px_rgba(139,92,246,0.20)] transition hover:bg-violet-600"
            aria-label="Mở tab mới"
            title="Mở tab mới"
          >
            <ExternalLink size={18} />
          </a>
        </div>
      </div>

      <div
        ref={viewerRef}
        className="relative grid h-[min(720px,calc(100svh-220px))] min-h-[420px] place-items-start overflow-auto bg-slate-100 p-3 md:min-h-[520px] lg:h-auto lg:min-h-[620px]"
      >
        {(isLoading || isRendering) && (
          <div className="absolute inset-x-0 top-4 z-10 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-sm font-black text-slate-600 shadow-sm">
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RotateCw size={16} className="animate-spin" />}
              {isLoading ? "Đang tải PDF" : "Đang render"}
            </span>
          </div>
        )}

        {error ? (
          <div className="grid min-h-[520px] w-full place-items-center p-6 text-center md:min-h-[620px]">
            <div>
              <p className="text-base font-black text-slate-800">{error}</p>
              <a
                href={openUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-2xl bg-violet-500 px-4 py-2 text-sm font-black text-white transition hover:bg-violet-600"
              >
                <ExternalLink size={16} />
                Mở tab mới
              </a>
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            aria-label={title}
            className="mx-auto max-w-full bg-white shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
          />
        )}

        {!error && pageCount > 1 ? (
          <div className="sticky bottom-3 z-10 mt-3 flex w-full justify-center">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/95 p-1 shadow-[0_12px_28px_rgba(15,23,42,0.22)] backdrop-blur">
              <button
                type="button"
                onClick={goPrevious}
                disabled={!canGoPrevious || isLoading}
                className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-900 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                aria-label="Trang trÆ°á»›c"
                title="Trang trÆ°á»›c"
              >
                <ChevronLeft size={22} strokeWidth={2.8} />
              </button>
              <span className="min-w-16 text-center text-sm font-black text-white">
                {page}/{pageCount}
              </span>
              <button
                type="button"
                onClick={goNext}
                disabled={!canGoNext || isLoading}
                className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-900 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                aria-label="Trang sau"
                title="Trang sau"
              >
                <ChevronRight size={22} strokeWidth={2.8} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
