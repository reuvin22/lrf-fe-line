import React from "react";
import { Clock, UserCheck, Mail } from "lucide-react";
import { useAttendanceContext } from "../context/AttendanceContext";

const LETTERS = [
  { char: "L", color: "hsl(155, 55%, 35%)" },
  { char: "R", color: "hsl(90, 50%, 45%)" },
  { char: "F", color: "hsl(155, 55%, 35%)" },
];

function PendingApproval() {
  const { employee } = useAttendanceContext();

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-b from-[hsl(140,60%,95%)] via-[hsl(140,50%,90%)] to-[hsl(80,50%,88%)] px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-15"
            style={{
              width: `${24 + i * 12}px`,
              height: `${24 + i * 12}px`,
              left: `${6 + i * 16}%`,
              bottom: `-${10 + i * 4}px`,
              backgroundColor:
                i % 2 === 0 ? "hsl(155, 55%, 40%)" : "hsl(90, 50%, 50%)",
              animation: `pending-float ${4 + i * 0.5}s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        <div className="flex gap-2 mb-6">
          {LETTERS.map((letter, i) => (
            <span
              key={i}
              className="text-4xl sm:text-5xl font-extrabold"
              style={{
                color: letter.color,
                textShadow: "2px 3px 0px rgba(0,0,0,0.1)",
                fontFamily:
                  "'Comic Sans MS', 'Chalkboard SE', 'Arial Rounded MT Bold', system-ui, sans-serif",
              }}
            >
              {letter.char}
            </span>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-md w-full p-6 flex flex-col items-center text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{
              background:
                "linear-gradient(135deg, hsl(155, 55%, 40%) 0%, hsl(90, 50%, 50%) 100%)",
            }}
          >
            <Clock size={36} className="text-white" />
          </div>

          <h1
            className="text-xl font-bold mb-2"
            style={{ color: "hsl(155, 55%, 30%)" }}
          >
            Awaiting Admin Approval
          </h1>

          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            Your account has been registered. The administrator needs to complete
            your information before you can start using the app.
          </p>

          <div className="w-full bg-[hsl(140,60%,97%)] border border-[hsl(140,40%,85%)] rounded-xl p-4 space-y-3 text-left">
            <div className="flex items-start gap-3">
              <UserCheck
                size={18}
                className="mt-0.5 flex-shrink-0"
                style={{ color: "hsl(155, 55%, 40%)" }}
              />
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-gray-500">
                  Name
                </p>
                <p className="text-sm font-semibold text-gray-800 break-words">
                  {employee?.name || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail
                size={18}
                className="mt-0.5 flex-shrink-0"
                style={{ color: "hsl(90, 50%, 40%)" }}
              />
              <div className="min-w-0 w-full">
                <p className="text-[11px] uppercase tracking-wider text-gray-500">
                  LINE User ID
                </p>
                <p className="text-xs font-mono text-gray-700 break-all">
                  {employee?.line_user_id || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 text-xs text-gray-500">
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                style={{ backgroundColor: "hsl(90, 50%, 50%)" }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: "hsl(155, 55%, 40%)" }}
              />
            </span>
            Waiting for admin to complete your profile
          </div>
        </div>

        <p className="mt-5 text-xs text-center text-gray-500 max-w-xs">
          Please contact your administrator if this takes longer than expected.
        </p>
      </div>

      <style>{`
        @keyframes pending-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-90px) scale(1.1); }
        }
      `}</style>
    </div>
  );
}

export default PendingApproval;
