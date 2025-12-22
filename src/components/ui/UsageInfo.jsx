export default function UsageInfo() {
  return (
    <div
      data-daydream-ui
      className="fixed right-4 top-1/2 -translate-y-1/2 bg-black/80 text-white p-5 rounded-lg border border-gray-700"
      style={{ zIndex: 200, pointerEvents: 'auto', maxWidth: '260px' }}
    >
      <h3 className="font-bold text-base mb-4 text-blue-400">How to use</h3>

      <div className="space-y-4 text-sm">
        <div>
          <div className="flex items-start gap-2 mb-1">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <h4 className="font-semibold text-gray-200">Start the stream</h4>
          </div>
          <p className="text-gray-400 text-xs ml-7">
            Enter a prompt below and press <span className="text-blue-400 font-medium">Start Stream</span> to transform the scene with AI.
          </p>
        </div>

        <div>
          <div className="flex items-start gap-2 mb-1">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <h4 className="font-semibold text-gray-200">Explore</h4>
          </div>
          <p className="text-gray-400 text-xs ml-7">
            Use the controls to move around while AI transforms the visuals in real-time.
          </p>
        </div>

        <div>
          <div className="flex items-start gap-2 mb-1">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <h4 className="font-semibold text-gray-200">Change style</h4>
          </div>
          <p className="text-gray-400 text-xs ml-7">
            Update the prompt and press <span className="text-green-400 font-medium">Send</span> to apply new styles.
          </p>
        </div>
      </div>
    </div>
  );
}
