import * as core from '@actions/core';
import * as github from '@actions/github';
import * as config from './config';
import {WebhookPayload} from "@actions/github/lib/interfaces";
import {insertLabelToIssue} from "./modules/linear";

let accessToken: string = null;
let labelConfigs: {id: string, branch: string, label: string}[] = [];
let packageJsonFiles: {package: string, path: string}[] = [];

try {
  accessToken = core.getInput('linear_access_token');
  labelConfigs = JSON.parse(core.getInput('labels'));
  packageJsonFiles = JSON.parse(core.getInput('package_json_path'));
  config.init({accessToken, labelConfigs, packageJsonFiles});
} catch(err) {
  core.setFailed('Invalid inputs ' + err.message);
  process.exit();
}

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
  const payloadStr = JSON.stringify(payload, undefined, 2);
  console.log('payload', payloadStr);
  if (github.context.eventName === 'push') {
    const issueIds = new Set();
    const parts = payload.ref.split("refs/heads/");
    const labelConf = labelConfigs.find(conf => conf.branch === parts?.[1]);
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