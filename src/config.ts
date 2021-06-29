type Config = {
  accessToken: string
  labelConfigs: {id: string, branch: string, label: string}[]
  packageJsonFiles: {package: string, path: string}[]
}

export default {
  _values: {},
  setValues(values: Config) {
    this.values = values;
  },
  getValues(): Config {
    return this._values;
  }
};