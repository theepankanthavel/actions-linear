# Github Actions for Linear

This package is to automate the process of adding labels to linear's issues.

In order for this to work we need to follow [Conventional Commit](https://www.conventionalcommits.org/) rules

## How it works

Whenever there is an event to repo, github will run all the workflows found in `.github/workflows`.
Action workflows usually refer a [repo](https://docs.github.com/en/actions/learn-github-actions/finding-and-customizing-actions#using-tags) or docker image.
But for this `Linear` integration the action is part of `lane-next` codebase, and it's referenced by `.github/workflows/linear.xml`

When a `push` happens to `protected` branch, this action will parse all the commits messages and get issue ids. Then it will use `linear` api to insert labels to the issue ids.
The format for the label is `live-in-{branch_name}`

### Special flags in footer

- `NO_ACTION` - You can add this flag as part of the footer's `ref` to instruct the action so that no labels will be added to those issue ids.
- `FEATURE_COMPLETE` If this flag set in the `ref` then this action will read the version in `packages/lane-shared/config/config.json` and add a label to all specified issue ids in the commit. The label name will be `verion-{version_name}`

## Development Setup

in the root of this repo run the following command

```bash
yarn
```

and to build the package

```bash
yarn workspace github-actions build
```

#Note
When you commit you also need to include `.dist` folder which contains application files as well as necessary `node_modules`

# References

- Discussion and definition is available [here](https://docs.google.com/document/d/1sBJekrWuojtlE0CyJeLwqMs8lP1ysVSstKrMNu8LeQo/edit#)
