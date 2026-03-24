import { simpleGit } from 'simple-git'

export async function gitBranchExists(branchName: string): Promise<boolean> {
  const git = simpleGit()
  const branchSummary = await git.branchLocal()
  return branchSummary.all.includes(branchName)
}

export async function gitCurrentBranch() {
  const git = simpleGit()
  return (await git.branchLocal()).current
}
