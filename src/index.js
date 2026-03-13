import * as core from '@actions/core'
import { deploy } from './deploy.js'

try {
  const result = await deploy({
    directory: core.getInput('directory', { required: true }),
    project: core.getInput('project', { required: true }),
    deployKey: core.getInput('deploy-key', { required: true }),
    apiUrl: core.getInput('api-url'),
  })

  core.setOutput('deployment-id', result.deploymentId)
  core.setOutput('project-url', result.projectUrl)
  core.info(result.message)
} catch (error) {
  core.setFailed(error.message)
}
