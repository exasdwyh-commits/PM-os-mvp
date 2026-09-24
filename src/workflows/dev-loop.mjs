export async function runDevLoop({ spec, workforce, workers }) {
  return workforce.softwareLoop({
    spec,
    coder: workers.coder,
    qa: workers.qa,
    reviewer: workers.reviewer,
    maxRounds: 3
  });
}
