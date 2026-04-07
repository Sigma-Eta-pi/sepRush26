import { GraduationCap } from "lucide-react";

export default function AlumniFinder() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-[#05006C]/10 rounded-full flex items-center justify-center mb-4">
        <GraduationCap size={28} className="text-[#05006C]/40" />
      </div>
      <h2 className="text-2xl font-bold text-[#05006C] tracking-widest">
        ALUMNI FINDER
      </h2>
      <p className="text-[#05006C]/50 mt-2 max-w-sm">
        Search and connect with SEP alumni — coming soon.
      </p>
    </div>
  );
}
