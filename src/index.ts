import * as core from '@actions/core';
import * as github from '@actions/github';
import {LinearClient} from '@linear/sdk';
import {createActionAuth} from '@octokit/auth-action';
import {WebhookPayload} from "@actions/github/lib/interfaces";

let accessToken: string = null;
let labelConfigs: {id: string, branch: string, label: string}[] = [];

async function getGithubApiAuth() {
  try {
    const githubToken = core.getInput('GITHUB_TOKEN');
    console.log('github token ', githubToken?.length);
    const auth = createActionAuth();
    const authentication = await auth();
    console.log(authentication.type, authentication.tokenType);
  } catch(err) {
    console.log('err', err);
  }
}
getGithubApiAuth();

try {
  accessToken = core.getInput('linear_access_token');
} catch(err) {
  core.setFailed('Unable to get linear access token');
  process.exit();
}

try {
  labelConfigs = JSON.parse(core.getInput('labels'));
} catch(err) {
  core.setFailed('Unable to get label configs ' + err);
  process.exit();
}

const linear = new LinearClient({apiKey: accessToken});

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
 * Assign label to passed issue
 * @param issueId
 * @param labelInput
 * @return Promise<void>
 */
async function insertLabelToIssue(issueId: string, labelInput: {id: string, name: string}): Promise<void> {
  const issue = await linear.issue(issueId);
  if(!issue?.id) return;

  const [team, existingLabels] = await Promise.all([issue.team, (await issue.labels()).nodes]);
  if(!team?.id) return;

  await linear.issueLabelCreate({id: labelInput.id, name: labelInput.name, teamId: team.id});
  await issue.update({ labelIds: existingLabels.map(l => l?.id).concat(labelInput.id) });

  console.log(`label ${labelInput.name} added to ${issueId}`);
}

/**
 * Main function to run the github action
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