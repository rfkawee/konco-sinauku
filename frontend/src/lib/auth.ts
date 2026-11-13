/**
 * Utility untuk mengelola Member ID secara konsisten dan deterministik.
 */

export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0').slice(0, 8);
}

export function generateMemberId(email: string, supabaseUid?: string): string {
  if (supabaseUid) {
    const cleanUid = supabaseUid.replace(/-/g, '').slice(0, 8).toUpperCase();
    return `MBR-${cleanUid}`;
  }
  const emailHash = hashString(email.trim().toLowerCase());
  return `MBR-${emailHash}`;
}

export function getMemberId(): string {
  return localStorage.getItem('konco_member_id') || 'MBR-GUEST';
}

export function setMemberId(memberId: string): void {
  localStorage.setItem('konco_member_id', memberId);
}

export function clearMemberId(): void {
  localStorage.removeItem('konco_member_id');
}
