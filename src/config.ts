import * as core from '@actions/core';

type Config = {
  accessToken: string;
  githubToken: string;
};

let config: Config = {
  accessToken: '',
  githubToken: '',
};

try {
  config = {
    accessToken: core.getInput('LINEAR_API_KEY'),

    githubToken: core.getInput('GITHUB_TOKEN'),
  };
} catch (err) {
  core.setFailed(`Invalid inputs ${err.message}`);
  process.exit();
}

export default config;
