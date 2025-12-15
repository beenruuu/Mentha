/**
 * Export Service - Frontend API client for CSV/ZIP exports
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export type ExportType = 'keywords' | 'competitors' | 'visibility' | 'mentions' | 'prompts' | 'sentiment' | 'all'

export interface ExportOptions {
    days?: number  // For visibility and mentions exports
    includeHistory?: boolean  // For keywords export
}

export const exportService = {
    /**
     * Export keywords data as CSV
     */
    async exportKeywords(brandId: string, includeHistory: boolean = false): Promise<Blob> {
        const url = `${API_URL}/api/export/${brandId}/keywords?include_history=${includeHistory}`
        return await downloadBlob(url)
    },

    /**
     * Export competitors data as CSV
     */
    async exportCompetitors(brandId: string): Promise<Blob> {
        const url = `${API_URL}/api/export/${brandId}/competitors`
        return await downloadBlob(url)
    },

    /**
     * Export visibility history as CSV
     */
    async exportVisibility(brandId: string, days: number = 90): Promise<Blob> {
        const url = `${API_URL}/api/export/${brandId}/visibility?days=${days}`
        return await downloadBlob(url)
    },

    /**
     * Export brand mentions as CSV
     */
    async exportMentions(brandId: string, days: number = 90): Promise<Blob> {
        const url = `${API_URL}/api/export/${brandId}/mentions?days=${days}`
        return await downloadBlob(url)
    },

    /**
     * Export tracked prompts as CSV
     */
    async exportPrompts(brandId: string): Promise<Blob> {
        const url = `${API_URL}/api/export/${brandId}/prompts`
        return await downloadBlob(url)
    },

    /**
     * Export sentiment analysis history as CSV
     */
    async exportSentiment(brandId: string): Promise<Blob> {
        const url = `${API_URL}/api/export/${brandId}/sentiment`
        return await downloadBlob(url)
    },

    /**
     * Export all data as ZIP file
     */
    async exportAll(brandId: string): Promise<Blob> {
        const url = `${API_URL}/api/export/${brandId}/all`
        return await downloadBlob(url)
    },

    /**
     * Generic export function
     */
    async export(brandId: string, type: ExportType, options?: ExportOptions): Promise<Blob> {
        let url = `${API_URL}/api/export/${brandId}/${type}`

        const params = new URLSearchParams()
        if (options?.days) params.append('days', options.days.toString())
        if (options?.includeHistory) params.append('include_history', 'true')

        if (params.toString()) {
            url += `?${params.toString()}`
        }

        return await downloadBlob(url)
    },

    /**
     * Download export and trigger browser download
     */
    async downloadExport(brandId: string, type: ExportType, options?: ExportOptions): Promise<void> {
        const blob = await this.export(brandId, type, options)

        const filename = generateFilename(type)
        triggerDownload(blob, filename)
    }
}

/**
 * Helper to download a blob from URL
 */
async function downloadBlob(url: string): Promise<Blob> {
    const response = await fetch(url, {
        credentials: 'include'
    })

    if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
    }

    return await response.blob()
}

/**
 * Generate filename based on export type
 */
function generateFilename(type: ExportType): string {
    const date = new Date().toISOString().split('T')[0]

    if (type === 'all') {
        return `mentha_export_${date}.zip`
    }

    return `mentha_${type}_${date}.csv`
}

/**
 * Trigger browser download of blob
 */
function triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
}
