import * as core from '@actions/core';
import * as github from '@actions/github';
import { WebhookPayload } from '@actions/github/lib/interfaces';
import PromisePool from '@supercharge/promise-pool';

import githubApi from './modules/github';
import { insertLabelToIssue } from './modules/linear';
import { parseIssueIds } from './util';
import config from './config';

/**
 * Main function to run the github action
 * @return Promise<void>
 */
async function main(): Promise<void> {
  const {
    payload,
    eventName,
  }: { payload: WebhookPayload; eventName: string } = github.context;
  if (eventName !== 'push') {
    return;
  }

  const { owner, repo } = github.context.repo;
  const [, branch] = payload.ref.split('refs/heads/');

  const githubApiClient = githubApi(owner, repo, branch);
  const branchData = await githubApiClient.getBranch();

  if (!branchData.protected) {
    console.log('branch is not protected. Skipping this workflow.');
    return;
  }

  const issueIds = parseIssueIds(payload.commits);
  console.log('issue ids', issueIds);

  let versionFile = '';
  try {
    versionFile = await githubApiClient.getFileContent(
      'config.json'
    );
  } catch(err) {
    console.log('err in version file', err);
  }
  console.log('versionFile --', versionFile);
  const packageJson = JSON.parse(versionFile);
  const taskInput: { issueId: string; labels: string[] }[] = Object.keys(
    issueIds
  ).map((issueId: string) => {
    const branchName = (config.branchNames[branch] && config.branchNames[branch].length) ? config.branchNames[branch] : branch;
    const labels = [`live-in-${branchName}`];
    if (issueIds[issueId].featureComplete) {
      labels.push(`version-${packageJson['env:default'].laneVersion}`);
    }
    return { issueId, labels };
  });

  const { errors } = await PromisePool.for(taskInput).process(
    async ({ issueId, labels }) => await insertLabelToIssue(issueId, labels)
  );
  console.log('errors', errors);
  errors.forEach(taskError => console.log(taskError.message));
}

main().catch(err => core.setFailed(err));
