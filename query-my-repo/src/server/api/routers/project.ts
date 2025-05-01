import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { pollCommits } from "@/lib/github";

export const projectRouter = createTRPCRouter ({
    createProject: protectedProcedure
    .input(z.object({
        name: z.string(),
        githubUrl: z.string(),
        githubToken: z.string().optional()
    }))
    .mutation(async({ctx,input}) => {
        const project = await ctx.db.project.create({
            data: {
                gitHubUrl: input.githubUrl,
                name: input.name,
                userToProjects: {
                    create: {
                        userId: ctx.user.userId!,
                    }
                }
            }
        })
        await pollCommits(project.id);
        return project;
    }),
    getProjects: protectedProcedure
    .query(async ({ctx}) => {
        return await ctx.db.project.findMany({
            where: {
                userToProjects: {
                    some: {
                        userId: ctx.user.userId!
                    }
                },
                deletedAt: null
            }
        })
    }),
    getCommits: protectedProcedure.input(
        z.object({
          selectedProjectId: z.string(),
        })
      ).query(async ({ ctx, input }) => {
        pollCommits(input.selectedProjectId).then().catch(console.error)
        return await ctx.db.commit.findMany({
          where: {
            projectId: input.selectedProjectId,
          },
        });
      })
      
})