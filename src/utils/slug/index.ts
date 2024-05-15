import slugify from 'slugify';

export const generateSlug = async <T extends { findFirst: (args: any) => Promise<any> }>(
    modal: T,
    title: string,
    index = 0
): Promise<string> => {
    let slug = slugify(title, { lower: true });
    if (index > 0) {
        slug = `${slug}-${index}`;
    }

    const existingSlug = await modal.findFirst({
        where: {
            slug
        }
    });
    if (existingSlug) {
        return generateSlug(modal, title, index + 1);
    }

    return slug;
};