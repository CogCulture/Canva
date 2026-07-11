export async function invoke<T>(cmd: string, args: Record<string, any> = {}): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const response = await fetch(`${baseUrl}/api/invoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ command: cmd, args }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  // Handle image responses (preview/adjustment commands return raw image bytes)
  const contentType = response.headers.get('content-type') || '';
  const isImageCommand = [
    'generate_preview_for_path',
    'generate_preset_preview',
    'apply_adjustments'
  ].includes(cmd);
  
  if (isImageCommand || contentType.startsWith('image/') || contentType === 'application/octet-stream') {
    return await response.arrayBuffer() as any;
  }

  const text = await response.text();
  if (!text) {
    return null as any;
  }
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    return text as any;
  }
}

export function listen(event: string, handler: any) {
  // Mock event listener
  console.log(`Mock listen for ${event}`);
  return Promise.resolve(() => {});
}

export function getCurrentWindow() {
  return {
    hide: () => Promise.resolve(),
    show: () => Promise.resolve(),
    close: () => Promise.resolve(),
    minimize: () => Promise.resolve(),
    maximize: () => Promise.resolve(),
    unmaximize: () => Promise.resolve(),
    setFocus: () => Promise.resolve(),
    setFullscreen: () => Promise.resolve(),
    isFullscreen: () => Promise.resolve(false),
    isMaximized: () => Promise.resolve(false),
    onResized: () => Promise.resolve(() => {}),
  };
}

export function getVersion() {
  return Promise.resolve("1.0.0");
}

export function platform() {
  return Promise.resolve("web");
}

export async function open(options: any) {
  if (options && options.directory) {
    alert("Folder selection is not supported in the web version. Please open individual files.");
    return null;
  }
  
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    
    if (options?.filters?.length > 0) {
      const exts = options.filters.flatMap((f: any) => f.extensions.map((e: string) => `.${e}`));
      input.accept = exts.join(',');
    }

    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const baseUrl = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${baseUrl}/api/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (!res.ok) throw new Error(await res.text());
        
        const data = await res.json();
        // Return as an array like the original dialog does when multiple: false isn't explicitly handled sometimes,
        // but ImagePicker expects a single string or an array? Let's check ImagePicker.
        // Wait, ImagePicker says: if (typeof selected === 'string') { onImageSelect(selected) }
        resolve(data.path);
      } catch (err) {
        console.error("Upload failed", err);
        resolve(null);
      }
    };
    
    input.click();
  });
}

export async function save(options: any) {
  if (options && options.defaultPath) {
    return options.defaultPath;
  }
  return "preset.json";
}

export async function homeDir() {
  return Promise.resolve("/");
}

export async function relaunch() {
  window.location.reload();
}

export async function uploadDataUrlToCloud(dataUrl: string): Promise<string> {
  const formData = new FormData();
  
  if (dataUrl.startsWith('http')) {
    formData.append('url', dataUrl);
  } else {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    formData.append('file', blob, 'image.png');
  }
  
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const uploadRes = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!uploadRes.ok) throw new Error(await uploadRes.text());
  const data = await uploadRes.json();
  return data.path;
}
