import { db } from '../server/db'
import { Octokit } from 'octokit';
import axios from 'axios';
import { aiSummariseCommit } from './gemini'

export const octokit = new Octokit ({
    auth : process.env.GITHUB_TOKEN,
});


type Response = {
    commitMessage: string
    commitHash: string
    commitAuthorName: string
    commitAuthorAvatar: string
    commitDate: string
}

export const getCommitHashes = async (githubUrl: string): Promise<Response[]> => {
    const [owner, repo] = githubUrl.split('/').slice(-2);

    if(!owner || !repo) {
        throw new Error ('Invalid Github URL');
    }
    const { data } = await octokit.rest.repos.listCommits({
      owner: owner,
      repo: repo
    })
  
    const sortedCommits = data.sort((a: any, b: any) => 
      new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()
    ) as any[]
  
    return sortedCommits.slice(0, 10).map((commit: any) => ({
      commitHash: commit.sha as string,
      commitMessage: commit.commit?.message ?? '',
      commitAuthorName: commit.commit?.author?.name ?? '',
      commitAuthorAvatar: commit.author?.avatar_url ?? '',
      commitDate: commit.commit?.author?.date ?? '',
    })) 
}

// const githubUrl = 'https://github.com/svn2609/reactDashboard';
// (async () => {
//     try {
//       const data = await getCommitHashes(githubUrl)
//       console.log('Commit Hashes:', data)
//     } catch (error) {
//       console.error('Error:', error)
//     }
//   })()
  
export const pollCommits = async (projectId: string) => {
    const { project, githubUrl } = await fetchProjectGithubUrl(projectId);
    const commitHashes = await getCommitHashes(githubUrl);
    const unprocessedCommits = await filterUnprocessedCommits(projectId, commitHashes);
  
    const summaryResponses = await Promise.allSettled(
      unprocessedCommits.map(commit => {
        return summariseCommit(githubUrl, commit.commitHash);
      })
    );
  
    const summaries = summaryResponses.map(response => {
      if (response.status === "fulfilled") { 
        return response.value as string;
      }
      return "";
    });
  
    const commits = await db.commit.createMany({
      data: summaries.map((summary, index) => {
        console.log(`Processing Commit ${index}`)
        return {
          projectId: projectId,
          commitHash: unprocessedCommits[index]!.commitHash,
          commitMessage: unprocessedCommits[index]!.commitMessage,
          commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
          commitAuthorAvatar: unprocessedCommits[index]!.commitAuthorAvatar,
          commitDate: unprocessedCommits[index]!.commitDate,
          summary,
        };
      }),
    });
  
    return commits;
};
  
  
async function summariseCommit(githubUrl: string, commitHash: string) {
    // get the diff, then pass the diff into ai
    const { data } = await axios.get(`${githubUrl}/commit/${commitHash}.diff`, {
      headers: {
        Accept: 'application/vnd.github.v3.diff'
      }
    });
  
    return await aiSummariseCommit(data) || "";
  }
  

async function fetchProjectGithubUrl(projectId: string) {
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        gitHubUrl: true,
      },
    })
  
    if (!project?.gitHubUrl) {
      throw new Error("Project has no github url")
    }
  
    return { project, githubUrl: project?.gitHubUrl }
}
  


async function filterUnprocessedCommits(projectId: string, commitHashes: Response[]) {
    const processedCommits = await db.commit.findMany({
      where: { projectId },
    })
  
    const unprocessedCommits = commitHashes.filter((commit) => 
      !processedCommits.some((processedCommit) => 
        processedCommit.commitHash === commit.commitHash
      )
    )
    return unprocessedCommits;
}
  
// await pollCommits('cma0ec7tb0000y1dud7pyv5x0').then(console.log);