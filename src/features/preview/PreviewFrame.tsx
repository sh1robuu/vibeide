import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Monitor, Smartphone, Tablet, Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';

export function PreviewFrame() {
  const { deviceView, setDeviceView, files, addConsoleLog, clearConsoleLogs } = useStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Console capture script to inject into the iframe
  const consoleCaptureScript = `
<script>
(function() {
  const methods = ['log', 'warn', 'error', 'info'];
  methods.forEach(function(method) {
    const original = console[method];
    console[method] = function() {
      const args = Array.from(arguments).map(function(arg) {
        if (typeof arg === 'object') {
          try { return JSON.stringify(arg, null, 2); } catch(e) { return String(arg); }
        }
        return String(arg);
      });
      window.parent.postMessage({
        type: 'console',
        method: method,
        content: args.join(' ')
      }, '*');
      original.apply(console, arguments);
    };
  });
  window.onerror = function(msg, url, line, col, err) {
    window.parent.postMessage({
      type: 'console',
      method: 'error',
      content: msg + (line ? ' (line ' + line + ')' : '')
    }, '*');
  };
})();
</script>`;

  const updateIframe = () => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (doc) {
        clearConsoleLogs();

        // Combine HTML, CSS, and JS for preview
        let combinedHtml = files['index.html'] || '';

        // Inject CSS
        if (files['styles.css']) {
          combinedHtml = combinedHtml.replace(
            /<link\s+rel="stylesheet"\s+href="styles\.css"\s*\/?>/i,
            `<style>${files['styles.css']}</style>`
          );
        }

        // Inject JS
        if (files['script.js']) {
          combinedHtml = combinedHtml.replace(
            /<script\s+src="script\.js"\s*><\/script>/i,
            `<script>${files['script.js']}</script>`
          );
        }

        // Inject console capture before </head> or at start of <body>
        if (combinedHtml.includes('</head>')) {
          combinedHtml = combinedHtml.replace('</head>', `${consoleCaptureScript}</head>`);
        } else if (combinedHtml.includes('<body>')) {
          combinedHtml = combinedHtml.replace('<body>', `<body>${consoleCaptureScript}`);
        } else {
          combinedHtml = consoleCaptureScript + combinedHtml;
        }

        doc.open();
        doc.write(combinedHtml);
        doc.close();
      }
    }
  };

  // Listen for console messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'console') {
        addConsoleLog({
          type: event.data.method || 'log',
          content: event.data.content || '',
          timestamp: Date.now(),
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addConsoleLog]);

  // Auto-refresh when files change (with a small debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateIframe();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [files]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    updateIframe();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="flex flex-col h-full w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between h-12 bg-white/5 border-b border-white/10 px-4 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className={cn("p-1.5 rounded-md hover:bg-white/10 text-white/70 transition-all", isRefreshing && "animate-spin text-indigo-400")}
          >
            <RefreshCw size={16} />
          </button>
          <div className="h-4 w-px bg-white/10 mx-2"></div>
          <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Live Preview</span>
        </div>

        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
          <button
            onClick={() => setDeviceView('mobile')}
            className={cn("p-1.5 rounded-md transition-colors", deviceView === 'mobile' ? "bg-white/20 text-white" : "text-white/50 hover:text-white")}
          >
            <Smartphone size={14} />
          </button>
          <button
            onClick={() => setDeviceView('tablet')}
            className={cn("p-1.5 rounded-md transition-colors", deviceView === 'tablet' ? "bg-white/20 text-white" : "text-white/50 hover:text-white")}
          >
            <Tablet size={14} />
          </button>
          <button
            onClick={() => setDeviceView('desktop')}
            className={cn("p-1.5 rounded-md transition-colors", deviceView === 'desktop' ? "bg-white/20 text-white" : "text-white/50 hover:text-white")}
          >
            <Monitor size={14} />
          </button>
        </div>
      </div>

      {/* Iframe Container */}
      <div className="flex-1 bg-[url('https://picsum.photos/seed/grid/1000/1000?blur=10')] bg-cover bg-center flex items-center justify-center p-4 overflow-hidden relative before:absolute before:inset-0 before:bg-black/60 before:backdrop-blur-3xl">
        <div
          className={cn(
            "bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-500 ease-in-out relative z-10",
            deviceView === 'mobile' ? "w-[375px] h-[812px]" :
              deviceView === 'tablet' ? "w-[768px] h-[1024px]" :
                "w-full h-full"
          )}
        >
          {isRefreshing && (
            <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-sm font-medium text-indigo-900/70">Loading preview...</span>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            title="preview"
            className="w-full h-full border-none bg-white"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}

