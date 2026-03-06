/**
 * Safely copy text to clipboard with fallback for when Clipboard API is blocked
 * @param text The text to copy
 * @returns true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try using the Clipboard API first
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    // Clipboard API blocked or failed, use fallback
    console.warn("Clipboard API blocked, using fallback method");
  }

  // Fallback method using textarea
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-999999px";
    textarea.style.top = "-999999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    return successful;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}