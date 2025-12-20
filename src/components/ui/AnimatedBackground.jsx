export default function AnimatedBackground() {
  return (
    <div
      className="fixed inset-0"
      style={{
        zIndex: 0,
        background: 'linear-gradient(45deg, #0f172a, #1a4d5e, #0e4d42, #1e3a5f)',
        backgroundSize: '400% 400%',
        animation: 'gradientFlow 15s ease infinite',
      }}
    >
      <style>{`
        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}
