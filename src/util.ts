type IssueIds = {
  [key: string]: {featureComplete: boolean}
}

const NO_ACTION = 'NO_ACTION';
const FEATURE_COMPLETE = 'FEATURE_COMPLETE';

/**
 * Helper function to parse commit message and return issue ids
 * @param commits
 * @return string[]
 */
export function parseIssueIds(commits: {message: string}[]): IssueIds {
  const collection: IssueIds = {};

  commits.forEach(({message}) => {
    const pattern = /^\s*ref:\s?(.+)$/gmi;
    const matches = pattern.exec(message);
    if(!matches) return;
    const ids = matches[1].split(',').map(v => v.trim());
    if(ids.includes(NO_ACTION)) return;
    const featureComplete = ids.includes(FEATURE_COMPLETE);
    ids.filter((id) => [NO_ACTION, FEATURE_COMPLETE].includes(id) === false)
      .forEach(id => {
      collection[id] = Object.assign(collection[id] || {}, {
        featureComplete: collection[id]?.featureComplete || featureComplete
      });
    });
  });
  return collection;
}
