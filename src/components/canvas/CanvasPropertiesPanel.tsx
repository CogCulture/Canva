import { useEffect, useState, useCallback, useRef } from 'react';
import * as fabric from 'fabric';
import { Move, RotateCcw, Maximize2, Blend, Type } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';

interface CanvasPropertiesPanelProps {
  canvas: fabric.Canvas | null;
}

interface ObjProps {
  x: number;
  y: number;
  w: number;
  h: number;
  angle: number;
  opacity: number;
  blend: string;
  type: string;
}

const BLEND_MODES = [
  { value: 'source-over', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
];

export default function CanvasPropertiesPanel({ canvas }: CanvasPropertiesPanelProps) {
  const { activeLayerId, updateLayer } = useCanvasStore();
  const [props, setProps] = useState<ObjProps | null>(null);

  const readProps = useCallback(() => {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) { setProps(null); return; }
    setProps({
      x: Math.round(obj.left ?? 0),
      y: Math.round(obj.top ?? 0),
      w: Math.round((obj.width ?? 0) * (obj.scaleX ?? 1)),
      h: Math.round((obj.height ?? 0) * (obj.scaleY ?? 1)),
      angle: Math.round(obj.angle ?? 0),
      opacity: Math.round((obj.opacity ?? 1) * 100),
      blend: (obj.globalCompositeOperation as string) || 'source-over',
      type: obj.type ?? 'object',
    });
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;
    canvas.on('selection:created', readProps);
    canvas.on('selection:updated', readProps);
    canvas.on('selection:cleared', () => setProps(null));
    canvas.on('object:modified', readProps);
    canvas.on('object:scaling', readProps);
    canvas.on('object:moving', readProps);
    canvas.on('object:rotating', readProps);
    return () => {
      canvas.off('selection:created', readProps);
      canvas.off('selection:updated', readProps);
      canvas.off('selection:cleared');
      canvas.off('object:modified', readProps);
      canvas.off('object:scaling', readProps);
      canvas.off('object:moving', readProps);
      canvas.off('object:rotating', readProps);
    };
  }, [canvas, readProps]);

  const applyProp = (key: string, value: any) => {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) return;

    if (key === 'w') {
      obj.set({ scaleX: value / (obj.width || 1) });
    } else if (key === 'h') {
      obj.set({ scaleY: value / (obj.height || 1) });
    } else if (key === 'opacity') {
      const v = value / 100;
      obj.set({ opacity: v });
      // sync to layer store
      const layerId = (obj as any)._canvasLayerId;
      if (layerId) updateLayer(layerId, { opacity: value });
    } else {
      obj.set({ [key]: value } as any);
    }
    obj.setCoords();
    canvas.renderAll();
    readProps();
  };

  if (!props || !activeLayerId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 text-white/20 select-none">
        <Move size={22} className="mb-2 opacity-40" />
        <p className="text-[11px] text-center leading-relaxed">
          Select a layer<br />to view properties
        </p>
      </div>
    );
  }

  const Field = ({
    label, value, onChange, min, max, step = 1,
  }: {
    label: string; value: number; onChange: (v: number) => void;
    min?: number; max?: number; step?: number;
  }) => (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-white/35 w-5 shrink-0 font-mono">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 bg-white/6 border border-white/10 rounded-md px-2 py-1 text-[11px] text-white outline-none focus:border-blue-500/70 transition-colors text-center"
      />
    </div>
  );

  return (
    <div className="p-3 space-y-4 overflow-y-auto flex-1 select-none">
      {/* Transform */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[9px] text-white/30 uppercase tracking-widest font-semibold">
          <Move size={9} /> Transform
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="X" value={props.x} onChange={(v) => applyProp('left', v)} />
          <Field label="Y" value={props.y} onChange={(v) => applyProp('top', v)} />
          <Field label="W" value={props.w} min={1} onChange={(v) => applyProp('w', v)} />
          <Field label="H" value={props.h} min={1} onChange={(v) => applyProp('h', v)} />
        </div>
        <Field label="°" value={props.angle} min={-360} max={360} onChange={(v) => applyProp('angle', v)} />
      </div>

      {/* Opacity */}
      <div className="space-y-2 pt-3 border-t border-white/6">
        <div className="flex items-center gap-1.5 text-[9px] text-white/30 uppercase tracking-widest font-semibold">
          <Maximize2 size={9} /> Appearance
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/35 w-12 shrink-0">Opacity</span>
            <input
              type="range"
              min={0}
              max={100}
              value={props.opacity}
              onChange={(e) => {
                const v = Number(e.target.value);
                setProps((p) => p ? { ...p, opacity: v } : p);
                applyProp('opacity', v);
              }}
              className="flex-1 h-1.5 rounded-full accent-blue-500"
            />
            <span className="text-[11px] text-white/60 w-8 text-right font-mono">{props.opacity}%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/35 w-12 shrink-0">Blend</span>
            <select
              value={props.blend}
              onChange={(e) => {
                setProps((p) => p ? { ...p, blend: e.target.value } : p);
                applyProp('globalCompositeOperation', e.target.value);
              }}
              className="flex-1 bg-white/6 border border-white/10 rounded-md px-2 py-1 text-[11px] text-white outline-none focus:border-blue-500/70 transition-colors"
            >
              {BLEND_MODES.map((m) => (
                <option key={m.value} value={m.value} style={{ background: '#1c1c1e' }}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
