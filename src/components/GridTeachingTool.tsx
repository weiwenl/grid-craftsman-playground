import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';

// =======================
// Type Definitions
// =======================
interface SavedSelection {
  selection: GridSelection;
  color: string;
}

interface GridSelection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

interface GridProperties {
  gridColumnStart: number;
  gridColumnEnd: number;
  gridRowStart: number;
  gridRowEnd: number;
}

// =======================
// Color Definitions
// =======================
const RANDOM_COLORS: { [hex: string]: string } = {
  "#e57373": "Light Red (Pastel Red)",
  "#f06292": "Pink (Medium Pink)",
  "#ba68c8": "Lavender Purple (Medium Purple)",
  "#9575cd": "Light Purple (Soft Violet)",
  "#7986cb": "Periwinkle Blue (Muted Blue)",
  "#64b5f6": "Sky Blue (Light Blue)",
  "#4fc3f7": "Cyan Blue (Bright Cyan)",
  "#4dd0e1": "Turquoise (Light Teal)",
  "#4db6ac": "Aqua Green (Muted Teal)",
  "#81c784": "Light Green (Pastel Green)",
  "#aed581": "Yellow Green (Lime Green)",
  "#dce775": "Light Lime (Pale Yellow-Green)",
  "#fff176": "Light Yellow (Lemon Yellow)",
  "#ffd54f": "Gold (Light Gold)",
  "#ffb74d": "Orange (Light Orange)",
  "#ff8a65": "Salmon (Light Coral)",
  "#a1887f": "Taupe (Light Brown/Gray)",
  "#e0e0e0": "Light Gray",
  "#90a4ae": "Blue Gray (Cool Gray)",
  "#bdbdbd": "Medium Gray"
};

// =======================
// Utility Function
// =======================
const getRandomColor = (usedColorsRef: React.MutableRefObject<string[]>) => {
  if (usedColorsRef.current.length === Object.keys(RANDOM_COLORS).length) usedColorsRef.current = [];
  const available = Object.keys(RANDOM_COLORS).filter(c => !usedColorsRef.current.includes(c));
  const color = available[Math.floor(Math.random() * available.length)];
  usedColorsRef.current.push(color);
  return color;
}

