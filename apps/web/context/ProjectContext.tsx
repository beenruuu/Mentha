'use client';

import type React from 'react';
import { createContext, use, useCallback, useEffect, useState } from 'react';

import { fetchFromApi } from '@/lib/api';

interface Project {
    id: string;
    name: string;
    domain: string;
    competitors?: string[];
}

interface ProjectContextType {
    projects: Project[];
    selectedProject: Project | null;
    setSelectedProjectId: (id: string) => void;
    setSelectedProject: (project: Project) => void;
    refreshProjects: () => Promise<void>;
    isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadProjects = useCallback(async () => {
        try {
            const { data } = await fetchFromApi('/projects');
            setProjects(data);

            // Try to recover from localStorage or pick first
            const savedId = localStorage.getItem('mentha_project_id');
            if (savedId && data.find((p: Project) => p.id === savedId)) {
                setSelectedProjectId(savedId);
            } else if (data.length > 0) {
                setSelectedProjectId(data[0].id);
                localStorage.setItem('mentha_project_id', data[0].id);
            }
        } catch (e) {
            console.error('Failed to load projects', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

    const handleSetSelectedProjectId = (id: string) => {
        setSelectedProjectId(id);
        localStorage.setItem('mentha_project_id', id);
    };

    const handleSetSelectedProject = (project: Project) => {
        setProjects((prev) => {
            const exists = prev.find((p) => p.id === project.id);
            if (exists) return prev;
            return [...prev, project];
        });
        setSelectedProjectId(project.id);
        localStorage.setItem('mentha_project_id', project.id);
    };

    return (
        <ProjectContext.Provider
            value={{
                projects,
                selectedProject,
                setSelectedProjectId: handleSetSelectedProjectId,
                setSelectedProject: handleSetSelectedProject,
                refreshProjects: loadProjects,
                isLoading,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const context = use(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
}
