const HYPHENMINUS = 45; // '-'.charCodeAt()

export function has_vendor_prefix(keyword: string): boolean {
  if (keyword.charCodeAt(0) === HYPHENMINUS && keyword.charCodeAt(1) !== HYPHENMINUS) {
    // String must have a 2nd occurrence of '-', at least at position 3 (offset=2)
    if (keyword.indexOf('-', 2) !== -1) {
      return true
    }
  }

  return false
}

export function basename(keyword: string): string {
  return keyword.slice(keyword.indexOf('-', 2))
}
