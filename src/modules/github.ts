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

export async function getFileContent(owner: string, repo: string, branch: string, filePath: string): Promise<string> {
  const octokit = new Octokit({
    auth: config.githubToken
  });
  const payload = await octokit.repos.getContent({
    owner,
    repo,
    ref: branch,
    path: filePath
  });
  console.log(payload);
  return Buffer.from(payload.data.content, 'base64').toString('utf-8');
}