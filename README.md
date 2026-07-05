# Deploy to King's Landing

A GitHub Action that deploys a directory to [King's Landing](https://kingslanding.io).

This action is a thin composite wrapper around [`@kingslanding/cli`](https://www.npmjs.com/package/@kingslanding/cli). It runs `npx @kingslanding/cli deploy` internally, which uses presigned S3 uploads with parallel file transfers and automatic retries.

## Usage

```yaml
- name: Deploy to King's Landing
  uses: boxshopio/deploy-to-kingslanding@v2
  with:
    project: my-project
    directory: ./dist
    deploy-key: ${{ secrets.KL_DEPLOY_KEY }}
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `project` | Yes | — | Project name on King's Landing |
| `directory` | Yes | — | Path to the directory to deploy |
| `deploy-key` | Yes | — | Project deploy key (`kl_...`) |
| `api-url` | No | — | King's Landing API URL override |
| `cli-version` | No | `^0.3.0` | Version of `@kingslanding/cli` to install — an exact version (`0.3.0`), a range (`^0.3.0`), or `latest` |

### Choosing a CLI version

By default the action installs the latest `0.3.x` release of `@kingslanding/cli`, so patch fixes are picked up automatically while breaking changes are held back. To make deploys fully reproducible, pin an exact version:

```yaml
  with:
    project: my-project
    directory: ./dist
    deploy-key: ${{ secrets.KL_DEPLOY_KEY }}
    cli-version: 0.3.0
```

To always track the newest CLI (and accept breaking changes as they ship), set `cli-version: latest`.

## Outputs

| Output | Description |
|--------|-------------|
| `deployment-id` | The deployment ID |
| `project-url` | The live project URL |

## Setup

1. Create a project on [King's Landing](https://kingslanding.io)
2. Go to your project settings and generate a deploy key
3. Add the deploy key as a secret (`KL_DEPLOY_KEY`) in your GitHub repo
4. Add the action to your workflow

## Example

See [deploy-to-kingslanding-example](https://github.com/boxshopio/deploy-to-kingslanding-example) for a complete working example.
