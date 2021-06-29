import * as core from '@actions/core';
import * as github from '@actions/github';
import {WebhookPayload} from "@actions/github/lib/interfaces";
import {insertLabelToIssue} from "./modules/linear";
import {getBranch, getFileContent} from "./modules/github";
import config from "./config";

/**
 * Helper function to parse commit message and return issue ids
 * @param commitMessage
 * @return string[]
 */
function parseIssueIds(commitMessage: string): string[] {
  const pattern = /^ref:\s?(.+)$/gmi;
  const matches = pattern.exec(commitMessage);
  if(!matches) return [];
  const ids = matches[1].split(',').map(v => v.trim());
  if(ids.includes('NO_ACTION')) return [];
  return ids;
}

/**
 * Main function to run the modules action
 * @return Promise<void>
 */
async function main(): Promise<void> {
  const {payload}: { payload: WebhookPayload } = github.context;

  const {owner, repo} = github.context.repo;
  console.log('github', owner, repo);
  await getBranch(owner, repo, 'develop');
  const packageJsonContent = await getFileContent(owner, repo, 'develop', 'package.json');


  const packageJson = JSON.parse(packageJsonContent);
  console.log('package version', packageJson.version);

  const payloadStr = JSON.stringify(payload, undefined, 2);
  console.log('payload', payloadStr);
  if (github.context.eventName === 'push') {
    const issueIds = new Set();
    const parts = payload.ref.split("refs/heads/");
    const labelConf = config.labelConfigs.find((conf: any) => conf.branch === parts?.[1]);
    if(!labelConf) return;
    payload.commits.forEach((commit: any) =>
      parseIssueIds(commit.message).forEach(issueId => issueIds.add(issueId))
    );
    const tasks: Promise<void>[] = Array.from(issueIds).map((issueId: string) =>
      insertLabelToIssue(issueId, {
        id: labelConf.id,
        name: `deployed-in-${labelConf.branch}`
      })
    );
    const result = await Promise.allSettled(tasks);
    console.log(result);
  }
}

main().catch(err => core.setFailed(err));