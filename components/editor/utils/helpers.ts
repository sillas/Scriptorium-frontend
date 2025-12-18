import { useCallback } from "react";

export const countWords = (text: string) => {
  return text === '' ? 0 : text.split(/\s+/).length;
}