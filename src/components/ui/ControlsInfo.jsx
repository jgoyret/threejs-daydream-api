export default function ControlsInfo() {
  return (
    <div
      data-daydream-ui
      className="fixed left-4 top-1/2 -translate-y-1/2 bg-black/80 text-white p-4 rounded-lg border border-gray-700"
      style={{ zIndex: 200, pointerEvents: 'auto', maxWidth: '200px' }}
    >
      <h3 className="font-bold text-sm mb-3 text-gray-300">Controls</h3>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">W</kbd>
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">A</kbd>
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">S</kbd>
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">D</kbd>
          </div>
          <span className="text-gray-400">Move</span>
        </div>

        <div className="flex items-center gap-2">
          <kbd className="px-3 py-1 bg-gray-700 rounded text-xs font-mono">Space</kbd>
          <span className="text-gray-400">Jump</span>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
          <kbd className="px-3 py-1 bg-gray-700 rounded text-xs font-mono">ESC</kbd>
          <span className="text-gray-400">Release mouse</span>
        </div>
      </div>
    </div>
  );
}
