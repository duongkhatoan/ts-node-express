import _ from "lodash";



interface RequestType extends Request {
  token?: string;
  refreshToken?: string;
  user?: any;
}


const processValue = (value: any) => {
  return value;
}


const processOrAndFilter = (filter: any) => {
  const filters: any[] = [];
  for (const key in filter) {
    const obj = filter[key];
    Object.keys(obj).forEach((item) => {
      const k = item;
      if (key && k) {
        filters.push(processFilter({ [k]: obj[k] }));
      }
    });
  }
  return filters;
}

// Hàm xử lý key
const processKey = (key: string) => {
  if (key === "_id") {
    return key;
  }
  return key.replace(/_/g, ".");
}

// Hàm xử lý filter
const processFilter = (filter: any) => {
  let filters: any = {};
  let newFilters: any = {};

  for (const key in filter) {
    if (filter[key] === "") {
      // Do nothing
    } else if (key == "OR" || key == "or") {
      filters = { OR: processOrAndFilter(filter[key]) }
    } else if (key == "AND" || key == "and") {
      filters = { AND: processOrAndFilter(filter[key]) }
    } else if (key.includes("_eq")) {
      // graphql = filter: { amount_eq: 20}
      // output = { email: { equals: 20 }}
      filters = { [processKey(key.replace("_eq", ""))]: { equals: processValue(filter[key]) } }
    } else if (key.includes("_ne")) {
      // not equal !=
      // graphql = filter: { amount_ne: 20}
      // output = { email: { not: 20 }}
      filters = { [processKey(key.replace("_ne", ""))]: { not: processValue(filter[key]) } }
    } else if (key.includes("_lte")) {
      // less than equal <=
      // graphql = filter: { amount_lte: 20}
      // output = { email: { lte: 20 }}
      filters = { [processKey(key.replace("_lte", ""))]: { lte: processValue(filter[key]) } }
    } else if (key.includes("_gte")) {
      // greater than equal >=
      // graphql = filter: { amount_gte: 20}
      // output = { email: { gte: 20 }}
      filters = { [processKey(key.replace("_gte", ""))]: { gte: processValue(filter[key]) } }
    } else if (key.includes("_lt")) {
      // less than <
      // graphql = filter: { amount_lt: 20}
      // output = { email: { lt: 20 }}
      filters = { [processKey(key.replace("_lt", ""))]: { lt: processValue(filter[key]) } }
    } else if (key.includes("_gt")) {
      // greater than >
      // graphql = filter: { amount_gt: 20}
      // output = { email: { lt: 20 }}
      filters = { [processKey(key.replace("_gt", ""))]: { gt: processValue(filter[key]) } }
    } else if (key.includes("_in")) {
      // same like IN sql
      // graphql = filter: { email_in: ["chardy@gmail.com", "abc@gmail.com"]}
      // output = { email: { in: ["chardy@gmail.com", "abc@gmail.com"] }}
      filters = { [processKey(key.replace("_in", ""))]: { in: processValue(filter[key]) } }
    } else if (key.includes("_nin")) {
      // not in
      // graphql = filter: { email_nin: ["chardy@gmail.com", "abc@gmail.com"]}
      // output = { email: { notIn: ["chardy@gmail.com", "abc@gmail.com"] }}
      filters = { [processKey(key.replace("_nin", ""))]: { notIn: processValue(filter[key]) } }
    } else if (key.includes("_contains")) {
      // same like LIKE in SQL
      // graphql = filter: { email_contains: "chardy@gmail.com" }
      // output = {"email":{ contains: "chardy@gmail.com"}}
      filters = { [processKey(key.replace("_contains", ""))]: { contains: filter[key] } }
    }
    else if (key.includes("_regex")) {
      // console.log(key);
      // console.log(filter[key]);

      // some like contains but in prisma u need to add mode insensitive
      // graphql = filter: { email_regex: "abc" }
      // output = {"email":{contains:"abc",mode:"insensitive"}}
      filters = { [processKey(key.replace("_regex", ""))]: { contains: `${filter[key]}`, mode: "insensitive" } }
      
      
    }
    else {
      // no regex search
      // graphql = filter: {email:"chardy@gmail.com"}
      // output = { "email":"chardy@gmail.com" }
      filters = { [processKey(key)]: processValue(filter[key]) }
    }

    newFilters = _.merge(newFilters, filters)
  }

  return newFilters;
}

// Export module
export default (filter: any, withDeletedAt: boolean = false) => {
  
  const newFilters = processFilter(filter);
  return { ...newFilters, ...(withDeletedAt ? { deletedAt: { isSet: false } } : {}) };
}
