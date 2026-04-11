import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import './PDFViewer.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const PDFViewer = ({ pdfUrl, targetPage = 1 }) => {
  const pageContainerRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(targetPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.4);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    pdfjsLib.getDocument(pdfUrl).promise.then(pdf => {
      if (cancelled) return;
      pdfDocRef.current = pdf;
      setNumPages(pdf.numPages);
      setLoading(false);
    }).catch(err => {
      if (!cancelled) {
        setError('Could not load PDF. Make sure the file is in frontend/public/');
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [pdfUrl]);

  useEffect(() => {
    if (targetPage && targetPage !== currentPage) setCurrentPage(targetPage);
  }, [targetPage]);

  const renderPage = useCallback(async (pageNum) => {
    if (!pdfDocRef.current || !pageContainerRef.current) return;
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch(e) {}
    }

    const container = pageContainerRef.current;
    container.innerHTML = '';

    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // Canvas layer
      const canvas = document.createElement('canvas');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Text layer div (for selection)
      const textLayerDiv = document.createElement('div');
      textLayerDiv.className = 'pdf-text-layer';
      textLayerDiv.style.width  = viewport.width + 'px';
      textLayerDiv.style.height = viewport.height + 'px';

      container.style.position = 'relative';
      container.style.width  = viewport.width + 'px';
      container.style.height = viewport.height + 'px';
      container.appendChild(canvas);
      container.appendChild(textLayerDiv);

      // Render canvas
      const renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport });
      renderTaskRef.current = renderTask;
      await renderTask.promise;

      // Render text layer for selection
      const textContent = await page.getTextContent();
      await pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport,
        textDivs: [],
      }).promise;

    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') console.error('Render error:', err);
    }
  }, [scale]);

  useEffect(() => {
    if (!loading && pdfDocRef.current) renderPage(currentPage);
  }, [currentPage, loading, renderPage]);

  if (error) return (
    <div className="pdf-error">
      <div className="pdf-error-icon">⚠️</div>
      <p className="pdf-error-msg">{error}</p>
    </div>
  );

  if (loading) return (
    <div className="pdf-loading">
      <div className="pdf-spinner"></div>
      <p>Loading PDF…</p>
    </div>
  );

  return (
    <div className="pdf-viewer-wrapper">
      <div className="pdf-toolbar">
        <div className="pdf-nav">
          <button className="pdf-btn" onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage<=1}>‹</button>
          <span className="pdf-page-info">Page <strong>{currentPage}</strong> of <strong>{numPages}</strong></span>
          <button className="pdf-btn" onClick={() => setCurrentPage(p => Math.min(numPages,p+1))} disabled={currentPage>=numPages}>›</button>
        </div>
        <div className="pdf-zoom">
          <button className="pdf-btn" onClick={() => setScale(s => Math.max(0.5,+(s-0.2).toFixed(1)))}>−</button>
          <span className="pdf-scale-label">{Math.round(scale*100)}%</span>
          <button className="pdf-btn" onClick={() => setScale(s => Math.min(3,+(s+0.2).toFixed(1)))}>+</button>
        </div>
      </div>
      <div className="pdf-canvas-scroll">
        <div className="pdf-canvas-container" ref={pageContainerRef} />
      </div>
    </div>
  );
};

export default PDFViewer;
