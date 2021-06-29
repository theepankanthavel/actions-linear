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

  // await linear.issueLabelCreate({id: labelInput.id, name: labelInput.name, teamId: team.id});
  // await issue.update({ labelIds: existingLabels.map(l => l?.id).concat(labelInput.id) });

  console.log(`label ${labelInput.name} added to ${issueId}`);
}
