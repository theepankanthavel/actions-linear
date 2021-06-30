import {LinearClient} from "@linear/sdk";
import config from '../config';

/**
 * Assign label to passed issue
 * @param issueId
 * @param labelInput
 * @return Promise<void>
 */
export async function insertLabelToIssue(issueId: string, labelInput: {id: string, name: string}): Promise<void> {
  const linear = new LinearClient({apiKey: config.accessToken});
  const issue = await linear.issue(issueId);
  if(!issue?.id) return;

  const [team, existingLabels] = await Promise.all([issue.team, (await issue.labels()).nodes]);
  if(!team?.id) return;

  let issueLabelId: string;
  try {
    const createIssueLabel = await linear.issueLabelCreate({name: labelInput.name, teamId: team.id});
    issueLabelId = (await createIssueLabel.issueLabel).id;
  } catch(err) {
    issueLabelId = await getIssueLabelId(team.id, labelInput.name);
  }
  await issue.update({ labelIds: existingLabels.map(l => l?.id).concat(issueLabelId) });
  console.log(`label ${labelInput.name} added to ${issueId}`);
}

/**
 * Get issue label id by name and team id
 * @param teamId
 * @param labelName
 * @returns Promise<string> label id
 */
async function getIssueLabelId(teamId: string, labelName: string): Promise<string> {
  const linear = new LinearClient({apiKey: config.accessToken});
  const team = await linear.team(teamId);
  let lastIssueId: string = null;
  while(true) {
    const response = await team.labels({first: 250, after: lastIssueId});
    const issueLabel = response.nodes.find(node => node.name === labelName.trim());
    if(issueLabel) {
      return issueLabel.id;
    }
    if(!response.pageInfo.hasNextPage) {
      throw 'Issue label id not found';
    }
    lastIssueId = response.nodes[response.nodes.length -1].id;
  }
}