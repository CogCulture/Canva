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
  // Mock file picker dialog
  if (options && options.directory) {
    const customPath = prompt("Enter directory path to open:");
    return customPath;
  } else {
    const customPath = prompt("Enter file path to open:");
    return customPath ? [customPath] : null;
  }
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
