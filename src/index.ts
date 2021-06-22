import * as core from '@actions/core';
import * as github from '@actions/github';
<<<<<<< HEAD
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

  const versionFile = await githubApiClient.getFileContent('config.json');
  const packageJson = JSON.parse(versionFile);
  const tasks: Promise<void>[] = Object.keys(issueIds).map((issueId: string) => {
    const labels = [`deployed-in-${branch}`];
    if(issueIds[issueId].featureComplete) {
      console.log('version ---', `version-${packageJson['env:default']['laneVersion']}`);
      labels.push(`version-${packageJson['env:default']['laneVersion']}`);
    }
    return insertLabelToIssue(issueId, labels)
  });

  const result = await Promise.allSettled(tasks);
  console.log(result);
}

main().catch(err => core.setFailed(err));
=======
import * as LinearClient from '@linear/sdk';
import {WebhookPayload} from "@actions/github/lib/interfaces";

let accessToken: string = null;
let labelConfigs: {id: string, branch: string, label: string}[] = [];

try {
  accessToken = core.getInput('linear_access_token');
} catch(err) {
  core.setFailed('Unable to get linear access token');
  process.exit();
}

try {
  labelConfigs = JSON.parse(core.getInput('labels'));
  console.log(labelConfigs[0].branch);

} catch(err) {
  core.setFailed('Unable to get label configs ' + err);
  process.exit();
}

try {
  const {payload}: {payload: WebhookPayload} = github.context;
  const payloadStr = JSON.stringify(payload, undefined, 2);
  console.log('payload', payloadStr);
  if(github.context.eventName === 'push') {
    const issueIds = new Set();
    payload.commits.forEach((commit: any) => {
      parseIssueIds(commit.message).forEach(issueId => issueIds.add(issueId));
    });
    console.log('issueIds', JSON.stringify(Array.from(issueIds)));
  }
} catch (err) {
  core.setFailed(err);
}

function parseIssueIds(commitMessage: string): string[] {
  const pattern = /^ref:\s(.+)$/gmi;
  const [, refs] = pattern.exec(commitMessage);
  return refs.split(',').map(v => v.trim());
}
>>>>>>> 71129cd (typescript version)
