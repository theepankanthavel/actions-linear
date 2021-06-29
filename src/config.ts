import * as core from '@actions/core';

type Config = {
  accessToken: string
  githubToken: string
  labelConfigs: {id: string, branch: string, label: string}[]
  packageJsonFiles: {package: string, path: string}[]
}

let config: Config = {
  accessToken: '',
  githubToken: '',
  labelConfigs: [],
  packageJsonFiles: []
};

try {
  config = {
    accessToken: core.getInput('linear_access_token'),
    githubToken: core.getInput('GITHUB_TOKEN'),
    labelConfigs: JSON.parse(core.getInput('labels')),
    packageJsonFiles: JSON.parse(core.getInput('package_json_path'))
  }
} catch(err) {
  core.setFailed('Invalid inputs ' + err.message);
  process.exit();
}

export default config;