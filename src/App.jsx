import React, { useState, useMemo, useRef } from 'react';
import {
  Settings, LayoutGrid, Brush, LayoutList, AlertCircle,
  CheckCircle2, Download, Save, FolderOpen, Moon, Sun,
  Eye, EyeOff, Palette, FileImage, Wand2, Crosshair,
  ChevronDown, FileText
} from 'lucide-react';


export default function App() {
  // --- STATE ---

  // Surface Details
  const [surfaceType, setSurfaceType] = useState('Paper / sketchbook');
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(20);
  const [unit, setUnit] = useState('cm');


  // Grid Configuration
  const [wedgeDivisions, setWedgeDivisions] = useState(12);
  const [rings, setRings] = useState(6);
  const [spacingMode, setSpacingMode] = useState('even'); // 'even' or 'golden'


  // Design Technique & Tool
  const [technique, setTechnique] = useState('dot');
  const [dotSize, setDotSize] = useState(3); // in mm
  const [showDots, setShowDots] = useState(true);
  const [isStaggered, setIsStaggered] = useState(false);
  const [previewDarkMode, setPreviewDarkMode] = useState(false);
  const [showCrosshairs, setShowCrosshairs] = useState(true);


  // Ring Planning
  const [ringPlanMode, setRingPlanMode] = useState('same');
  const [elementsPerRing, setElementsPerRing] = useState(12);
  const [customRingsText, setCustomRingsText] = useState('ring 1: 4 #ef4444\nring 2: 6 #f59e0b\nring 3: 12 #3b82f6\nring 4: 12');

  // Interactive Hovering & Menus
  const [hoveredRing, setHoveredRing] = useState(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);


  const svgRef = useRef(null);


  // --- DERIVED VALUES & CALCULATIONS ---
  const parsedWidth = Math.max(0.1, parseFloat(width) || 0.1);
  const parsedHeight = Math.max(0.1, parseFloat(height) || 0.1);
  const parsedWedges = Math.max(1, parseInt(wedgeDivisions) || 1);
  const parsedRings = Math.max(1, parseInt(rings) || 1);
  const parsedElements = Math.max(1, parseInt(elementsPerRing) || 1);


  const wedgeAngle = (360 / parsedWedges).toFixed(1);
  const surfaceRadius = 0.5 * Math.min(parsedWidth, parsedHeight);
  const elementName = technique === 'dot' ? 'dot' : 'petal';


  // Tool conversion to surface unit (from mm)
  const dotSizeInUnits = unit === 'cm' ? dotSize / 10 : dotSize / 25.4;


  // SVG Drawing Values
  // Increased canvas size and shifted center to allow padding (bleed) for outer dots
  const cx = 210;
  const cy = 210;
  const maxR = 190;

  // Real-world scale factor for True-to-Scale Dot Preview
  const scaleFactor = maxR / surfaceRadius; // pixels per real-world unit
  const trueDotRadiusPixels = (dotSizeInUnits / 2) * scaleFactor;


  // Calculate Ring Radii (Normalized 0 to 1)
  const ringRadii = useMemo(() => {
    let radii = [];
    if (spacingMode === 'even') {
      for (let i = 1; i <= parsedRings; i++) {
        radii.push(i / parsedRings);
      }
    } else {
      let current = 0;
      let step = 1;
      let steps = [];
      for (let i = 0; i < parsedRings; i++) {
        current += step;
        steps.push(current);
        step *= 1.618; // Golden ratio multiplier
      }
      const max = steps[steps.length - 1];
      radii = steps.map(s => s / max);
    }
    return radii;
  }, [parsedRings, spacingMode]);


  // --- HELPERS ---
  const ordinalSuffix = (i) => {
    const j = i % 10, k = i % 100;
    if (j === 1 && k !== 11) return i + "st";
    if (j === 2 && k !== 12) return i + "nd";
    if (j === 3 && k !== 13) return i + "rd";
    return i + "th";
  };


  const parseCustomRings = (text) => {
    return text.split('\n').map(line => {
      if (!line.trim()) return null;
      // Match: "ring 1: 8" OR "1 - 8 #ff0000" OR "ring 2=12 blue"
      const match = line.match(/(?:ring)?\s*(\d+)\s*[:=-]\s*(\d+)(?:\s+([#a-zA-Z0-9]+))?/i);
      if (match) {
        return {
          ring: parseInt(match[1], 10),
          count: parseInt(match[2], 10),
          color: match[3] || null,
          original: line,
          valid: true
        };
      }
      return { original: line, valid: false };
    }).filter(Boolean);
  };


  const parsedCustom = useMemo(() => parseCustomRings(customRingsText), [customRingsText]);


  const getElementsForRing = (ringIndex) => {
    if (ringPlanMode === 'same') {
      return { count: parsedElements, color: '#6366f1' }; // Indigo default
    }
    const rule = parsedCustom.find(r => r.ring === ringIndex + 1);
    return rule ? { count: rule.count, color: rule.color || '#6366f1' } : { count: 0, color: 'transparent' };
  };


  // Check for physical overlapping
  const checkOverlap = (ringIndex, count) => {
    const realRadius = surfaceRadius * ringRadii[ringIndex];
    const circumference = 2 * Math.PI * realRadius;
    const maxDots = Math.floor(circumference / dotSizeInUnits);
    return count > maxDots ? maxDots : false;
  };


  // --- ACTIONS ---
  const saveDesign = () => {
    const config = { surfaceType, width, height, unit, wedgeDivisions, rings, spacingMode, technique, dotSize, showDots, isStaggered, previewDarkMode, showCrosshairs, ringPlanMode, elementsPerRing, customRingsText };
    localStorage.setItem('mandala_planner_save', JSON.stringify(config));
    alert('Design saved to browser storage!');
  };


  const loadDesign = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('mandala_planner_save'));
      if (saved) {
        setSurfaceType(saved.surfaceType ?? 'Paper / sketchbook');
        setWidth(saved.width ?? 20);
        setHeight(saved.height ?? 20);
        setUnit(saved.unit ?? 'cm');
        setWedgeDivisions(saved.wedgeDivisions ?? 12);
        setRings(saved.rings ?? 6);
        setSpacingMode(saved.spacingMode ?? 'even');
        setTechnique(saved.technique ?? 'dot');
        setDotSize(saved.dotSize ?? 3);
        setShowDots(saved.showDots ?? true);
        setIsStaggered(saved.isStaggered ?? false);
        setPreviewDarkMode(saved.previewDarkMode ?? false);
        setShowCrosshairs(saved.showCrosshairs ?? true);
        setRingPlanMode(saved.ringPlanMode ?? 'same');
        setElementsPerRing(saved.elementsPerRing ?? 12);
        setCustomRingsText(saved.customRingsText ?? '');
      } else {
        alert('No saved design found.');
      }
    } catch (e) {
      alert('Failed to load design.');
    }
  };


  const exportPNG = () => {
    setExportMenuOpen(false);
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 1000; // High-res export
      canvas.height = 1000;
      if (previewDarkMode) {
        ctx.fillStyle = '#0f172a'; // slate-900 background for dark mode
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement('a');
      a.download = 'mandala-plan.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };


  const exportSVG = () => {
    setExportMenuOpen(false);
    if (!svgRef.current) return;
    // Clone the SVG so we don't manipulate the DOM element directly
    const clone = svgRef.current.cloneNode(true);

    // Clean up classes for cleaner export
    clone.removeAttribute('class');

    // Set absolute real-world dimensions to guarantee 1:1 scale printing!
    clone.setAttribute('width', `${parsedWidth}${unit}`);
    clone.setAttribute('height', `${parsedHeight}${unit}`);

    const svgData = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mandala-grid-print-scale.svg';
    a.click();
  };


  const exportPDF = () => {
    setExportMenuOpen(false);
    // Triggers the browser's native print-to-PDF feature,
    // layout is preserved by CSS media print rules
    window.print();
  };


  const generateTemplate = () => {
    let template = "";
    // Creates a growing progressive sequence based on wedges
    for (let i = 0; i < parsedRings; i++) {
      const count = parsedWedges * (i + 1);
      template += `ring ${i + 1}: ${count}\n`;
    }
    setCustomRingsText(template.trim());
  };


  // --- THEME COLORS ---
  const strokeColor = previewDarkMode ? '#334155' : '#cbd5e1';
  const wedgeColor = previewDarkMode ? '#1e293b' : '#e2e8f0';
  const highlightColor = previewDarkMode ? '#fbbf24' : '#f59e0b'; // Amber for hovering


  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER & ACTIONS */}
        <header className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mandala Grid & Dot Planner</h1>
            <p className="text-slate-500 mt-2">Design, calculate, preview, and export your sacred geometry.</p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              onClick={loadDesign}
              title="Load your last saved design from browser storage"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              <FolderOpen className="w-4 h-4" /> Load
            </button>
            <button
              onClick={saveDesign}
              title="Save your current setup so you can load it later"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" /> Save
            </button>

            {/* EXPORT DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                onBlur={() => setTimeout(() => setExportMenuOpen(false), 200)}
                title="Open export options to download or print your design"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
              >
                Export <ChevronDown className="w-4 h-4" />
              </button>

              {exportMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-10 flex flex-col py-1 overflow-hidden">
                  <button onClick={exportPNG} title="Download the live preview grid as a high quality PNG image" className="px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700">
                    <FileImage className="w-4 h-4 text-indigo-500" />
                    <div>
                      <div className="font-semibold text-slate-900">Image (PNG)</div>
                      <div className="text-xs text-slate-500">For sharing or viewing</div>
                    </div>
                  </button>
                  <button onClick={exportSVG} title="Download a vector file mathematically sized to your real-world dimensions" className="px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700">
                    <Download className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div className="font-semibold text-slate-900">Print Scale (SVG)</div>
                      <div className="text-xs text-slate-500">1:1 true scale for tracing</div>
                    </div>
                  </button>
                  <button onClick={exportPDF} title="Save this entire web page, including the instructions and preview" className="px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700 border-t border-slate-100">
                    <FileText className="w-4 h-4 text-rose-500" />
                    <div>
                      <div className="font-semibold text-slate-900">Complete Page (PDF)</div>
                      <div className="text-xs text-slate-500">Includes plans & instructions</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>


        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT PANEL: Form Inputs */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 print:hidden">

            {/* 1. Surface Details */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" /> 1. Surface
              </h3>
              <div>
                <select
                  value={surfaceType}
                  onChange={(e) => setSurfaceType(e.target.value)}
                  title="What kind of object are you painting on?"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                >
                  <option>Paper / sketchbook</option>
                  <option>MDF/wood board</option>
                  <option>Rock / round object</option>
                  <option>Wall / large mural</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Width</label>
                  <input type="number" min="0.1" step="0.1" value={width} onChange={(e) => setWidth(e.target.value)} title="Physical width of your surface" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Height</label>
                  <input type="number" min="0.1" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} title="Physical height of your surface" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Unit</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)} title="Measurement metric" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                    <option value="cm">cm</option>
                    <option value="inches">in</option>
                  </select>
                </div>
              </div>
            </div>


            {/* 2. Grid & Sacred Geometry */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4" /> 2. Grid Geometry
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Wedge Divisions</label>
                  <input type="number" min="1" value={wedgeDivisions} onChange={(e) => setWedgeDivisions(e.target.value)} title="How many pie slices the grid is cut into" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Number of Rings</label>
                  <input type="number" min="1" value={rings} onChange={(e) => setRings(e.target.value)} title="How many concentric circles expand outwards" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Ring Spacing Mode</label>
                <select value={spacingMode} onChange={(e) => setSpacingMode(e.target.value)} title="Choose whether rings are equally spaced or expand using sacred geometry" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                  <option value="even">Evenly Spaced</option>
                  <option value="golden">Golden Ratio Progressing</option>
                </select>
              </div>
            </div>


            {/* 3. Technique & Tools */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Brush className="w-4 h-4" /> 3. Technique & Tool
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <label title="Draw circular dots" className={`cursor-pointer flex items-center justify-center gap-2 p-2 border rounded-lg ${technique === 'dot' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200'}`}>
                  <input type="radio" className="hidden" value="dot" checked={technique === 'dot'} onChange={() => setTechnique('dot')} />
                  <span className="text-sm font-medium">Dotting</span>
                </label>
                <label title="Draw elongated petals/shapes" className={`cursor-pointer flex items-center justify-center gap-2 p-2 border rounded-lg ${technique === 'line' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200'}`}>
                  <input type="radio" className="hidden" value="line" checked={technique === 'line'} onChange={() => setTechnique('line')} />
                  <span className="text-sm font-medium">Line/Pen</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Max Tool Size (mm) <span className="text-slate-400 font-normal">- used for overlap warnings</span></label>
                <input type="number" min="0.1" step="0.1" value={dotSize} onChange={(e) => setDotSize(e.target.value)} title="Size of your largest dotting tool (calculates if elements will physically fit)" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
            </div>


            {/* 4. Element Placement */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <LayoutList className="w-4 h-4" /> 4. Placement Plan
              </h3>

              <div className="flex gap-4 border-b border-slate-100 pb-3">
                <label title="Use the same number of elements on every single ring" className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="same" checked={ringPlanMode === 'same'} onChange={() => setRingPlanMode('same')} className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm text-slate-700">Same / ring</span>
                </label>
                <label title="Write custom instructions for each individual ring" className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="custom" checked={ringPlanMode === 'custom'} onChange={() => setRingPlanMode('custom')} className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm text-slate-700">Custom / ring</span>
                </label>
              </div>


              {ringPlanMode === 'same' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Elements per ring</label>
                  <input type="number" min="1" value={elementsPerRing} onChange={(e) => setElementsPerRing(e.target.value)} title="Total number of items drawn on every ring" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-slate-400" /> Custom Plan & Colors
                  </label>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-500">Format: <code>ring X: count #color</code></p>
                    <button onClick={generateTemplate} title="Automatically generate a template that increases dot counts progressively outwards" className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium">
                      <Wand2 className="w-3 h-3" /> Auto-fill
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={customRingsText}
                    onChange={(e) => setCustomRingsText(e.target.value)}
                    title="Enter custom ring data format"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm font-mono whitespace-pre"
                  />
                </div>
              )}
            </div>


          </div>


          {/* RIGHT PANEL: Preview & Instructions */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">

            {/* SVG Preview Card */}
            <div className={`p-6 rounded-2xl shadow-sm border transition-colors duration-300 ${previewDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className={`text-lg font-bold ${previewDarkMode ? 'text-white' : 'text-slate-800'}`}>Live Preview</h2>

                {/* Visual Toggles */}
                <div className="flex items-center gap-2 sm:gap-4 print:hidden">
                  <label title="Shift elements on every alternate ring to sit exactly in the gaps between the inner elements" className={`flex items-center gap-2 text-sm cursor-pointer ${previewDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <input type="checkbox" checked={isStaggered} onChange={(e) => setIsStaggered(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    Stagger Rings
                  </label>
                  <div className="h-6 w-px bg-slate-300 mx-1"></div>
                  <button onClick={() => setShowCrosshairs(!showCrosshairs)} className={`p-2 rounded-lg transition-colors ${!showCrosshairs ? (previewDarkMode ? 'text-slate-600 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100') : (previewDarkMode ? 'text-indigo-400 bg-slate-800' : 'text-indigo-600 bg-indigo-50')}`} title="Show or hide the primary North/South/East/West crosshair anchoring lines">
                    <Crosshair className="w-5 h-5" />
                  </button>
                  <button onClick={() => setShowDots(!showDots)} className={`p-2 rounded-lg transition-colors ${previewDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`} title="Show or hide the visual dot/petal elements on the grid">
                    {showDots ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <button onClick={() => setPreviewDarkMode(!previewDarkMode)} className={`p-2 rounded-lg transition-colors ${previewDarkMode ? 'text-indigo-400 bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`} title="Toggle background color (useful if painting on a black rock vs white canvas)">
                    {previewDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                </div>
              </div>


              <div className={`rounded-xl border flex items-center justify-center p-4 transition-colors duration-300 ${previewDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                {/* 420x420 gives 20px padding around our max 190 radius to prevent edge bleeding on large dots */}
                <svg ref={svgRef} viewBox="0 0 420 420" width="100%" height="100%" className="w-full max-w-lg h-auto drop-shadow-sm">
                  {/* Outer boundary (Main Surface Circle) */}
                  <circle cx={cx} cy={cy} r={maxR} fill="none" stroke={previewDarkMode ? '#475569' : '#94a3b8'} strokeWidth="2" strokeDasharray="6 6" />

                  {/* Center Dot */}
                  <circle cx={cx} cy={cy} r={3} fill={previewDarkMode ? '#94a3b8' : '#475569'} />

                  {/* Primary Crosshairs (N/S/E/W) */}
                  {showCrosshairs && (
                    <>
                      <line x1={cx} y1={cy - maxR} x2={cx} y2={cy + maxR} stroke={highlightColor} strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="4 4" />
                      <line x1={cx - maxR} y1={cy} x2={cx + maxR} y2={cy} stroke={highlightColor} strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="4 4" />
                    </>
                  )}


                  {/* Concentric Rings */}
                  {ringRadii.map((radiusMultiplier, i) => {
                    const radiusSvg = maxR * radiusMultiplier;
                    const isHovered = hoveredRing === i;
                    // Don't draw the final ring line if it exactly matches the outer boundary to avoid double lines
                    if (radiusMultiplier >= 0.99) return null;
                    return (
                      <circle
                        key={`ring-${i}`}
                        cx={cx} cy={cy} r={radiusSvg}
                        fill="none"
                        stroke={isHovered ? highlightColor : strokeColor}
                        strokeWidth={isHovered ? "2.5" : "1"}
                        className="transition-all duration-300"
                      />
                    );
                  })}


                  {/* Wedge Lines */}
                  {Array.from({ length: parsedWedges }).map((_, i) => {
                    const angle = i * wedgeAngle;
                    const rad = (angle - 90) * (Math.PI / 180);
                    const x2 = cx + maxR * Math.cos(rad);
                    const y2 = cy + maxR * Math.sin(rad);
                    return (
                      <line key={`wedge-${i}`} x1={cx} y1={cy} x2={x2} y2={y2} stroke={wedgeColor} strokeWidth="1" />
                    );
                  })}


                  {/* Live Dots / Petals */}
                  {showDots && ringRadii.map((radiusMultiplier, ringIndex) => {
                    const radiusSvg = maxR * radiusMultiplier;
                    const { count, color } = getElementsForRing(ringIndex);
                    if (count <= 0) return null;


                    const elementAngle = 360 / count;
                    // Offset for stagger: if staggered and ring is odd, offset by half the element angle
                    const offset = (isStaggered && ringIndex % 2 !== 0) ? elementAngle / 2 : 0;

                    // Use accurate, true-to-scale dot rendering
                    const visualDotRadius = trueDotRadiusPixels;


                    return Array.from({ length: count }).map((_, dotIndex) => {
                      const angle = (elementAngle * dotIndex) + offset;
                      const rad = (angle - 90) * (Math.PI / 180);
                      const ex = cx + radiusSvg * Math.cos(rad);
                      const ey = cy + radiusSvg * Math.sin(rad);

                      if (technique === 'dot') {
                        return <circle key={`dot-${ringIndex}-${dotIndex}`} cx={ex} cy={ey} r={visualDotRadius} fill={color} className="transition-all duration-500" />;
                      } else {
                        // Petal representation (ellipses pointing outwards)
                        return (
                          <ellipse
                            key={`petal-${ringIndex}-${dotIndex}`}
                            cx={ex} cy={ey}
                            rx={visualDotRadius * 0.8} ry={visualDotRadius * 2.5}
                            fill={color} fillOpacity="0.4" stroke={color} strokeWidth="1"
                            transform={`rotate(${angle} ${ex} ${ey})`}
                            className="transition-all duration-500"
                          />
                        );
                      }
                    });
                  })}
                </svg>
              </div>
            </div>


            {/* Generated Instructions Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">

              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Grid Setup Steps</h3>
                <ol className="list-decimal list-inside space-y-3 text-slate-700 text-sm md:text-base leading-relaxed">
                  <li>Mark the exact center of your surface.</li>
                  <li>Draw a main circle with a radius of <strong className="text-slate-900">{surfaceRadius.toFixed(2)} {unit}</strong>.</li>
                  <li>Divide the circle into <strong className="text-slate-900">{parsedWedges} wedges</strong> (mark every <strong className="text-slate-900">{wedgeAngle}&deg;</strong>).</li>
                  <li>
                    Draw <strong className="text-slate-900">{parsedRings} concentric rings</strong>.
                    {spacingMode === 'even'
                      ? ` Space them evenly, about ${(surfaceRadius / parsedRings).toFixed(2)} ${unit} apart.`
                      : ` Space them progressing outwards using the Golden Ratio.`}
                  </li>
                </ol>
              </div>


              <div>
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Ring Placement Plan</h3>
                <p className="text-xs text-slate-500 mb-4 print:hidden">Hover over a ring row to highlight it in the preview above.</p>
                <div className="space-y-3">

                  {ringPlanMode === 'same' ? (() => {
                    const isEven = parsedWedges % parsedElements === 0;
                    const step = parsedWedges / parsedElements;

                    return Array.from({ length: parsedRings }).map((_, i) => {
                      const maxDotsOverlap = checkOverlap(i, parsedElements);

                      return (
                        <div
                          key={i}
                          onMouseEnter={() => setHoveredRing(i)}
                          onMouseLeave={() => setHoveredRing(null)}
                          title={`Instructions for Ring ${i + 1}`}
                          className={`flex flex-col gap-2 p-3 rounded-lg border transition-colors cursor-default
                            ${hoveredRing === i ? 'border-indigo-300 bg-indigo-50 shadow-sm' : 'border-slate-100 bg-slate-50'}`}
                        >
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isEven ? 'text-emerald-500' : 'text-slate-400'}`} />
                            <div className="flex-1">
                              <p className="text-sm text-slate-800">
                                <strong>Ring {i + 1}:</strong> Place {parsedElements} {elementName}s.
                                {isEven ? ` (1 on ${step === 1 ? 'every wedge' : `every ${ordinalSuffix(step)} wedge`})` : ` Warning: Doesn't divide cleanly into ${parsedWedges} wedges.`}
                              </p>
                            </div>
                          </div>

                          {/* Overlap Warning */}
                          {maxDotsOverlap !== false && (
                            <div className="ml-7 flex items-center gap-1.5 text-xs text-red-600 font-medium">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Tools larger than {dotSize}mm will overlap! Max capacity is ~{maxDotsOverlap}.
                            </div>
                          )}
                        </div>
                      );
                    });
                  })() : (
                    <div className="space-y-2">
                      {Array.from({ length: parsedRings }).map((_, i) => {
                        const rule = parsedCustom.find(r => r.ring === i + 1);
                        if (!rule) {
                          return (
                            <div
                              key={i}
                              onMouseEnter={() => setHoveredRing(i)}
                              onMouseLeave={() => setHoveredRing(null)}
                              className="text-sm text-slate-400 italic p-2 border border-transparent"
                            >
                              Ring {i + 1}: (No plan specified)
                            </div>
                          );
                        }

                        const { ring: X, count: Y, color } = rule;
                        const isEven = parsedWedges % Y === 0;
                        const st = parsedWedges / Y;
                        const maxDotsOverlap = checkOverlap(i, Y);


                        return (
                          <div
                            key={i}
                            onMouseEnter={() => setHoveredRing(i)}
                            onMouseLeave={() => setHoveredRing(null)}
                            title={`Instructions for custom Ring ${X}`}
                            className={`flex flex-col gap-2 p-3 rounded-lg border transition-all cursor-default
                              ${hoveredRing === i ? 'border-indigo-300 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white'}`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Color Swatch */}
                              <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0 mt-0.5" style={{ backgroundColor: color || '#6366f1' }} />

                              <div className="flex-1">
                                <p className="text-sm text-slate-800">
                                  <strong>Ring {X}:</strong> place <strong>{Y}</strong> {elementName}s.
                                  <span className="text-slate-500 ml-1">
                                    {isEven ? `(1 on ${st === 1 ? 'every wedge' : `every ${ordinalSuffix(st)} wedge`})` : `(Irregular spacing)`}
                                  </span>
                                </p>
                              </div>
                            </div>


                            {/* Overlap Warning */}
                            {maxDotsOverlap !== false && (
                              <div className="ml-7 flex items-center gap-1.5 text-xs text-red-600 font-medium bg-red-50 p-1.5 rounded w-fit">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {dotSize}mm tools will overlap! Physical limit is ~{maxDotsOverlap}.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}


                </div>
              </div>


            </div>
          </div>


        </div>
      </div>
    </div>
  );
}