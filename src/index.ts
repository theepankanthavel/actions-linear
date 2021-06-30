import * as core from '@actions/core';
import * as github from '@actions/github';
import {WebhookPayload} from "@actions/github/lib/interfaces";
import {insertLabelToIssue} from "./modules/linear";
import githubApi from "./modules/github";
import config from "./config";

const NO_ACTION = 'NO_ACTION';
const FEATURE_COMPLETE = 'FEATURE_COMPLETE';
/**
 * Helper function to parse commit message and return issue ids
 * @param commitMessage
 * @return string[]
 */
function parseIssueIds(commitMessage: string): {noAction: boolean, featureComplete: boolean, ids: string[]} {
  const pattern = /^ref:\s?(.+)$/gmi;
  const matches = pattern.exec(commitMessage);
  if(!matches) {
    return {
      noAction: true,
      featureComplete: false,
      ids:  []
    }
  }
  const ids = matches[1].split(',').map(v => v.trim());
  return {
    noAction: ids.includes(NO_ACTION),
    featureComplete: ids.includes(FEATURE_COMPLETE),
    ids: ids.filter(id => [NO_ACTION, FEATURE_COMPLETE].includes(id) === false)
  };
}

/**
 * Main function to run the modules action
 * @return Promise<void>
 */
async function main(): Promise<void> {
  const {payload, eventName}: { payload: WebhookPayload, eventName: string } = github.context;
  if(eventName !== 'push') return;

  const {owner, repo} = github.context.repo;
  const [, branch] = payload.ref.split('refs/heads/');

  const githubApiClient = githubApi(owner, repo, branch);
  const branchData = await githubApiClient.getBranch();

  console.log('branch data', branchData);
  if(!branchData.protected) {
    console.log('branch is not protected. Skipping this workflow.')
    return;
  }

  const payloadStr = JSON.stringify(payload, undefined, 2);
  console.log('payload', payloadStr);


  const issueIdsForBranchLabel = new Set();
  const issueIdsForVersionLabel = new Set();

  const parts = payload.ref.split("refs/heads/");
  const labelConf = config.labelConfigs.find((conf: any) => conf.branch === parts?.[1]);
  if(!labelConf) return;
  payload.commits.forEach((commit: any) => {
    const parseIssues = parseIssueIds(commit.message);
    console.log('parsed ids',  parseIssues);
    if(parseIssues.noAction) return;
    parseIssues.ids.forEach(issueId => {
      issueIdsForBranchLabel.add(issueId);
      if(parseIssues.featureComplete) {
        issueIdsForVersionLabel.add(issueId);
      }
    });
  });

  const tasks: Promise<void>[] = Array.from(issueIdsForBranchLabel).map((issueId: string) =>
    insertLabelToIssue(issueId, {
      id: labelConf.id,
      name: `deployed-in-${branch}`
    })
  );

  if(issueIdsForVersionLabel.size > 0) {
    const packageJsonContent = await githubApiClient.getFileContent('package.json');
    const packageJson = JSON.parse(packageJsonContent);
    Array.from(issueIdsForVersionLabel).forEach((issueId: string) =>
      tasks.push(insertLabelToIssue(issueId, {
        id: labelConf.id,
        name: `version-${packageJson.version}`
      })
    ));
  }

  const result = await Promise.allSettled(tasks);
  console.log(result);

}

main().catch(err => core.setFailed(err));