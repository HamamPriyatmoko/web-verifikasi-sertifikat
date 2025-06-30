// src/utils/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * Custom Hook untuk menunda pembaruan nilai.
 * Sangat berguna untuk input pencarian agar tidak memicu filter di setiap ketukan keyboard.
 * @param {any} value Nilai yang ingin ditunda (misal: searchTerm).
 * @param {number} delay Waktu tunda dalam milidetik (misal: 500).
 * @returns Nilai yang sudah ditunda.
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set timeout untuk update nilai setelah delay berakhir
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Bersihkan timeout jika 'value' berubah (misal: pengguna mengetik lagi)
    // Ini mencegah nilai lama di-set jika pengguna terus mengetik.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Hanya jalankan ulang efek jika 'value' atau 'delay' berubah

  return debouncedValue;
}
