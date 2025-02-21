import { endpoints } from "../constants"
import { DELETE_API, GET_API } from "../request"

export const getResources = async (params?: any) => {
    const endpoint = endpoints.resources.get;
    const { data } = await GET_API(`${endpoint}?${new URLSearchParams({ ...params })}`);
    return data || {};
}

export const getResourcesByCategory = async (category_id: string, params?: any) => {
    const endpoint = endpoints.resources.getResourcesByCategory(category_id);
    const { data } = await GET_API(`${endpoint}?${new URLSearchParams({ ...params })}`);
    return data || {};
}

export const getSingleResource = async (resource_id: string) => {
    if (!resource_id) return null;
    const endpoint = endpoints.resources.getResource(resource_id);
    const { data, status } = await GET_API(endpoint);
    return status === 200 ? data : null;
}

export const deleteResource = async (resource_id: string) => {
    if (!resource_id) return null;
    const endpoint = endpoints.resources.delete(resource_id);
    const { status } = await DELETE_API(endpoint);
    return status;
}