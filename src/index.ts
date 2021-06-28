import * as core from '@actions/core';
import * as github from '@actions/github';
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
    console.log('issueIds', JSON.stringify(issueIds));
  }
} catch (err) {
  core.setFailed(err);
}

function parseIssueIds(commitMessage: string): string[] {
  const pattern = /^ref:\s(.+)$/gmi;
  const matches = pattern.exec(commitMessage);
  if(!matches) return [];
  return matches[1].split(',').map(v => v.trim());
}