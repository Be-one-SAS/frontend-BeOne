import api from './api'

export const getParams = async () => {
    try {
        const response = await api.get('/quotation-params', {
            headers: { 'Content-Type': 'application/json' },
        })
        return response
    } catch (error) {
        throw error
    }
}

export const updateParam = async (key: string, value: any) => {
    try {
        const response = await api.put(
            `/quotation-params/${key}`,
            { value },
            { headers: { 'Content-Type': 'application/json' } }
        )
        return response
    } catch (error) {
        throw error
    }
}
