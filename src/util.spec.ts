import {parseIssueIds} from './util';


test('Collects issue ids and flag(i.e. featureComplete) from commit messages', () => {
  const commits = [{
    message: `fix: subject line
    body text
    ref: NO_ACTION,POD-431,POD-100`
  }, {
    message:`build: subject line
    body text
    ref: FEATURE_COMPLETE,POD-396`
  }];
  const issueIds = parseIssueIds(commits);
  expect(issueIds).toEqual({
    'POD-396': {featureComplete: true}
  });
});