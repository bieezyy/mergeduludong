"use client";

import React, { useState } from "react";
import { Coffee, X, Copy, Check, Heart, Smartphone } from "lucide-react";

export const GiveACoffee = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // E-Wallet donation accounts
  const paymentMethods = [
    {
      id: "dana",
      name: "DANA",
      color: "from-blue-500 to-sky-600",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      badgeColor: "bg-blue-600 text-white",
      accountNumber: "0812-3456-7890",
      accountName: "MergeDuluDong Creator",
    },
    {
      id: "ovo",
      name: "OVO",
      color: "from-purple-600 to-indigo-700",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      badgeColor: "bg-purple-600 text-white",
      accountNumber: "0812-3456-7890",
      accountName: "MergeDuluDong Creator",
    },
    {
      id: "gopay",
      name: "GoPay",
      color: "from-emerald-500 to-teal-600",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      badgeColor: "bg-emerald-600 text-white",
      accountNumber: "0812-3456-7890",
      accountName: "MergeDuluDong Creator",
    },
  ];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text.replace(/[^0-9]/g, ""));
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <>
      {/* Give a Coffee Trigger Button */}
      <div className="Give a Coffe my-6 flex justify-center">
        <button
          onClick={() => setIsOpen(true)}
          className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Coffee className="w-4 h-4 transition-transform group-hover:rotate-12" />
          <span>Give a Coffee</span>
          <Heart className="w-3.5 h-3.5 text-red-200 fill-red-200 ml-0.5" />
        </button>
      </div>

      {/* Donation Modal Pop-up */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative overflow-hidden">
            {/* Background Header Decoration */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-100 rounded-full opacity-60 pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between relative mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
                  <Coffee className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Traktir Secangkir Kopi ☕
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dukung pemeliharaan dan hosting server aplikasi ini.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Donation Methods List */}
            <div className="space-y-3">
              {paymentMethods.map((pm) => {
                const isCopied = copiedKey === pm.id;
                return (
                  <div
                    key={pm.id}
                    className={`p-4 rounded-2xl border ${pm.borderColor} ${pm.bgColor} flex items-center justify-between transition-all hover:shadow-sm`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-xs shadow-sm ${pm.badgeColor}`}
                      >
                        {pm.name}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span>Donate with {pm.name}</span>
                        </div>
                        <div className="text-xs font-mono font-medium text-slate-600 mt-0.5">
                          {pm.accountNumber}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          a.n. {pm.accountName}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => copyToClipboard(pm.accountNumber, pm.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isCopied
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-xs"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer / QRIS Note */}
            <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Terima kasih banyak atas apresiasi dan dukungan Anda! ❤️
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
