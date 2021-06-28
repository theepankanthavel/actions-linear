import * as core from '@actions/core';
import * as github from '@actions/github';
import {LinearClient} from '@linear/sdk';
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

const linear = new LinearClient({apiKey: accessToken});

function parseIssueIds(commitMessage: string): string[] {
  const pattern = /^ref:\s(.+)$/gmi;
  const matches = pattern.exec(commitMessage);
  if(!matches) return [];
  return matches[1].split(',').map(v => v.trim());
}

async function insertLabelToIssue(issueId: string, labelInput: {id: string, name: string}): Promise<void> {
  const issue = await linear.issue(issueId);
  const [team, labels] = await Promise.all([issue?.team, (await issue?.labels()).nodes]);

  if(!team || !team?.id) return;

  await linear.issueLabelCreate({id: labelInput.id, name: labelInput.name, teamId: team.id});
  await issue.update({ labelIds: labels.map(l => l?.id).concat(labelInput.id) });

  console.log(`label ${labelInput.name} added to ${issueId}`);
}

async function main() {
  const {payload}: { payload: WebhookPayload } = github.context;
  const payloadStr = JSON.stringify(payload, undefined, 2);
  console.log('payload', payloadStr);
  if (github.context.eventName === 'push') {
    const issueIds = new Set();
    const parts = payload.ref.split("refs/heads/");
    console.log('parts', parts);
    const labelConf = labelConfigs.find(conf => conf.branch === parts?.[1]);
    if(!labelConf) {
      return;
    }
    payload.commits.forEach((commit: any) => {
      parseIssueIds(commit.message).forEach(issueId => issueIds.add(issueId));
    });
    console.log('issueIds', JSON.stringify(Array.from(issueIds)));
    const tasks: Promise<void>[] = Array.from(issueIds).map((issueId: string) => {
      return insertLabelToIssue(issueId, {
        id: labelConf.id,
        name: `deployed-in-${labelConf.branch}`
      });
    });
    await Promise.all(tasks);
  }
}

main().catch(err => core.setFailed(err));