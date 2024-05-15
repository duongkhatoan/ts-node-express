import { generateSlug } from "~/utils/slug";

export const handleSlug = async (client: any, model: string, value: any, fieldName: string) => {
    if (!value.slug) {
        value.slug = await generateSlug(client[model], value[fieldName] as string);
    } else {
        const existingSlug = await client[model].findFirst({ where: { slug: value.slug } });
        if (existingSlug) {
            throw new Error('Slug already exists');
        }
    }
    return value.slug;
};

export function tryParseJSON(data: any) {
    let result = null
    if (typeof data == "object") return data
    try {
        const parsed = JSON.parse(`${data}` || "")
        if (parsed) {
            result = parsed
        }
        return result || null
    } catch (error) {
        return null
    }
}
export function sanitizeRegex(str: string) {
    if (!str) {
        return ""
    }

    const trimmedStr = str.trim()
    const sanitizedStr = trimmedStr.replace(/[#-.]|[[-^]|[?|{}]/g, "\\$&")

    return sanitizedStr
}