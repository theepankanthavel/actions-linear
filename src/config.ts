import * as core from '@actions/core';

type Config = {
  accessToken: string;
  githubToken: string;
  branchNames: {[key: string]: string}
};

let config: Config = {
  accessToken: '',
  githubToken: '',
  branchNames: {}
};

try {
  config = {
    accessToken: core.getInput('LINEAR_API_KEY'),
    githubToken: core.getInput('GITHUB_TOKEN'),
    branchNames: JSON.parse(core.getInput('BRANCH_NAMES'))
  };
  console.log(config.branchNames);
} catch (err) {
  core.setFailed(`Invalid inputs ${err.message}`);
  process.exit();
}

export default config;
