// Reject Node.js versions older than the 21 October 2026 security fixes.
// See https://nodejs.org/en/blog/vulnerability/october-2026-security-releases
const fixedMinimums = new Map([[22, [23, 4]], [24, [22, 1]], [26, [12, 1]]]);
const raw = process.versions.node;
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(raw);
const [major, minor, patch] = match ? match.slice(1).map(Number) : [0, 0, 0];
const minimum = fixedMinimums.get(major);
const patched = !!minimum && (minor > minimum[0] || (minor === minimum[0] && patch >= minimum[1]));
if (!patched) {
  console.error(`Node.js v${raw} is unsupported or potentially vulnerable. Require vendor-fixed v22.23.4+, v24.22.1+, or v26.12.1+ (within supported major).`);
  process.exit(1);
}
