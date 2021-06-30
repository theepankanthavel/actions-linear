import * as core from '@actions/core';
import * as github from '@actions/github';
import {WebhookPayload} from "@actions/github/lib/interfaces";
import {insertLabelToIssue} from "./modules/linear";
import githubApi from "./modules/github";
import {parseIssueIds} from "./util";

/**
 * Main function to run the github action
 * @return Promise<void>
 */
async function main(): Promise<void> {
  const {payload, eventName}: { payload: WebhookPayload, eventName: string } = github.context;
  if(eventName !== 'push') return;

  const {owner, repo} = github.context.repo;
  const [, branch] = payload.ref.split('refs/heads/');

  const githubApiClient = githubApi(owner, repo, branch);
  const branchData = await githubApiClient.getBranch();

  if(!branchData.protected) {
    console.log('branch is not protected. Skipping this workflow.')
    return;
  }

  payload.commits.forEach((c: any) => console.log(c.message));
  const issueIds = parseIssueIds(payload.commits);
  console.log('issue ids', issueIds);

  const packageJsonContent = await githubApiClient.getFileContent('package.json');
  const packageJson = JSON.parse(packageJsonContent);
  const tasks: Promise<void>[] = Object.keys(issueIds).map((issueId: string) => {
    const labels = [`deployed-in-${branch}`];
    if(issueIds[issueId].featureComplete) {
      labels.push(`version-${packageJson.version}`);
    }
    return insertLabelToIssue(issueId, labels)
  });

  const result = await Promise.allSettled(tasks);
  console.log(result);
}

main().catch(err => core.setFailed(err));