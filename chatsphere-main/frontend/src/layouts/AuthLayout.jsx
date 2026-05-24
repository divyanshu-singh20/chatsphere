// import { Outlet } from 'react-router-dom';

// export default function AuthLayout() {
//   return (
//     <div className="min-h-screen overflow-y-auto bg-[var(--wa-bg)] px-4 py-8 text-white sm:px-6 lg:px-8">
//       <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-start justify-center">
//         <div className="grid w-full overflow-hidden rounded-[2rem] border border-[var(--wa-border)] bg-[var(--wa-chat-bg)] shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
//           <div className="hidden flex-col justify-between bg-[linear-gradient(180deg,rgba(10,132,255,0.16),rgba(48,209,88,0.08))] p-10 text-white lg:flex">
//             <div>
//               <div className="mb-6 inline-flex rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-medium backdrop-blur">
//                 ChatSphere
//               </div>
//               <h1 className="max-w-lg text-5xl font-semibold leading-tight">Premium real-time chat for teams and communities.</h1>
//               <p className="mt-5 max-w-xl text-lg text-white/85">
//                 Fast messaging, groups, media sharing, voice notes, calls, and a polished WhatsApp-inspired experience.
//               </p>
//             </div>
//             <div className="grid grid-cols-3 gap-4 text-sm text-white/85">
//               {['Realtime', 'Secure Auth', 'Modern UI'].map((item) => (
//                 <div key={item} className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] p-4">
//                   {item}
//                 </div>
//               ))}
//             </div>
//           </div>
//           <div className="p-6 sm:p-10">
//             <Outlet />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[var(--wa-bg)] text-white overflow-x-hidden overflow-y-auto">
      
      <div className="mx-auto flex w-full max-w-6xl items-start justify-center px-4 py-6 sm:px-6 lg:px-8">
        
        <div className="grid w-full rounded-[2rem] border border-[var(--wa-border)] bg-[var(--wa-chat-bg)] shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
          
          {/* Left Side */}
          <div className="hidden flex-col justify-between bg-[linear-gradient(180deg,rgba(10,132,255,0.16),rgba(48,209,88,0.08))] p-10 text-white lg:flex">
            
            <div>
              <div className="mb-6 inline-flex rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-medium backdrop-blur">
                ChatSphere
              </div>

              <h1 className="max-w-lg text-5xl font-semibold leading-tight">
                Premium real-time chat for teams and communities.
              </h1>

              <p className="mt-5 max-w-xl text-lg text-white/85">
                Fast messaging, groups, media sharing, voice notes,
                calls, and a polished WhatsApp-inspired experience.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm text-white/85">
              {['Realtime', 'Secure Auth', 'Modern UI'].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] p-4"
                >
                  {item}
                </div>
              ))}
            </div>

          </div>

          {/* Right Side */}
          <div className="max-h-screen overflow-y-auto p-6 sm:p-10">
            <Outlet />
          </div>

        </div>

      </div>

    </div>
  );
}