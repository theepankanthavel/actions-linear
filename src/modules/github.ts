const {Octokit} = require('@octokit/rest');
import config from '../config';

export async function getBranch(owner: string, repo: string, branch: string) {
  const octokit = new Octokit({
    auth: config.githubToken
  });

  const payload = await octokit.repos.getBranch({
    owner,
    repo,
    branch
  });

  console.log('github branch', payload.data);
}
