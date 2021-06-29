const {Octokit} = require('@octokit/rest');
import config from '../config';

export default function git(owner: string, repo: string, branch: string) {
  return {
    getBranch() {
      return getBranch(owner, repo, branch);
    },
    getFileContent(filePath: string) {
      return getFileContent(owner, repo, branch, filePath)
    }
  }
}

async function getBranch(owner: string, repo: string, branch: string) {
  const octokit = new Octokit({
    auth: config.githubToken
  });

  const payload = await octokit.repos.getBranch({
    owner,
    repo,
    branch
  });

  return payload.data;
}

async function getFileContent(owner: string, repo: string, branch: string, filePath: string): Promise<string> {
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