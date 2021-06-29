type Config = {
  accessToken: string
  labelConfigs: {id: string, branch: string, label: string}[]
  packageJsonFiles: {package: string, path: string}[]
}

let config: Config = {
  accessToken: '',
  labelConfigs: [],
  packageJsonFiles: []
}

export function init(values: Config) {
  config = values;
}

export default config;