// =======================
// Main Component
// =======================
const GridTeachingTool: React.FC = () => {
  // -------------
  // State & Refs
  // -------------
  const [rows, setRows] = useState(6);
  const [cols, setCols] = useState(8);
  const [selection, setSelection] = useState<GridSelection | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [groupColor, setGroupColor] = useState<string>('primary');
  const [selectionColor, setSelectionColor] = useState<string | null>(null);
  const [savedSelections, setSavedSelections] = useState<SavedSelection[]>([]);
  const [hoveredSelection, setHoveredSelection] = useState<SavedSelection | null>(null);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<GridSelection | null>(null);
  const usedColorsRef = useRef<string[]>([]);

  // =======================
  // Selection Logic
  // =======================

  // Calculate grid properties from selection
  const calculateProperties = useCallback((sel: GridSelection): GridProperties => {
    return {
      gridColumnStart: Math.min(sel.startCol, sel.endCol) + 1,
      gridColumnEnd: Math.max(sel.startCol, sel.endCol) + 2,
      gridRowStart: Math.min(sel.startRow, sel.endRow) + 1,
      gridRowEnd: Math.max(sel.startRow, sel.endRow) + 2,
    };
  }, []);

  // Get cell position from mouse or touch event
  const getCellFromEvent = useCallback((e: React.MouseEvent | React.TouchEvent): { row: number; col: number } | null => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('grid-cell')) return null;
    
    const row = parseInt(target.dataset.row || '0');
    const col = parseInt(target.dataset.col || '0');
    return { row, col };
  }, []);

  // Get position from mouse or touch event
  const getEventPosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { x: touch.clientX, y: touch.clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }, []);

  // Handle mouse/touch down - start selection
  const handleStartSelection = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const cell = getCellFromEvent(e);
    if (!cell) return;

    setIsSelecting(true);
    const newSelection = {
      startRow: cell.row,
      startCol: cell.col,
      endRow: cell.row,
      endCol: cell.col,
    };
    setSelection(newSelection);
    selectionRef.current = newSelection;
    setShowTooltip(true);

     // Pick a random color for this selection
    setSelectionColor(getRandomColor(usedColorsRef));
    
    // Update tooltip position
    const position = getEventPosition(e);
    setTooltipPos({ x: position.x + 20, y: position.y - 10 });
  }, [getCellFromEvent, getEventPosition]);

  // Handle mouse/touch move - update selection during drag
  const handleUpdateSelection = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isSelecting || !selectionRef.current) return;
    
    const cell = getCellFromEvent(e);
    if (!cell) return;

    const newSelection = {
      ...selectionRef.current,
      endRow: cell.row,
      endCol: cell.col,
    };
    setSelection(newSelection);
    selectionRef.current = newSelection;
    
    // Update tooltip position
    const position = getEventPosition(e);
    setTooltipPos({ x: position.x + 20, y: position.y - 10 });
  }, [isSelecting, getCellFromEvent, getEventPosition]);

  // Check if cell is selected in any saved selection
  const getCellColor = useCallback((row: number, col: number): string | null => {
    // Check current selection first (for live feedback)
    if (selection && selectionColor) {
      const minRow = Math.min(selection.startRow, selection.endRow);
      const maxRow = Math.max(selection.startRow, selection.endRow);
      const minCol = Math.min(selection.startCol, selection.endCol);
      const maxCol = Math.max(selection.startCol, selection.endCol);
      if (row >= minRow && row <= maxRow && col >= minCol && col <= maxCol) {
        return selectionColor;
      }
    }
    // Check saved selections
    for (const saved of savedSelections) {
      const { startRow, endRow, startCol, endCol } = saved.selection;
      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      const minCol = Math.min(startCol, endCol);
      const maxCol = Math.max(startCol, endCol);
      if (row >= minRow && row <= maxRow && col >= minCol && col <= maxCol) {
        return saved.color;
      }
    }
    return null;
  }, [selection, selectionColor, savedSelections]);

  // On mouse up, save the selection if valid and not already saved
  const handleMouseUp = useCallback(() => {
    if (isSelecting && selection && selectionColor) {
      // Save only if not already present
      setSavedSelections(prev => [
        ...prev,
        { selection, color: selectionColor }
      ]);
      setSelection(null);
      setSelectionColor(null);
      setIsSelecting(false);
    } else if (isSelecting) {
      setIsSelecting(false);
    }
  }, [isSelecting, selection, selectionColor]);

  // Handle selection hover
  const handleSelectionHover = useCallback((e: React.MouseEvent) => {
    if (isSelecting) return;
    const target = e.target as HTMLElement;
    if (!target.classList.contains('grid-cell')) {
      setShowTooltip(false);
      setHoveredSelection(null);
      return;
    }
    const row = parseInt(target.dataset.row || '0');
    const col = parseInt(target.dataset.col || '0');

    // Find if this cell is in any saved selection
    const found = savedSelections.find(saved => {
      const { startRow, endRow, startCol, endCol } = saved.selection;
      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      const minCol = Math.min(startCol, endCol);
      const maxCol = Math.max(startCol, endCol);
      return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
    });

    if (found) {
      setHoveredSelection(found);
      setShowTooltip(true);
      setTooltipPos({ x: e.clientX + 20, y: e.clientY - 10 });
    } else {
      setShowTooltip(false);
      setHoveredSelection(null);
    }
  }, [isSelecting, savedSelections]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelection(null);
    setShowTooltip(false);
    selectionRef.current = null;
    setSelectionColor(null);
    setSavedSelections([]); // clear all saved selections
  }, []);

  // Check if cell is selected
  const isCellSelected = useCallback((row: number, col: number): boolean => {
    if (!selection) return false;
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  }, [selection]);

  // =======================
  // Effects
  // =======================

  // Add global mouse/touch up listeners
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        setIsSelecting(false);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isSelecting]);

  // Hide tooltip when not hovering selection
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!selection || isSelecting) return;
      
      const target = e.target as HTMLElement;
      const isOverSelection = target.classList.contains('grid-cell')
        && target.dataset.row !== undefined
        && target.dataset.col !== undefined
        && isCellSelected(parseInt(target.dataset.row), parseInt(target.dataset.col));
      
      if (!isOverSelection) {
        setShowTooltip(false);
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    return () => document.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [selection, isSelecting, isCellSelected]);

  
  // =======================
  // Render
  // =======================

  const tooltipSelection = hoveredSelection ? hoveredSelection.selection : selection;
  const tooltipColor = hoveredSelection ? hoveredSelection.color : selectionColor;
  const gridProperties = tooltipSelection ? calculateProperties(tooltipSelection) : null;

  return (
    <div className="min-h-screen bg-[var(--gradient-background)] p-6">
      {/* =======================
          Header
      ======================= */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-[var(--gradient-primary)] bg-clip-text text-transparent mb-4">
            Interactive CSS Grid Teaching Tool
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Learn CSS Grid properties by selecting rectangular areas. 
            Click and drag to see how grid-column-start, grid-column-end, grid-row-start, and grid-row-end work.
          </p>
        </div>

        {/* =======================
            Controls
        ======================= */}
        <Card className="p-6 mb-8 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-end gap-6">
            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="rows" className="text-sm font-medium mb-2 block">
                Number of Rows
              </Label>
              <Input
                id="rows"
                type="number"
                min="1"
                max="20"
                value={rows}
                onChange={(e) => {
                  const value = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                  setRows(value);
                  clearSelection();
                }}
                className="w-full"
              />
            </div>
            
            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="cols" className="text-sm font-medium mb-2 block">
                Number of Columns
              </Label>
              <Input
                id="cols"
                type="number"
                min="1"
                max="20"
                value={cols}
                onChange={(e) => {
                  const value = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                  setCols(value);
                  clearSelection();
                }}
                className="w-full"
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="groupColor" className="text-sm font-medium mb-2 block">
                Group Color
              </Label>
              <Input
                id="groupColor"
                type="text"
                value={RANDOM_COLORS[selectionColor]}
                className="w-full"
                readOnly
              />
            </div>

            <Button
              onClick={clearSelection}
              variant="outline"
              disabled={!selection && savedSelections.length === 0}
              className="whitespace-nowrap"
            >
              Clear Selection
            </Button>
          </div>
        </Card>

        {/* =======================
            Grid Container
        ======================= */}
        <div className="relative">
          <Card className="p-8 shadow-[var(--shadow-grid)] overflow-visible mx-auto">
            <div
              ref={gridRef}
              className="grid gap-1 w-full mx-auto relative select-none"
              style={{
                gridTemplateRows: `repeat(${rows}, minmax(24px, 1fr))`,
                gridTemplateColumns: `repeat(${cols}, minmax(24px, 1fr))`,
                aspectRatio: `${cols} / ${rows}`,
                // maxWidth: "800px",
                // minWidth: "320px",
              }}
              onMouseUp={handleMouseUp}
              onTouchEnd={handleMouseUp}
            >
              {/* Grid Cells */}
              {Array.from({ length: rows * cols }, (_, index) => {
                const row = Math.floor(index / cols);
                const col = index % cols;
                const cellColor = getCellColor(row, col);

                const getSelectionStyles = () => {
                  if (!cellColor) return '';
                  return `border-2 border-black`;
                };

                return (
                  <div
                    key={`${row}-${col}`}
                    className={`
                      grid-cell border border-grid-cell-border bg-grid-cell 
                      hover:bg-grid-cell-hover cursor-pointer transition-all duration-150
                      flex items-center justify-center text-xs text-muted-foreground
                      min-h-[24px] touch-manipulation
                      ${getSelectionStyles()}
                    `}
                    data-row={row}
                    data-col={col}
                    onMouseDown={handleStartSelection}
                    onMouseEnter={handleUpdateSelection}
                    onMouseMove={handleSelectionHover}
                    onTouchStart={handleStartSelection}
                    onTouchMove={handleUpdateSelection}
                    style={cellColor ? { backgroundColor: cellColor } : undefined}
                  >
                    <span className="pointer-events-none">
                      {row + 1},{col + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* =======================
              Tooltip
          ======================= */}
          {showTooltip && gridProperties && (
            <div
              className="fixed z-50 pointer-events-none"
              style={{
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
              }}
            >
              <Card className="p-4 bg-grid-tooltip text-grid-tooltip-foreground shadow-[var(--shadow-tooltip)] max-w-xs">
                <h3 className="font-semibold mb-3 text-sm">CSS Grid Properties</h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-primary-glow">grid-column-start:</span>
                    <span className="font-semibold">{gridProperties.gridColumnStart}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-glow">grid-column-end:</span>
                    <span className="font-semibold">{gridProperties.gridColumnEnd}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-accent">grid-row-start:</span>
                    <span className="font-semibold">{gridProperties.gridRowStart}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-accent">grid-row-end:</span>
                    <span className="font-semibold">{gridProperties.gridRowEnd}</span>
                  </div>
                </div>
                
                {/* CSS Code Preview */}
                <div className="mt-4 pt-3 border-t border-grid-tooltip-foreground/20">
                  <p className="text-xs text-primary-glow mb-2">CSS Code:</p>
                  <div className="text-xs font-mono leading-relaxed">
                    <div>grid-column: {gridProperties.gridColumnStart} / {gridProperties.gridColumnEnd};</div>
                    <div>grid-row: {gridProperties.gridRowStart} / {gridProperties.gridRowEnd};</div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* =======================
            Instructions (How to Use the Tool)
        ======================= */}
        <Card className="mt-8 p-6">
          <h2 className="text-xl font-semibold mb-4">How to Use</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-medium mb-2 text-primary">🎯 Selection</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Click and drag across cells to select a rectangular area</li>
                <li>• Watch the tooltip update in real-time as you drag</li>
                <li>• Hover over a completed selection to see properties again</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2 text-accent">📏 Understanding CSS Grid</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Both rows and columns are defined by lines, not by cells.</li>
                <li>e.g. starting from 1, a grid with 3 columns will have 4 vertical grid lines (1, 2, 3, 4)</li>
                <li>• When you specify a grid area using grid-column or grid-row, the end value is exclusive.</li>
                <li>e.g. grid-column: 1 / 4 covers columns between lines 1 and 4 (columns 1 and 3).</li>
                <li>e.g. grid-row: 1 / 3 covers rows between lines 1 and 3 (rows 1 and 2).</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GridTeachingTool;