const core = require('@actions/core');
const github = require('@actions/github');

try {
  const nameToGreet = core.getInput('your_name');
  const linearAccessToken = core.getInput('linear_access_token');
  console.log('got access token?', (linearAccessToken || '').length);
  console.log(`Hello ${nameToGreet}!`);
  const time = (new Date()).toTimeString();
  core.setOutput("time", time);
  const {payload} = github.context;
  const payloadStr = JSON.stringify(github.context.payload, undefined, 2)

  console.log('event is ', github.context.eventName);
  if(github.context.eventName === 'push') {
    payload.commits.forEach(commit => console.log(commit.message));
  } else if(github.context.eventName === 'pull_request') {
    console.log('pull request');
  }
  console.log(`The event payload: ${payloadStr}`);
  
} catch (error) {
  core.setFailed(error.message);
}
