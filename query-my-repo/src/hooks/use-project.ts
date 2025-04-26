import { api } from '@/trpc/react';
import React from 'react'
import { useLocalStorage } from 'usehooks-ts'

const useProject = () => {
    const {data: projects} = api.project.getProjects.useQuery();
    const [selectedProjectId, setSelectedProjectId]= useLocalStorage('qmr-projectId', ' ')
    const project = projects?.find( (project) => project.id === selectedProjectId)

    return {
        projects,
        project,
        selectedProjectId,
        setSelectedProjectId
    }
}

export default useProject