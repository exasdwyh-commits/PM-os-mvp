export const workers = {
  coder: async ({ spec, round }) => ({ kind: 'patch', round, summary: `Implement ${spec.slice(0, 80)}`, files: ['src/example.mjs'] }),
  qa: async ({ artifact, round }) => ({ pass: round >= 2, tests: 12, failed: round >= 2 ? 0 : 1, artifact }),
  reviewer: async ({ test, round }) => ({ pass: test.pass && round >= 2, findings: test.pass ? [] : ['Need one more fix cycle'] })
};
