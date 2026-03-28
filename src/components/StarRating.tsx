"use client";

import { useState } from "react";

type StarRatingProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function StarRating({ value, onChange, disabled }: StarRatingProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className={`text-3xl transition-transform ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110"
          } ${
            star <= (hover || value)
              ? "text-yellow-400"
              : "text-gray-300"
          }`}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => !disabled && setHover(0)}
          onClick={() => !disabled && onChange(star)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
