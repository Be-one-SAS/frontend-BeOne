import api from './api'

export const getParams = async (sedeId?: number | null) => {
    try {
        const response = await api.get('/quotation-params', {
            headers: { 'Content-Type': 'application/json' },
            params: sedeId ? { sedeId } : undefined,
        })
        return response
    } catch (error) {
        throw error
    }
}

export const updateParam = async (key: string, value: any, sedeId?: number | null) => {
    try {
        const response = await api.put(
            `/quotation-params/${key}`,
            { value, ...(sedeId ? { sedeId } : {}) },
            { headers: { 'Content-Type': 'application/json' } }
        )
        return response
    } catch (error) {
        throw error
    }
}

export const getCommissionTiers = async () => {
    try {
        const response = await api.get('/commission-tiers', {
            headers: { 'Content-Type': 'application/json' },
        })
        return response
    } catch (error) {
        throw error
    }
}

export const updateCommissionTier = async (id: number, data: { minPct?: number; maxPct?: number; comisionPct?: number }) => {
    try {
        const response = await api.put(
            `/commission-tiers/${id}`,
            data,
            { headers: { 'Content-Type': 'application/json' } }
        )
        return response
    } catch (error) {
        throw error
    }
}
