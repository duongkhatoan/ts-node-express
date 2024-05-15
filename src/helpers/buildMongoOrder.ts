const orderByField = (orderBy: string): { [key: string]: string } => {
    let h: { [key: string]: string } = {};
    if (orderBy.includes("_ASC")) {
        h = { [orderBy.replace("_ASC", "")]: "asc" };
    } else if (orderBy.includes("_DESC")) {
        h = { [orderBy.replace("_DESC", "")]: "desc" };
    }
    // console.log('Order by: ', JSON.stringify(h, null, 2))
    return h;
};

export const orderByFields = (orderBy: string | string[]): { [key: string]: string } => {
    if (Array.isArray(orderBy)) {
        return orderBy.reduce((prev, orderField) => ({ ...prev, ...orderByField(orderField) }), {});
    } else {
        return orderByField(orderBy);
    }
};

export { orderByField };
