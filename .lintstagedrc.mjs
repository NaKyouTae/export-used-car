const quote = (files) => files.map((f) => `"${f}"`).join(' ');

export default {
  'app/src/**/*.{ts,tsx}': (files) => [
    `pnpm --filter app exec eslint --no-error-on-unmatched-pattern ${quote(files)}`,
  ],
  'admin/src/**/*.{ts,tsx}': (files) => [
    `pnpm --filter admin exec eslint --no-error-on-unmatched-pattern ${quote(files)}`,
  ],
  'server/src/**/*.ts': (files) => [
    `pnpm --filter server exec eslint --no-error-on-unmatched-pattern ${quote(files)}`,
  ],
};
