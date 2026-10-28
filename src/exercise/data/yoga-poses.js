import data from "./yoga-poses.json";
export const yogaPoses = data.poses;
export const yogaCategories = [...new Set(yogaPoses.flatMap(p => p.categories))];
export const findYogaPoses = ({ query = "", category = "전체" } = {}) => yogaPoses.filter(p => (category === "전체" || p.categories.includes(category)) && [p.nameKo,p.sanskrit,p.nameEn].join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase()));
