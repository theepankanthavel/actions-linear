const {Octokit} = require('@octokit/rest');
import config from '../config';

/**
 * Main function
 * @param owner
 * @param repo
 * @param branch
 */
export default function (owner: string, repo: string, branch: string) {
  return {
    getBranch: () => getBranch(owner, repo, branch),
    getFileContent: (filePath: string) => getFileContent(owner, repo, branch, filePath)
  }
}

/**
 * Get branch details
 * @param owner
 * @param repo
 * @param branch
 */
async function getBranch(owner: string, repo: string, branch: string) {
  const octokit = new Octokit({auth: config.githubToken});
  const payload = await octokit.repos.getBranch({owner, repo, branch});

  return payload.data;
}

/**
 * Read given file's content
 * @param owner
 * @param repo
 * @param branch
 * @param filePath
 * @returns Promise<string> file content
 */
async function getFileContent(owner: string, repo: string, branch: string, filePath: string): Promise<string> {
  const octokit = new Octokit({auth: config.githubToken});
  const payload = await octokit.repos.getContent({
    owner,
    repo,
    ref: branch,
    path: filePath
  });
  console.log(payload);
  return Buffer.from(payload.data.content, 'base64').toString('utf-8');
}