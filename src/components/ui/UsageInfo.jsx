export default function UsageInfo() {
  return (
    <div
      data-daydream-ui
      className="fixed right-4 top-1/2 -translate-y-1/2 bg-black/80 text-white p-5 rounded-lg border border-gray-700"
      style={{ zIndex: 200, pointerEvents: 'auto', maxWidth: '280px' }}
    >
      <h3 className="font-bold text-base mb-4 text-blue-400">Cómo usar</h3>

      <div className="space-y-4 text-sm">
        {/* Step 1 */}
        <div>
          <div className="flex items-start gap-2 mb-1">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <h4 className="font-semibold text-gray-200">Iniciar stream</h4>
          </div>
          <p className="text-gray-400 text-xs ml-7">
            Ingresá un prompt abajo y presioná <span className="text-blue-400 font-medium">Start Stream</span> para transformar el juego con IA.
          </p>
        </div>

        {/* Step 2 */}
        <div>
          <div className="flex items-start gap-2 mb-1">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <h4 className="font-semibold text-gray-200">Explorar</h4>
          </div>
          <p className="text-gray-400 text-xs ml-7">
            Usá los controles para moverte por el mundo mientras la IA transforma los visuales en tiempo real.
          </p>
        </div>

        {/* Step 3 */}
        <div>
          <div className="flex items-start gap-2 mb-1">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <h4 className="font-semibold text-gray-200">Cambiar estilo</h4>
          </div>
          <p className="text-gray-400 text-xs ml-7">
            Modificá el prompt y presioná <span className="text-green-400 font-medium">Send</span>. Los cambios pueden tardar unos segundos.
          </p>
        </div>

        {/* Troubleshooting */}
        <div className="pt-3 border-t border-gray-700">
          <div className="flex items-start gap-2 mb-1">
            <span className="text-yellow-400">⚠️</span>
            <h4 className="font-semibold text-gray-200 text-xs">¿Se trabó?</h4>
          </div>
          <p className="text-gray-400 text-xs ml-6">
            Presioná <span className="text-red-400 font-medium">Stop</span> y volvé a hacer <span className="text-blue-400 font-medium">Start Stream</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
