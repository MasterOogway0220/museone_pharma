"use client";

// Desktop app prints straight to the receipt printer; a browser shows its print dialog.
export function printReceipt() {
  const desktop = (window as { museoneDesktop?: { print: () => Promise<boolean> } }).museoneDesktop;
  if (desktop) void desktop.print();
  else window.print();
}
