
export const formatString = (str: string) => {
  const formattedStr = str.split("_").join(" ");
  return formattedStr.charAt(0).toUpperCase() + formattedStr.slice(1);
};
