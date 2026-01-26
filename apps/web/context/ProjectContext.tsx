"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchFromApi } from "@/lib/api";

interface Project {
    id: string;
    name: string;
    domain: string;
}

interface ProjectContextType {
    projects: Project[];
    selectedProject: Project | null;
    setSelectedProjectId: (id: string) => void;
    isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadProjects() {
            try {
                const { data } = await fetchFromApi("/projects");
                setProjects(data);

                // Try to recover from localStorage or pick first
                const savedId = localStorage.getItem("mentha_project_id");
                if (savedId && data.find((p: Project) => p.id === savedId)) {
                    setSelectedProjectId(savedId);
                } else if (data.length > 0) {
                    setSelectedProjectId(data[0].id);
                    localStorage.setItem("mentha_project_id", data[0].id);
                }
            } catch (e) {
                console.error("Failed to load projects", e);
            } finally {
                setIsLoading(false);
            }
        }
        loadProjects();
    }, []);

    const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

    const handleSetSelectedProjectId = (id: string) => {
        setSelectedProjectId(id);
        localStorage.setItem("mentha_project_id", id);
    };

    return (
        <ProjectContext.Provider
            value={{
                projects,
                selectedProject,
                setSelectedProjectId: handleSetSelectedProjectId,
                isLoading,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error("useProject must be used within a ProjectProvider");
    }
    return context;
}
