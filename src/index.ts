import * as core from '@actions/core';
import * as github from '@actions/github';
import {WebhookPayload} from "@actions/github/lib/interfaces";
import {insertLabelToIssue} from "./modules/linear";
import githubApi from "./modules/github";
import {parseIssueIds} from "./util";

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


  const issueIds = parseIssueIds(payload.commit);
  console.log('issue ids', issueIds);
  // const issueIdsForVersionLabel = new Set();

  // payload.commits.forEach((commit: any) => {
  //   const parseIssues = parseIssueIds(commit.message);
  //   console.log('parsed ids',  parseIssues);
  //   if(parseIssues.noAction) return;
  //   parseIssues.ids.forEach(issueId => {
  //     issueIds.add(issueId);
  //     if(parseIssues.featureComplete) {
  //       issueIdsForVersionLabel.add(issueId);
  //     }
  //   });
  // });

  const packageJsonContent = await githubApiClient.getFileContent('package.json');
  const packageJson = JSON.parse(packageJsonContent);
  const tasks: Promise<void>[] = Object.keys(issueIds).map((issueId: string) => {
    const labels = [`deployed-in-${branch}`];
    if(issueIds[issueId].featureComplete) {
      labels.push(`version-${packageJson.version}`);
    }
    return insertLabelToIssue(issueId, labels)
  });

  // if(issueIdsForVersionLabel.size > 0) {
  //   const packageJsonContent = await githubApiClient.getFileContent('package.json');
  //   const packageJson = JSON.parse(packageJsonContent);
  //   Array.from(issueIdsForVersionLabel).forEach((issueId: string) =>
  //     tasks.push(insertLabelToIssue(issueId, {
  //       name: `version-${packageJson.version}`
  //     })
  //   ));
  // }

  const result = await Promise.allSettled(tasks);
  console.log(result);
}

main().catch(err => core.setFailed(err));