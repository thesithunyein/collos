/**
 * The single storage key, shared by both platform implementations so a state
 * file written by one shape of the build is never orphaned by the other.
 */
export function fileStoreKey(): string {
  return "collos.care.v1";
}
