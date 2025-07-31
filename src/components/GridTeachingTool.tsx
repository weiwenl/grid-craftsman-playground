import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';

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

const GridTeachingTool: React.FC = () => {
  const [rows, setRows] = useState(6);
  const [cols, setCols] = useState(8);
  const [selection, setSelection] = useState<GridSelection | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<GridSelection | null>(null);

  // Calculate grid properties from selection
  const calculateProperties = useCallback((sel: GridSelection): GridProperties => {
    return {
      gridColumnStart: Math.min(sel.startCol, sel.endCol) + 1,
      gridColumnEnd: Math.max(sel.startCol, sel.endCol) + 2,
      gridRowStart: Math.min(sel.startRow, sel.endRow) + 1,
      gridRowEnd: Math.max(sel.startRow, sel.endRow) + 2,
    };
  }, []);

  // Get cell position from mouse event
  const getCellFromEvent = useCallback((e: React.MouseEvent): { row: number; col: number } | null => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('grid-cell')) return null;
    
    const row = parseInt(target.dataset.row || '0');
    const col = parseInt(target.dataset.col || '0');
    return { row, col };
  }, []);

  // Handle mouse down - start selection
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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
    
    // Update tooltip position
    setTooltipPos({ x: e.clientX + 20, y: e.clientY - 10 });
  }, [getCellFromEvent]);

  // Handle mouse enter - update selection during drag
  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
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
    setTooltipPos({ x: e.clientX + 20, y: e.clientY - 10 });
  }, [isSelecting, getCellFromEvent]);

  // Handle mouse up - end selection
  const handleMouseUp = useCallback(() => {
    if (isSelecting) {
      setIsSelecting(false);
    }
  }, [isSelecting]);

  // Handle selection hover
  const handleSelectionHover = useCallback((e: React.MouseEvent) => {
    if (!selection || isSelecting) return;
    setShowTooltip(true);
    setTooltipPos({ x: e.clientX + 20, y: e.clientY - 10 });
  }, [selection, isSelecting]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelection(null);
    setShowTooltip(false);
    selectionRef.current = null;
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

  // Add global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        setIsSelecting(false);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isSelecting]);

  // Hide tooltip when not hovering selection
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!selection || isSelecting) return;
      
      const target = e.target as HTMLElement;
      const isOverSelection = target.classList.contains('grid-cell') && 
                             target.dataset.row !== undefined && 
                             target.dataset.col !== undefined &&
                             isCellSelected(parseInt(target.dataset.row), parseInt(target.dataset.col));
      
      if (!isOverSelection) {
        setShowTooltip(false);
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    return () => document.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [selection, isSelecting, isCellSelected]);

  const gridProperties = selection ? calculateProperties(selection) : null;

  return (
    <div className="min-h-screen bg-[var(--gradient-background)] p-6">
      {/* Header */}
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

        {/* Controls */}
        <Card className="p-6 mb-8 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-end gap-6">
            <div className="flex-1 min-w-[200px]">
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
            
            <div className="flex-1 min-w-[200px]">
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

            <Button
              onClick={clearSelection}
              variant="outline"
              disabled={!selection}
              className="whitespace-nowrap"
            >
              Clear Selection
            </Button>
          </div>
        </Card>

        {/* Grid Container */}
        <div className="relative">
          <Card className="p-8 shadow-[var(--shadow-grid)] overflow-auto">
            <div
              ref={gridRef}
              className="grid gap-1 min-w-[1920px] min-h-[800px] mx-auto relative select-none"
              style={{
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
              }}
              onMouseUp={handleMouseUp}
            >
              {/* Grid Cells */}
              {Array.from({ length: rows * cols }, (_, index) => {
                const row = Math.floor(index / cols);
                const col = index % cols;
                const selected = isCellSelected(row, col);

                return (
                  <div
                    key={`${row}-${col}`}
                    className={`
                      grid-cell border border-grid-cell-border bg-grid-cell 
                      hover:bg-grid-cell-hover cursor-pointer transition-all duration-150
                      flex items-center justify-center text-xs text-muted-foreground
                      ${selected ? 'bg-grid-selection/20 border-grid-selection' : ''}
                    `}
                    data-row={row}
                    data-col={col}
                    onMouseDown={handleMouseDown}
                    onMouseEnter={handleMouseEnter}
                    onMouseMove={handleSelectionHover}
                  >
                    <span className="pointer-events-none">
                      {row + 1},{col + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Tooltip */}
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

        {/* Instructions */}
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
              <h3 className="font-medium mb-2 text-accent">📏 Understanding Grid Lines</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Grid lines are numbered starting from 1</li>
                <li>• End values are exclusive (like CSS)</li>
                <li>• Column 1-3 spans from line 1 to line 3</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GridTeachingTool;