import { parseIssueIds } from './util';

test('Collects issue ids and flag(i.e. featureComplete) from commit messages', () => {
  const commits = [
    {
      message: `fix: subject line
    body text
    Ref: NO_ACTION,POD-431,POD-100`,
    },
    {
      message: `build: subject line
    body text
    ref: FEATURE_COMPLETE,POD-396`,
    },
    {
      message: `build: subject line
    body text
    refs: FEATURE_COMPLETE,POD-397`,
    },
    {
      message: `build: subject line
    body text
    ref FEATURE_COMPLETE,POD-398`,
    },
  ];
  const issueIds = parseIssueIds(commits);
  expect(issueIds).toEqual({
    'POD-396': { featureComplete: true },
    'POD-397': { featureComplete: true },
    'POD-398': { featureComplete: true },
  });
});
